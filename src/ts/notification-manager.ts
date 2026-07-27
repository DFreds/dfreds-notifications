import iziToastModule from "izitoast";
import type { IziToast, IziToastPosition, IziToastSettings } from "izitoast";
import type { Notification, NotificationOptions } from "@client/applications/ui/notifications.mjs";
import { MODULE_ID } from "./constants.ts";
import { Settings } from "./settings.ts";

const iziToast = iziToastModule as unknown as IziToast;

type NotificationType = "info" | "warning" | "error" | "success";

/**
 * A developer-defined button rendered on a notification.
 */
interface NotificationAction {
    /** The button label, already localized */
    label: string;

    /** An optional Font Awesome icon class shown before the label */
    icon?: string;

    /** A callback invoked when the button is clicked */
    callback: (toastEl: HTMLElement, notification: Notification) => void;

    /** Whether clicking the button also dismisses the notification. Defaults to true. */
    dismissOnClick?: boolean;
}

interface NotifyOptions extends NotificationOptions {
    actions?: NotificationAction[];
}

interface NotificationUpdate {
    message?: string;
    pct?: number;
    localize?: boolean;
    escape?: boolean;
    clean?: boolean;
    format?: NotificationOptions["format"];
}

interface HistoryEntry {
    id: number;
    type: NotificationType;
    message: string;
    timestamp: number;
    actions: NotificationAction[];
    notification: Notification;
}

interface ManagedNotification extends Notification {
    type: NotificationType;
    actions: NotificationAction[];
    settings: IziToastSettings;
    toastEl?: HTMLDivElement;
}

const CONSOLE_METHODS: Record<NotificationType, string> = {
    info: "info",
    warning: "warn",
    error: "error",
    success: "info",
};

const ICONS: Record<NotificationType, string> = {
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
    error: "fa-solid fa-circle-exclamation",
    success: "fa-solid fa-check",
};

/**
 * An iziToast-backed replacement for `ui.notifications` that preserves the core
 * API while adding action buttons and a session history.
 */
class NotificationManager {
    #byId: Map<number, ManagedNotification> = new Map();

    #active: Set<number> = new Set();

    #queue: ManagedNotification[] = [];

    #history: Map<number, HistoryEntry> = new Map();

    #nextId: number = 1_000_000;

    #settings: Settings = new Settings();

    #onHistoryChange?: () => void;

    #onNotify?: (type: NotificationType) => void;

    /**
     * Registers a callback invoked whenever the history changes.
     */
    set onHistoryChange(callback: () => void) {
        this.#onHistoryChange = callback;
    }

    /**
     * Registers a callback invoked whenever a new notification is raised.
     */
    set onNotify(callback: (type: NotificationType) => void) {
        this.#onNotify = callback;
    }

    /**
     * Everything shown this session, oldest first.
     */
    get history(): readonly HistoryEntry[] {
        return [...this.#history.values()];
    }

    /**
     * Retrieves a single history entry by id.
     */
    getHistoryEntry(id: number): HistoryEntry | undefined {
        return this.#history.get(id);
    }

    /**
     * Removes a single entry from the session history, leaving any displayed
     * notification untouched.
     */
    removeFromHistory(id: number): void {
        if (!this.#history.delete(id)) return;

        this.#onHistoryChange?.();
    }

    /**
     * Discards the session history without affecting displayed notifications.
     */
    clearHistory(): void {
        this.#history.clear();
        this.#onHistoryChange?.();
    }

    /* -------------------------------------------- */
    /*  Core API parity                             */
    /* -------------------------------------------- */

    /**
     * Displays a notification, queueing it if the display is already full.
     *
     * @param message The message content, or a localization key when `localize` is set
     * @param type The notification type
     * @param options Additional options affecting the notification
     * @returns The registered notification
     */
    notify(message: string | object, type: NotificationType = "info", options: NotifyOptions = {}): Notification {
        const resolved = this.#resolveMessage(message, options);

        this.#nextId += 1;

        const notification: ManagedNotification = {
            id: this.#nextId,
            type,
            timestamp: Date.now(),
            message: resolved,
            error: message instanceof Error ? message : undefined,
            permanent: options.permanent ?? false,
            console: options.console ?? true,
            active: false,
            progress: options.progress ?? false,
            pct: 0,
            actions: options.actions ?? [],
            settings: {},
        };

        notification.remove = (): void => this.remove(notification);
        notification.update = (update: NotificationUpdate): void => this.update(notification, update);

        this.#byId.set(notification.id, notification);
        this.#pushHistory(notification);
        this.#enqueue(notification);

        return notification;
    }

    /**
     * Displays a notification with the "info" type.
     */
    info(message: string | object, options?: NotifyOptions): Notification {
        return this.notify(message, "info", options);
    }

    /**
     * Displays a notification with the "warning" type.
     */
    warn(message: string | object, options?: NotifyOptions): Notification {
        return this.notify(message, "warning", options);
    }

    /**
     * Displays a notification with the "error" type.
     */
    error(message: string | object, options?: NotifyOptions): Notification {
        return this.notify(message, "error", options);
    }

    /**
     * Displays a notification with the "success" type.
     */
    success(message: string | object, options?: NotifyOptions): Notification {
        return this.notify(message, "success", options);
    }

    /**
     * Whether the notification is still queued or displayed by this manager.
     */
    has(notification: number | Notification): boolean {
        return this.#byId.has(this.#idOf(notification));
    }

    /**
     * Dismisses a notification, whether it is displayed or still queued.
     */
    remove(notification: number | Notification): void {
        const id = this.#idOf(notification);
        const managed = this.#byId.get(id);
        if (!managed) return;

        if (managed.toastEl) {
            iziToast.hide(managed.settings, managed.toastEl, "api");
            return;
        }

        this.#queue = this.#queue.filter((queued) => queued.id !== id);
        this.#byId.delete(id);
    }

    /**
     * Dismisses every queued and displayed notification.
     */
    clear(): void {
        this.#queue = [];
        for (const id of [...this.#byId.keys()]) {
            this.remove(id);
        }
        this.#byId.clear();
        this.#active.clear();
    }

    /**
     * Applies a message or progress update to a displayed notification.
     */
    update(notification: number | Notification, update: NotificationUpdate): void {
        const managed = this.#byId.get(this.#idOf(notification));
        if (!managed) return;

        const { message, pct } = update;

        if (managed.progress && typeof pct === "number" && Number.isFinite(pct)) {
            managed.pct = Math.clamp(pct, 0, 1);
        }

        if (message) {
            managed.message = this.#resolveMessage(message, update);
            this.#syncHistory(managed);
        }

        this.#applyUpdate(managed);

        if (message) {
            this.#logToConsole(managed);
        }

        if (managed.pct === 1 && !managed.permanent) {
            window.setTimeout(() => this.remove(managed), 500);
        }
    }

    /* -------------------------------------------- */
    /*  Display                                     */
    /* -------------------------------------------- */

    #enqueue(notification: ManagedNotification): void {
        if (this.#active.size < this.#settings.maxActive) {
            this.#show(notification);
        } else {
            this.#queue.push(notification);
        }
    }

    #dequeue(): void {
        const next = this.#queue.shift();
        if (next) this.#show(next);
    }

    #show(notification: ManagedNotification): void {
        notification.active = true;
        this.#active.add(notification.id);

        const permanent = notification.permanent || notification.progress;

        notification.settings = {
            id: `${notification.id}`,
            class: `dfreds-notification dfreds-notification-${notification.type}`,
            // Suppresses iziToast's per-type palette so the stylesheet owns the colors
            color: "",
            message: notification.progress ? this.#progressHtml(notification) : notification.message,
            icon: ICONS[notification.type],
            position: this.#settings.position as IziToastPosition,
            timeout: permanent ? false : this.#settings.durationMs,
            close: true,
            progressBar: !permanent,
            buttons: this.#buildButtons(notification),
            onOpening: (_settings, toast): void => {
                notification.toastEl = toast;
            },
            onClosed: (): void => {
                this.#onClosed(notification);
            },
        };

        iziToast[notification.type](notification.settings);

        this.#logToConsole(notification);
    }

    #onClosed(notification: ManagedNotification): void {
        notification.active = false;
        notification.toastEl = undefined;
        this.#active.delete(notification.id);
        this.#byId.delete(notification.id);
        this.#dequeue();
    }

    #buildButtons(notification: ManagedNotification): IziToastSettings["buttons"] {
        return notification.actions.map((action) => {
            const icon = action.icon ? `<i class="${action.icon}"></i> ` : "";
            const html = `<button type="button" class="dfreds-notification-action">${icon}${action.label}</button>`;

            return [
                html,
                (instance, toast): void => {
                    action.callback(toast, notification);
                    if (action.dismissOnClick !== false) {
                        instance.hide(notification.settings, toast, "button");
                    }
                },
                false,
            ];
        });
    }

    /* -------------------------------------------- */
    /*  Progress                                    */
    /* -------------------------------------------- */

    #progressHtml(notification: ManagedNotification): string {
        const pct = Math.round(notification.pct * 100);
        return [
            `<span class="dfreds-notification-progress">`,
            `<span class="dfreds-notification-progress-label">${notification.message}</span>`,
            `<span class="dfreds-notification-progress-bar">`,
            `<span class="dfreds-notification-progress-fill" style="width: ${pct}%"></span>`,
            `</span>`,
            `</span>`,
        ].join("");
    }

    #applyUpdate(notification: ManagedNotification): void {
        const toastEl = notification.toastEl;
        if (!toastEl) return;

        if (!notification.progress) {
            const body = toastEl.querySelector<HTMLElement>(".iziToast-message");
            if (body) body.innerHTML = notification.message;
            return;
        }

        const label = toastEl.querySelector<HTMLElement>(".dfreds-notification-progress-label");
        if (label) label.innerHTML = notification.message;

        const fill = toastEl.querySelector<HTMLElement>(".dfreds-notification-progress-fill");
        if (fill) fill.style.width = `${Math.round(notification.pct * 100)}%`;
    }

    /* -------------------------------------------- */
    /*  Message handling                            */
    /* -------------------------------------------- */

    #resolveMessage(message: string | object, options: NotifyOptions): string {
        const { localize = false, escape = true, format } = options;
        const raw = typeof message === "string" ? message : String(message);

        let clean = options.clean ?? true;
        let data = format;

        if (format) {
            if (escape) {
                data = this.#escapeValues(format);
                if (game.i18n.has(raw)) clean = false;
            }
        } else if (localize && game.i18n.has(raw)) {
            clean = false;
        }

        const localized = game.i18n.localize(raw, data);

        return clean ? foundry.utils.cleanHTML(localized) : localized;
    }

    #escapeValues(format: NotificationOptions["format"]): Record<string, string> {
        return Object.entries(format ?? {}).reduce<Record<string, string>>((escaped, [key, value]) => {
            escaped[key] = foundry.utils.escapeHTML(value);
            return escaped;
        }, {});
    }

    #logToConsole(notification: ManagedNotification): void {
        if (!notification.console) return;

        const method = CONSOLE_METHODS[notification.type];
        const fn = method in console ? method : "log";

        (console as unknown as Record<string, (...args: any[]) => void>)[fn](
            `${MODULE_ID} |`,
            notification.error ?? notification.message,
        );
    }

    /* -------------------------------------------- */
    /*  History                                     */
    /* -------------------------------------------- */

    #pushHistory(notification: ManagedNotification): void {
        const maxHistory = 200;

        this.#history.set(notification.id, {
            id: notification.id,
            type: notification.type,
            message: notification.message,
            timestamp: notification.timestamp,
            actions: notification.actions,
            notification,
        });

        // A Map iterates in insertion order, so the first key is the oldest
        while (this.#history.size > maxHistory) {
            const oldest = this.#history.keys().next().value;
            if (oldest === undefined) break;

            this.#history.delete(oldest);
        }

        this.#onHistoryChange?.();
        this.#onNotify?.(notification.type);
    }

    #syncHistory(notification: ManagedNotification): void {
        const entry = this.#history.get(notification.id);
        if (!entry) return;

        entry.message = notification.message;
        this.#onHistoryChange?.();
    }

    #idOf(notification: number | Notification): number {
        return typeof notification === "number" ? notification : notification.id;
    }
}

/**
 * The singleton instance of the notification manager, which is used by the module API and libWrapper hooks.
 */
const notificationManager = new NotificationManager();

export { NotificationManager, notificationManager };
export type { HistoryEntry, NotificationAction, NotificationType, NotificationUpdate, NotifyOptions };

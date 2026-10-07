import type { ApplicationConfiguration, ApplicationRenderContext } from "@client/applications/_types.mjs";
import type { HandlebarsRenderOptions } from "@client/applications/api/_module.mjs";
import { MODULE_ID } from "../constants.ts";
import { HistoryEntry, ICONS, NotificationType, notificationManager } from "../notification-manager.ts";
import type { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
import { Settings } from "../settings.ts";
import { clearUnread } from "./unread-pip.ts";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;

interface HistoryRow {
    id: number;
    type: NotificationType;
    icon: string;
    message: string;
    timeSince: string;
    timestamp: string;
    muted: boolean;
    actions: { index: number; label: string; icon?: string }[];
}

/**
 * A sidebar tab listing the notifications shown this session, so a user who
 * missed a toast can still read it and use its action buttons.
 */
class NotificationHistory extends HandlebarsApplicationMixin(AbstractSidebarTab) {
    refresh: () => void;

    constructor(options?: DeepPartial<ApplicationConfiguration>) {
        super(options);

        this.refresh = foundry.utils.debounce(this.render.bind(this), 30);
    }

    static override tabName: string = "dfredsNotifications";

    static override DEFAULT_OPTIONS: DeepPartial<ApplicationConfiguration> = {
        classes: ["directory", "flexcol", "dfreds-notifications-app"],
        window: {
            title: "DFredsNotifications.AppName",
            icon: "fa-solid fa-bell",
        },
        actions: {
            clearHistory: NotificationHistory.#onClearHistory,
            runAction: NotificationHistory.#onRunAction,
        },
    };

    static override PARTS = {
        header: {
            template: `modules/${MODULE_ID}/templates/notifications-app/header.hbs`,
        },
        directory: {
            template: `modules/${MODULE_ID}/templates/notifications-app/directory.hbs`,
            scrollable: [""],
        },
    };

    protected override async _preparePartContext(
        partId: string,
        context: ApplicationRenderContext,
        options: HandlebarsRenderOptions,
    ): Promise<ApplicationRenderContext> {
        await super._preparePartContext(partId, context, options);

        if (partId === "directory") {
            Object.assign(context, { entries: this.#buildRows() });
        }

        return context;
    }

    protected override async _onFirstRender(
        context: ApplicationRenderContext,
        options: HandlebarsRenderOptions,
    ): Promise<void> {
        await super._onFirstRender(context, options);

        this._createContextMenu(this._getEntryContextOptions, ".directory-item[data-entry-id]", {
            fixed: true,
        });

        if (this.isPopout) return;

        setInterval(this.#updateTimestamps.bind(this), 10_000);
    }

    protected override _onActivate(): void {
        super._onActivate();

        clearUnread();
        this.refresh();
    }

    protected override async _onRender(
        context: ApplicationRenderContext,
        options: HandlebarsRenderOptions,
    ): Promise<void> {
        await super._onRender(context, options);

        if (this.isPopout) clearUnread();
    }

    _getEntryContextOptions(): ContextMenuEntry[] {
        const settings = new Settings();
        const isMuted = (target: HTMLElement): boolean => {
            const entry = this.#entryFrom(target);
            return !!entry && settings.mutedMessages.includes(entry.muteKey);
        };

        return [
            {
                label: "DFredsNotifications.Mute",
                icon: "fa-solid fa-bell-slash",
                visible: (target: HTMLElement) => !isMuted(target),
                onClick: async (_event: PointerEvent, target: HTMLElement) => {
                    const entry = this.#entryFrom(target);
                    if (!entry) return;

                    await settings.setMutedMessages([...settings.mutedMessages, entry.muteKey]);
                    this.refresh();
                },
            },
            {
                label: "DFredsNotifications.Unmute",
                icon: "fa-solid fa-bell",
                visible: isMuted,
                onClick: async (_event: PointerEvent, target: HTMLElement) => {
                    const entry = this.#entryFrom(target);
                    if (!entry) return;

                    await settings.setMutedMessages(
                        settings.mutedMessages.filter((message) => message !== entry.muteKey),
                    );
                    this.refresh();
                },
            },
            {
                label: "SIDEBAR.Delete",
                icon: "fa-solid fa-trash",
                onClick: (_event: PointerEvent, target: HTMLElement) => {
                    const entry = this.#entryFrom(target);
                    if (!entry) return;

                    notificationManager.removeFromHistory(entry.id);
                },
            },
        ];
    }

    #entryFrom(target: HTMLElement): HistoryEntry | undefined {
        const id = Number(target.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId);
        return notificationManager.getHistoryEntry(id);
    }

    #updateTimestamps(): void {
        const entries = document.querySelectorAll<HTMLElement>(
            ".dfreds-notifications-app .notification-entry[data-entry-id]",
        );

        for (const entry of entries) {
            const historyEntry = notificationManager.getHistoryEntry(Number(entry.dataset.entryId));
            if (!historyEntry) continue;

            const time = entry.querySelector(".notification-entry-time");
            if (time) time.textContent = foundry.utils.timeSince(new Date(historyEntry.timestamp));
        }
    }

    #buildRows(): HistoryRow[] {
        const mutedMessages = new Settings().mutedMessages;

        return notificationManager.history
            .toReversed()
            .map((entry) => this.#buildRow(entry, mutedMessages.includes(entry.muteKey)));
    }

    #buildRow(entry: HistoryEntry, muted: boolean): HistoryRow {
        const date = new Date(entry.timestamp);

        return {
            id: entry.id,
            type: entry.type,
            icon: ICONS[entry.type],
            message: entry.message,
            timeSince: foundry.utils.timeSince(date),
            timestamp: date.toLocaleString(),
            muted,
            actions: entry.actions.map((action, index) => ({
                index,
                label: action.label,
                icon: action.icon,
            })),
        };
    }

    static async #onClearHistory(): Promise<void> {
        notificationManager.clearHistory();
    }

    static async #onRunAction(_event: PointerEvent, target: HTMLElement): Promise<void> {
        const id = Number(target.dataset.notificationId);
        const index = Number(target.dataset.actionIndex);

        const entry = notificationManager.getHistoryEntry(id);
        if (!entry) return;

        entry.actions[index]?.callback(target, entry.notification);
    }
}

export { NotificationHistory };

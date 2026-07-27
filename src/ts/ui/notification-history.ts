import type { ApplicationConfiguration, ApplicationRenderContext } from "@client/applications/_types.mjs";
import type { HandlebarsRenderOptions } from "@client/applications/api/_module.mjs";
import { MODULE_ID } from "../constants.ts";
import { HistoryEntry, NotificationType, notificationManager } from "../notification-manager.ts";
import type { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
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
    actions: { index: number; label: string; icon?: string }[];
}

const ICONS: Record<NotificationType, string> = {
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
    error: "fa-solid fa-circle-exclamation",
    success: "fa-solid fa-check",
};

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

    /** How often, in milliseconds, to update timestamps */
    static UPDATE_TIMESTAMP_FREQUENCY = 1000 * 10;

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

        setInterval(this.#updateTimestamps.bind(this), NotificationHistory.UPDATE_TIMESTAMP_FREQUENCY);
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
        return [
            {
                label: "SIDEBAR.Delete",
                icon: "fa-solid fa-trash",
                onClick: (_event: PointerEvent, target: HTMLElement) => {
                    const id = Number(target.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId);
                    if (!Number.isFinite(id)) return;

                    notificationManager.removeFromHistory(id);
                },
            },
        ];
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
        return notificationManager.history.toReversed().map((entry) => this.#buildRow(entry));
    }

    #buildRow(entry: HistoryEntry): HistoryRow {
        const date = new Date(entry.timestamp);

        return {
            id: entry.id,
            type: entry.type,
            icon: ICONS[entry.type],
            message: entry.message,
            timeSince: foundry.utils.timeSince(date),
            timestamp: date.toLocaleString(),
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

    static async #onRunAction(...args: any[]): Promise<void> {
        const [, target] = args as [PointerEvent, HTMLElement];
        const thisClass = this as unknown as NotificationHistory;

        return thisClass._onRunAction(target);
    }

    _onRunAction(target: HTMLElement): void {
        const id = Number(target.dataset.notificationId);
        const index = Number(target.dataset.actionIndex);

        const entry = notificationManager.getHistoryEntry(id);
        if (!entry) return;

        entry.actions[index]?.callback(target, entry.notification);
    }
}

export { NotificationHistory };

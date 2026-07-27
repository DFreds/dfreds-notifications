import type Module from "@client/packages/module.d.mts";
import type { HistoryEntry, NotificationManager } from "./notification-manager.ts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {
    /** The notification manager backing `ui.notifications` */
    notifications: NotificationManager;

    /** Everything shown this session, oldest first */
    readonly history: readonly HistoryEntry[];

    clearHistory(): void;
}

export { type ThisModule, type ThisApi };

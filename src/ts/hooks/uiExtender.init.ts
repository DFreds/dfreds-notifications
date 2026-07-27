import { MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";
import { NotificationHistory } from "../ui/notification-history.ts";

/**
 * Registers the notification history sidebar tab
 */
const UiExtenderInit: Listener = {
    listen(): void {
        Hooks.once("uiExtender.init", (uiExt: any) => {
            const uiExtender = uiExt as UiExtender;
            uiExtender.registerDirectory({
                moduleId: MODULE_ID,
                id: NotificationHistory.tabName,
                tooltip: "DFredsNotifications.AppName",
                icon: "fas fa-bell",
                before: "settings",
                applicationClass: NotificationHistory,
            });
        });
    },
};

export { UiExtenderInit };

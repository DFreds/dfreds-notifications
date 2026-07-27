import { ThisModule } from "../api.ts";
import { MODULE_ID } from "../constants.ts";
import { notificationManager } from "../notification-manager.ts";
import { Settings } from "../settings.ts";
import { renderAppIfOpen } from "../ui/render-app-if-open.ts";
import { markUnread } from "../ui/unread-pip.ts";
import { Listener } from "./index.ts";

/**
 * Registers settings and the module API
 */
const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();

            notificationManager.onHistoryChange = renderAppIfOpen;
            notificationManager.onNotify = markUnread;

            (game.modules.get(MODULE_ID) as ThisModule).api = {
                notifications: notificationManager,
                get history() {
                    return notificationManager.history;
                },
                clearHistory(): void {
                    notificationManager.clearHistory();
                },
            };
        });
    },
};

export { Init };

import type { Notification } from "@client/applications/ui/notifications.mjs";
import { libWrapper } from "@static/lib/shim.ts";
import { MODULE_ID } from "../constants.ts";
import { error } from "../logger.ts";
import { NotificationType, NotifyOptions, notificationManager } from "../notification-manager.ts";
import { Listener } from "./index.ts";

/**
 * Wraps the core notification API so it renders through this module
 */
const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", () => {
            if (BUILD_MODE === "development") {
                CONFIG.debug.hooks = true;
            }

            libWrapper.register(
                MODULE_ID,
                "foundry.applications.ui.Notifications.prototype.notify",
                function (
                    wrapped: (
                        message: string | object,
                        type: NotificationType,
                        options?: NotifyOptions,
                    ) => Notification,
                    message: string | object,
                    type: NotificationType = "info",
                    options: NotifyOptions = {},
                ): Notification {
                    try {
                        return notificationManager.notify(message, type, options);
                    } catch (e) {
                        error(`Failed to render notification, falling back to core: ${e}`);
                        return wrapped(message, type, options);
                    }
                },
            );

            libWrapper.register(
                MODULE_ID,
                "foundry.applications.ui.Notifications.prototype.remove",
                function (
                    wrapped: (notification: number | Notification) => void,
                    notification: number | Notification,
                ): void {
                    if (notificationManager.has(notification)) {
                        notificationManager.remove(notification);
                        return;
                    }
                    wrapped(notification);
                },
            );

            libWrapper.register(
                MODULE_ID,
                "foundry.applications.ui.Notifications.prototype.update",
                function (
                    wrapped: (notification: number | Notification, update: { message?: string; pct?: number }) => void,
                    notification: number | Notification,
                    update: { message?: string; pct?: number },
                ): void {
                    if (notificationManager.has(notification)) {
                        notificationManager.update(notification, update);
                        return;
                    }
                    wrapped(notification, update);
                },
            );

            libWrapper.register(
                MODULE_ID,
                "foundry.applications.ui.Notifications.prototype.clear",
                function (wrapped: () => void): void {
                    notificationManager.clear();
                    wrapped();
                },
                "WRAPPER",
            );
        });
    },
};

export { Setup };

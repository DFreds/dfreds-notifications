import { NotificationHistory } from "./notification-history.ts";

/**
 * Finds the notification history sidebar tab, if it has been constructed
 *
 * @returns the sidebar tab instance, or undefined before the sidebar exists
 */
function getNotificationHistory(): NotificationHistory | undefined {
    return foundry.applications.instances.get(NotificationHistory.tabName) as unknown as
        | NotificationHistory
        | undefined;
}

export { getNotificationHistory };

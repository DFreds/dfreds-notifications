import { getNotificationHistory } from "./get-notification-history.ts";

/**
 * Re-renders the notification history sidebar tab if it is currently active, or
 * its popout if one is open
 */
function renderAppIfOpen(): void {
    const notificationHistory = getNotificationHistory();
    if (!notificationHistory) return;

    if (notificationHistory.active) {
        notificationHistory.refresh();
        return;
    }

    const popout = notificationHistory.popout;
    if (popout?.rendered) popout.refresh();
}

export { renderAppIfOpen };

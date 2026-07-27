import { UNREAD_PIP_LEVELS } from "../constants.ts";
import type { UnreadPipLevel } from "../constants.ts";
import { NotificationType } from "../notification-manager.ts";
import { Settings } from "../settings.ts";
import { getNotificationHistory } from "./get-notification-history.ts";
import { NotificationHistory } from "./notification-history.ts";

const settings = new Settings();

const TYPE_RANK: Record<NotificationType, number> = {
    info: 0,
    success: 0,
    warning: 1,
    error: 2,
};

const LEVEL_RANK: Record<UnreadPipLevel, number> = {
    [UNREAD_PIP_LEVELS.ALL]: 0,
    [UNREAD_PIP_LEVELS.WARNING]: 1,
    [UNREAD_PIP_LEVELS.ERROR]: 2,
    [UNREAD_PIP_LEVELS.NONE]: Number.POSITIVE_INFINITY,
};

let unread = false;

function isHistoryVisible(): boolean {
    const notificationHistory = getNotificationHistory();
    if (!notificationHistory) return false;

    if (notificationHistory.popout?.rendered) return true;

    return notificationHistory.active && ui.sidebar?.rendered === true && ui.sidebar.expanded;
}

/**
 * Applies the current unread state to the sidebar tab, doing nothing if the
 * sidebar has not rendered yet
 */
function syncUnreadPip(): void {
    const selector = `#sidebar .tabs [data-tab="${NotificationHistory.tabName}"] + .notification-pip`;

    document.querySelector(selector)?.classList.toggle("active", unread);
}

/**
 * Marks the history unread, unless the type is below the configured threshold
 * or the history is already visible
 *
 * @param type The type of the notification that was raised
 */
function markUnread(type: NotificationType): void {
    if (TYPE_RANK[type] < LEVEL_RANK[settings.unreadPipLevel]) return;
    if (isHistoryVisible()) return;

    unread = true;
    syncUnreadPip();
}

/**
 * Clears the unread state, hiding the indicator on the sidebar tab
 */
function clearUnread(): void {
    unread = false;
    syncUnreadPip();
}

/**
 * Re-evaluates the unread state after the sidebar expands or collapses,
 * clearing it if the history has become visible
 */
function refreshUnread(): void {
    if (isHistoryVisible()) {
        clearUnread();
        return;
    }

    syncUnreadPip();
}

export { clearUnread, markUnread, refreshUnread, syncUnreadPip };

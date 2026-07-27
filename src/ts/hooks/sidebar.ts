import { Listener } from "./index.ts";
import { refreshUnread, syncUnreadPip } from "../ui/unread-pip.ts";

/**
 * Keeps the unread indicator in sync with the sidebar
 */
const Sidebar: Listener = {
    listen(): void {
        Hooks.on("renderSidebar", () => {
            syncUnreadPip();
        });

        Hooks.on("collapseSidebar", () => {
            refreshUnread();
        });
    },
};

export { Sidebar };

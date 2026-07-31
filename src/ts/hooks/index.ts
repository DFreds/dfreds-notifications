import { CameraDock } from "./cameraDock.ts";
import { Init } from "./init.ts";
import { Setup } from "./setup.ts";
import { Sidebar } from "./sidebar.ts";
import { UiExtenderInit } from "./uiExtender.init.ts";

interface Listener {
    listen(): void;
}

const HooksNotifications: Listener = {
    listen(): void {
        const listeners: Listener[] = [Init, UiExtenderInit, Setup, Sidebar, CameraDock];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksNotifications };
export type { Listener };

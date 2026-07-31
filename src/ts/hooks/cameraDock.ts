import { syncDockOffsets, watchDockOffsets } from "../ui/dock-offsets.ts";
import { Listener } from "./index.ts";

/**
 * Keeps notifications clear of the A/V camera dock, whichever edge it is docked
 * to
 */
const CameraDock: Listener = {
    listen(): void {
        Hooks.once("ready", () => {
            watchDockOffsets();
        });

        // Moving the dock between opposite edges leaves the interface the same
        // size, so the resize observer alone would miss it
        Hooks.on("renderCameraViews", () => {
            syncDockOffsets();
        });
    },
};

export { CameraDock };

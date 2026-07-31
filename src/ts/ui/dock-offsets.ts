/**
 * The A/V camera dock is a flex sibling of `#interface`, so docking it shrinks
 * the game interface away from one viewport edge. The toast wrappers are fixed
 * to the viewport and would otherwise sit on top of the dock, so the gap is
 * measured here and published as CSS variables the stylesheet pads by.
 */

let observer: ResizeObserver | undefined;

/**
 * Measures how far the game interface sits from each viewport edge and
 * publishes the result to the document body
 */
function syncDockOffsets(): void {
    const gameInterface = document.getElementById("interface");
    if (!gameInterface) return;

    const { top, right, bottom, left } = gameInterface.getBoundingClientRect();
    const style = document.body.style;

    style.setProperty("--dfreds-notification-dock-top", toPx(top));
    style.setProperty("--dfreds-notification-dock-right", toPx(window.innerWidth - right));
    style.setProperty("--dfreds-notification-dock-bottom", toPx(window.innerHeight - bottom));
    style.setProperty("--dfreds-notification-dock-left", toPx(left));
    style.setProperty("--dfreds-notification-hotbar-height", toPx(measureHotbarHeight(bottom)));
}

/**
 * Measures how far the macro bar rises above the bottom of the game interface.
 * Core's `--hotbar-height` is a fixed 52px that no longer matches the rendered
 * bar, which is taller, carries a bottom margin, and scales with the UI.
 */
function measureHotbarHeight(interfaceBottom: number): number {
    const hotbar = document.getElementById("hotbar");
    if (!hotbar) return 0;

    const { top, width, height } = hotbar.getBoundingClientRect();

    // A hidden bar still has a rect, just an empty one
    if (width === 0 && height === 0) return 0;

    return interfaceBottom - top;
}

/**
 * Starts re-measuring whenever the game interface or the macro bar resizes,
 * which covers the dock appearing, minimizing, and hiding, the macro bar
 * switching between its compact and full layouts, and the window resizing.
 * Observing also fires an initial measurement.
 */
function watchDockOffsets(): void {
    const gameInterface = document.getElementById("interface");
    if (!gameInterface) return;

    observer ??= new ResizeObserver(() => {
        syncDockOffsets();
    });

    observer.disconnect();
    observer.observe(gameInterface);

    const hotbar = document.getElementById("hotbar");
    if (hotbar) observer.observe(hotbar);
}

/**
 * Formats an offset for CSS, clamping the negatives a fractional viewport size
 * can measure
 */
function toPx(offset: number): string {
    return `${Math.max(0, Math.round(offset))}px`;
}

export { syncDockOffsets, watchDockOffsets };

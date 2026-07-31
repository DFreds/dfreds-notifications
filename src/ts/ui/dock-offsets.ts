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
}

/**
 * Starts re-measuring the game interface whenever it resizes, which covers the
 * dock appearing, minimizing, and hiding, as well as the window resizing.
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
}

/**
 * Formats an offset for CSS, clamping the negatives a fractional viewport size
 * can measure
 */
function toPx(offset: number): string {
    return `${Math.max(0, Math.round(offset))}px`;
}

export { syncDockOffsets, watchDockOffsets };

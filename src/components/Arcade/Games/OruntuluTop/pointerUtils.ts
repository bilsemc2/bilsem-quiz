export interface CanvasPointerRect {
    left: number;
    top: number;
}

export const toCanvasPoint = (
    clientX: number,
    clientY: number,
    rect: CanvasPointerRect,
) => ({
    x: clientX - rect.left,
    y: clientY - rect.top,
});

import { useCallback, useRef } from 'react';

interface UseViewportAnchorOptions {
    behavior?: ScrollBehavior;
    defaultBlock?: ScrollLogicalPosition;
    deferFrames?: number;
}

interface ScrollElementIntoViewOptions {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    deferFrames?: number;
}

const runAfterFrames = (frames: number, callback: () => void) => {
    if (frames <= 0) {
        callback();
        return;
    }

    window.requestAnimationFrame(() => {
        runAfterFrames(frames - 1, callback);
    });
};

export const scrollElementIntoView = (
    element: HTMLElement | null,
    options: ScrollElementIntoViewOptions = {},
) => {
    if (typeof window === 'undefined' || !element) {
        return;
    }

    const { behavior = 'smooth', block = 'start', deferFrames = 0 } = options;

    runAfterFrames(deferFrames, () => {
        element.scrollIntoView({ behavior, block });
    });
};

export const useViewportAnchor = <T extends HTMLElement = HTMLDivElement>(
    options: UseViewportAnchorOptions = {},
) => {
    const { behavior = 'smooth', defaultBlock = 'start', deferFrames = 0 } = options;
    const anchorRef = useRef<T | null>(null);

    const scrollToAnchor = useCallback((block: ScrollLogicalPosition = defaultBlock) => {
        scrollElementIntoView(anchorRef.current, { behavior, block, deferFrames });
    }, [behavior, defaultBlock, deferFrames]);

    return {
        anchorRef,
        scrollToAnchor,
    };
};

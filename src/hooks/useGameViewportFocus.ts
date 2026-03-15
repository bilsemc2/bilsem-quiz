import { useViewportAnchor } from './useViewportAnchor';

interface UseGameViewportFocusOptions {
    behavior?: ScrollBehavior;
    defaultBlock?: ScrollLogicalPosition;
}

export const useGameViewportFocus = <T extends HTMLElement = HTMLDivElement>(
    options: UseGameViewportFocusOptions = {},
) => {
    const { behavior = 'smooth', defaultBlock = 'start' } = options;
    const { anchorRef: playAreaRef, scrollToAnchor: focusPlayArea } = useViewportAnchor<T>({
        behavior,
        defaultBlock,
        deferFrames: 2,
    });

    return {
        playAreaRef,
        focusPlayArea,
    };
};

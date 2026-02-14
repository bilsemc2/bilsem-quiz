import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Router-level component that scrolls to top on every route change.
 * Place inside <Router> to eliminate manual window.scrollTo(0,0) calls.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

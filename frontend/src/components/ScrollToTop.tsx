import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that automatically scrolls to top when route changes
 * This ensures that when navigating between pages, the new page starts from the top
 */
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top immediately when location changes
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

export default ScrollToTop;

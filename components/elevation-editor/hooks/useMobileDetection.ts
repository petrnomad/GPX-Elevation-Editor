/**
 * Custom hook for detecting mobile screen sizes
 */

import { useState, useEffect } from 'react';

/**
 * Detects whether the current viewport is mobile-sized (< 768px)
 *
 * This hook monitors window resize events and updates the mobile state
 * accordingly. It uses the Tailwind CSS md breakpoint (768px) as the
 * threshold for mobile vs desktop.
 *
 * @returns boolean indicating whether the viewport is mobile-sized
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

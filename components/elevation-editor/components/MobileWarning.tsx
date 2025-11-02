/**
 * Mobile warning banner component
 */

import { X } from 'lucide-react';

interface MobileWarningProps {
  show: boolean;
  onDismiss: () => void;
}

/**
 * Warning banner displayed on mobile devices
 */
export function MobileWarning({ show, onDismiss }: MobileWarningProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-amber-600 hover:text-amber-800 transition-colors"
        aria-label="Close warning"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-2 items-start pr-6">
        <span className="text-amber-600 text-lg">⚠️</span>
        <div className="text-sm text-amber-800">
          <strong>Best used on desktop</strong> - This tool works best on larger screens. Editing
          elevation curves on mobile is difficult due to limited space.
        </div>
      </div>
    </div>
  );
}

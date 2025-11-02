/**
 * Help card component with editing instructions
 */

import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface HelpCardProps {
  show: boolean;
  onDismiss: () => void;
}

/**
 * Displays help text for editing with dismiss button
 */
export function HelpCard({ show, onDismiss }: HelpCardProps) {
  if (!show) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 relative">
      <CardContent className="p-4">
        <button
          type="button"
          aria-label="Dismiss editing help"
          onClick={onDismiss}
          className="absolute top-2 right-2 text-blue-500 transition-colors hover:bg-blue-500 hover:text-white rounded-full border border-blue-200"
          style={{ margin: '5px', padding: '0px 6px' }}
        >
          ×
        </button>
        <div className="flex items-start gap-3 pr-6">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>How to edit:</strong> Drag a point up or down to reshape the profile. Nearby
            samples follow according to the smoothing radius and intensity sliders. Clicking once
            without dragging runs the click-smoothing blend with your current settings.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

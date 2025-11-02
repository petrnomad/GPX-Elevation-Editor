/**
 * Pan controls component for chart
 */

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PanControlsProps {
  isMobile: boolean;
  zoomDomain: [number, number] | null;
  onPanLeft: () => void;
  onPanRight: () => void;
}

/**
 * Renders left/right pan buttons positioned on the chart
 * Only visible when zoomed in
 */
export function PanControls({ isMobile, zoomDomain, onPanLeft, onPanRight }: PanControlsProps) {
  if (!zoomDomain) {
    return null;
  }

  return (
    <div
      className="absolute top-4 z-10 flex gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-md p-1 shadow-lg"
      style={{ right: isMobile ? '-43px' : '16px' }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onPanLeft}
        title="Pan left"
        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPanRight}
        title="Pan right"
        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

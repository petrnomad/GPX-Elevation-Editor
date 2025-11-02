/**
 * Zoom controls component for chart
 */

import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  isMobile: boolean;
  zoomDomain: [number, number] | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

/**
 * Renders zoom in/out/reset buttons positioned on the chart
 */
export function ZoomControls({
  isMobile,
  zoomDomain,
  onZoomIn,
  onZoomOut,
  onResetZoom
}: ZoomControlsProps) {
  return (
    <div
      className="absolute z-10 flex flex-col gap-1 border border-slate-200 rounded-md p-1 shadow-lg"
      style={{ left: isMobile ? '-43px' : '127px', top: '15px', background: 'white' }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in"
        className="h-8 w-8 hover:bg-slate-100"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out"
        className="h-8 w-8 hover:bg-slate-100"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      {zoomDomain && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetZoom}
          title="Reset zoom"
          className="h-8 w-8 hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

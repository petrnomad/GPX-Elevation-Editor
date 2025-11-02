/**
 * Zoom controls component for chart
 */

import { ZoomIn, ZoomOut, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  isMobile: boolean;
  zoomDomain: [number, number] | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
}

/**
 * Renders zoom in/out/reset and pan left/right buttons positioned on the chart
 */
export function ZoomControls({
  isMobile,
  zoomDomain,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPanLeft,
  onPanRight
}: ZoomControlsProps) {
  return (
    <div
      className="absolute z-10 flex flex-col gap-1 border border-slate-200 dark:border-slate-700 rounded-md p-1 shadow-lg bg-white dark:bg-slate-800"
      style={{ left: isMobile ? '-43px' : '5px', top: '15px' }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in"
        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out"
        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      {zoomDomain && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onResetZoom}
            title="Reset zoom"
            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
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
        </>
      )}
    </div>
  );
}

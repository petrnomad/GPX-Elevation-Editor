/**
 * Header component for the Elevation Editor
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Undo2, RotateCcw, Upload, Download } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  filename: string;
  gpxName?: string;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onLoadNewFile: () => void;
  onDownload: () => void;
}

/**
 * Sticky header with logo, file info, and action buttons
 */
export function Header({
  filename,
  gpxName,
  canUndo,
  onUndo,
  onReset,
  onLoadNewFile,
  onDownload
}: HeaderProps) {
  return (
    <div
      className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 pt-[10px] pb-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between -mx-6 px-6"
      style={{ marginTop: 0 }}
    >
      <div>
        <div className="flex items-center gap-2 md:gap-3">
          <img
            src="./logo.png"
            alt="GPX Elevation Profile Editor"
            className="h-6 w-6 md:h-10 md:w-10"
          />
          <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Elevation Profile Editor
          </h1>
        </div>
        <div className="mt-1 md:mt-2 flex items-center gap-1 md:gap-2 flex-wrap">
          <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Loaded GPX file:</span>
          <Badge variant="secondary" className="font-mono text-xs md:text-sm">
            {filename}
          </Badge>
          {gpxName && (
            <>
              <span className="text-xs md:text-sm text-slate-400 hidden md:inline">•</span>
              <Badge variant="outline" className="text-xs md:text-sm hidden md:inline-flex">
                {gpxName}
              </Badge>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap relative">
        {/* Theme toggle - absolute positioned on mobile, normal flow on desktop */}
        <div className="absolute top-[-60px] right-0 md:relative md:top-0">
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 px-2 text-xs md:h-10 md:px-4 md:text-sm"
        >
          <Undo2 className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="h-8 px-2 text-xs md:h-10 md:px-4 md:text-sm"
        >
          <RotateCcw className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          Reset
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-2 text-xs md:h-10 md:px-4 md:text-sm"
          onClick={onLoadNewFile}
        >
          <Upload className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          Load GPX
        </Button>
        <Button
          onClick={onDownload}
          className="h-8 px-2 text-xs md:h-10 md:px-4 md:text-sm"
        >
          <Download className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}

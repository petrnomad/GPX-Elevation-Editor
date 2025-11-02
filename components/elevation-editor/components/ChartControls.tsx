/**
 * Chart control buttons component
 */

import { Eye, EyeOff, MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardTitle } from '@/components/ui/card';
import { UnitSystem } from '../types';

interface ChartControlsProps {
  unitSystem: UnitSystem;
  showOriginal: boolean;
  showAnomalies: boolean;
  showMap: boolean;
  anomalyCount: number;
  editedCount: number;
  onUnitSystemChange: (system: UnitSystem) => void;
  onToggleOriginal: () => void;
  onToggleAnomalies: () => void;
  onToggleMap: () => void;
}

/**
 * Card header with title, badges, and control buttons for the chart
 */
export function ChartControls({
  unitSystem,
  showOriginal,
  showAnomalies,
  showMap,
  anomalyCount,
  editedCount,
  onUnitSystemChange,
  onToggleOriginal,
  onToggleAnomalies,
  onToggleMap
}: ChartControlsProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        <CardTitle>Elevation Profile</CardTitle>
        {showAnomalies && anomalyCount > 0 && (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-transparent hover:bg-red-100 pointer-events-none"
          >
            {anomalyCount} elevation {anomalyCount === 1 ? 'anomaly' : 'anomalies'} detected
          </Badge>
        )}
        {editedCount > 0 && (
          <Badge className="bg-amber-100 text-amber-800 border-transparent pointer-events-none">
            {editedCount} points modified
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
        {/* Unit System Toggle */}
        <div className="flex overflow-hidden rounded-md border border-slate-200">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`rounded-none h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${
              unitSystem === 'metric'
                ? 'bg-slate-900 !text-white hover:bg-slate-800 focus-visible:!text-white active:!text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            onClick={() => onUnitSystemChange('metric')}
          >
            Metric
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`rounded-none h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${
              unitSystem === 'imperial'
                ? 'bg-slate-900 !text-white hover:bg-slate-800 focus-visible:!text-white active:!text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            onClick={() => onUnitSystemChange('imperial')}
          >
            Imperial
          </Button>
        </div>

        {/* Show/Hide Original Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${
            showOriginal
              ? 'bg-slate-900 !text-white hover:bg-slate-800 focus-visible:!text-white active:!text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
          onClick={onToggleOriginal}
        >
          {showOriginal ? (
            <>
              <Eye className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
              Hide original
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
              Show original
            </>
          )}
        </Button>

        {/* Show/Hide Anomalies Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${
            !showAnomalies
              ? 'bg-slate-900 !text-white hover:bg-slate-800 focus-visible:!text-white active:!text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
          onClick={onToggleAnomalies}
        >
          {showAnomalies ? (
            <>
              <Eye className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
              Hide anomalies
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
              Show anomalies
            </>
          )}
        </Button>

        {/* Show/Hide Map Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm ${
            !showMap
              ? 'bg-slate-900 !text-white hover:bg-slate-800 focus-visible:!text-white active:!text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
          onClick={onToggleMap}
        >
          <MapIcon className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
          {showMap ? 'Hide map' : 'Show path on map'}
        </Button>
      </div>
    </div>
  );
}

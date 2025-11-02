/**
 * Controls card component with smoothing and anomaly settings
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { cn } from '@/lib/utils';

interface ControlsCardProps {
  smoothingRadius: number;
  smoothingStrength: number;
  anomalyThreshold: number;
  maxSmoothingRadius: number;
  onSmoothingRadiusChange: (value: number) => void;
  onSmoothingStrengthChange: (value: number) => void;
  onAnomalyThresholdChange: (value: number) => void;
}

/**
 * Card containing sliders for smoothing and anomaly detection settings
 */
export function ControlsCard({
  smoothingRadius,
  smoothingStrength,
  anomalyThreshold,
  maxSmoothingRadius,
  onSmoothingRadiusChange,
  onSmoothingStrengthChange,
  onAnomalyThresholdChange
}: ControlsCardProps) {
  const [isOpen, setIsOpen] = useLocalStorageState('controls-card-open', true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
            !isOpen && "p-[15px]"
          )}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Controls</CardTitle>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-slate-600 dark:text-slate-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Smoothing Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="smoothing-radius" className="text-sm text-slate-600 dark:text-slate-400">
                Smoothing affected points (each side)
              </Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">{Math.round(smoothingRadius)} pts</span>
            </div>
            <Slider
              id="smoothing-radius"
              min={0}
              max={Math.max(0, maxSmoothingRadius)}
              step={1}
              value={[Math.max(0, Math.min(Math.round(smoothingRadius), maxSmoothingRadius))]}
              onValueChange={(value: number[]) => {
                const raw = value[0] ?? 0;
                onSmoothingRadiusChange(Math.max(0, Math.min(raw, maxSmoothingRadius)));
              }}
            />
          </div>

          {/* Smoothing Strength */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="smoothing-strength" className="text-sm text-slate-600 dark:text-slate-400">
                Smoothing intensity
              </Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {Math.round(smoothingStrength * 100)}%
              </span>
            </div>
            <Slider
              id="smoothing-strength"
              min={0}
              max={100}
              step={5}
              value={[Math.round(smoothingStrength * 100)]}
              onValueChange={(value: number[]) => {
                const next = (value[0] ?? 0) / 100;
                onSmoothingStrengthChange(Math.min(Math.max(next, 0), 1));
              }}
            />
          </div>

          {/* Anomaly Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anomaly-threshold" className="text-sm text-slate-600 dark:text-slate-400">
                Anomaly detection threshold (1-100 m)
              </Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">{anomalyThreshold} m</span>
            </div>
            <Slider
              id="anomaly-threshold"
              min={1}
              max={100}
              step={1}
              value={[anomalyThreshold]}
              onValueChange={(value: number[]) => {
                const nextValue = value[0] ?? anomalyThreshold;
                onAnomalyThresholdChange(Math.min(Math.max(nextValue, 1), 100));
              }}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dragging uses smoothing settings to blend the selected point with its neighbours.
          Clicking without moving applies a gentle average using the same radius and intensity.
          Anomaly threshold controls the minimum elevation change (in meters) required to detect
          elevation anomalies.
        </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

"use client";

import { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GPXData, TrackPoint, exportGPX } from '@/lib/gpx-parser';

interface ElevationEditorProps {
  gpxData: GPXData;
  originalContent: string;
  filename: string;
}

interface ChartDataPoint {
  distance: number;
  elevation: number;
  originalIndex: number;
  isEdited?: boolean;
}

export function ElevationEditor({ gpxData, originalContent, filename }: ElevationEditorProps) {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>(gpxData.trackPoints);
  const [editedPoints, setEditedPoints] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  console.log('ElevationEditor rendered with', trackPoints.length, 'points');

  // Convert track points to chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    console.log('Converting track points to chart data');
    return trackPoints.map((point, index) => ({
      distance: point.distance || 0,
      elevation: point.ele,
      originalIndex: index,
      isEdited: editedPoints.has(index)
    }));
  }, [trackPoints, editedPoints]);

  // Smart smoothing algorithm
  const applySmoothTransition = useCallback((targetIndex: number, newElevation: number) => {
    console.log(`Applying smooth transition for point ${targetIndex}, new elevation: ${newElevation}`);
    
    const influenceRadius = Math.max(5, Math.floor(trackPoints.length * 0.01)); // 1% of total points, minimum 5
    const newPoints = [...trackPoints];
    
    // Set the target point
    newPoints[targetIndex] = { ...newPoints[targetIndex], ele: newElevation };
    
    // Apply smooth transitions to surrounding points
    for (let i = 1; i <= influenceRadius; i++) {
      const influence = Math.pow(0.7, i); // Exponential decay
      
      // Left side
      if (targetIndex - i >= 0) {
        const leftIndex = targetIndex - i;
        const currentEle = trackPoints[leftIndex].ele;
        const targetEle = newElevation;
        const smoothedEle = currentEle + (targetEle - currentEle) * influence * 0.3;
        newPoints[leftIndex] = { ...newPoints[leftIndex], ele: smoothedEle };
      }
      
      // Right side
      if (targetIndex + i < trackPoints.length) {
        const rightIndex = targetIndex + i;
        const currentEle = trackPoints[rightIndex].ele;
        const targetEle = newElevation;
        const smoothedEle = currentEle + (targetEle - currentEle) * influence * 0.3;
        newPoints[rightIndex] = { ...newPoints[rightIndex], ele: smoothedEle };
      }
    }
    
    return newPoints;
  }, [trackPoints]);

  const handleChartMouseDown = useCallback((e: any) => {
    if (!e || !e.activePayload) return;
    
    console.log('Chart mouse down', e);
    setIsDragging(true);
    setDragStartY(e.chartY);
  }, []);

  const handleChartMouseMove = useCallback((e: any) => {
    if (!isDragging || !dragStartY || !e || !e.activePayload) return;
    
    const activePoint = e.activePayload[0]?.payload;
    if (!activePoint) return;
    
    const deltaY = dragStartY - e.chartY;
    const elevationChange = deltaY * 2; // Scale factor for sensitivity
    const targetIndex = activePoint.originalIndex;
    const baseElevation = gpxData.trackPoints[targetIndex].ele;
    const newElevation = Math.max(0, baseElevation + elevationChange);
    
    console.log(`Mouse move: delta ${deltaY.toFixed(2)}, new elevation: ${newElevation.toFixed(2)}`);
    
    const newPoints = applySmoothTransition(targetIndex, newElevation);
    setTrackPoints(newPoints);
    setEditedPoints(prev => new Set(Array.from(prev).concat([targetIndex])));
  }, [isDragging, dragStartY, gpxData.trackPoints, applySmoothTransition]);

  const handleChartMouseUp = useCallback(() => {
    console.log('Chart mouse up');
    setIsDragging(false);
    setDragStartY(null);
  }, []);

  const resetElevation = useCallback(() => {
    console.log('Resetting elevation to original');
    setTrackPoints(gpxData.trackPoints);
    setEditedPoints(new Set());
  }, [gpxData.trackPoints]);

  const downloadModifiedGPX = useCallback(() => {
    console.log('Downloading modified GPX');
    const modifiedGpxData = { ...gpxData, trackPoints };
    const gpxContent = exportGPX(modifiedGpxData, originalContent);
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.gpx', '_edited.gpx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [gpxData, trackPoints, originalContent, filename]);

  const stats = useMemo(() => {
    console.log('Calculating stats for', trackPoints.length, 'points');
    const elevations = trackPoints.map(p => p.ele);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const totalGain = trackPoints.reduce((gain, point, index) => {
      if (index === 0) return 0;
      const diff = point.ele - trackPoints[index - 1].ele;
      return gain + (diff > 0 ? diff : 0);
    }, 0);
    
    return {
      minElevation: minEle,
      maxElevation: maxEle,
      totalGain: totalGain,
      totalDistance: gpxData.totalDistance,
      editedCount: editedPoints.size
    };
  }, [trackPoints, gpxData.totalDistance, editedPoints]);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Elevation Profile Editor</h1>
          <p className="text-slate-600 mt-1">{filename}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetElevation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={downloadModifiedGPX}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Distance</div>
          <div className="text-lg font-bold">{(stats.totalDistance / 1000).toFixed(1)} km</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Min Elevation</div>
          <div className="text-lg font-bold">{stats.minElevation.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Max Elevation</div>
          <div className="text-lg font-bold">{stats.maxElevation.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Gain</div>
          <div className="text-lg font-bold">{stats.totalGain.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Edited Points</div>
          <div className="text-lg font-bold text-amber-600">{stats.editedCount}</div>
        </Card>
      </div>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>How to edit:</strong> Click and drag any point on the elevation profile up or down. 
              Surrounding points will automatically adjust to create smooth transitions. 
              {stats.editedCount > 0 && (
                <span className="ml-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {stats.editedCount} points modified
                  </Badge>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Elevation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Elevation Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleChartMouseUp}
                onMouseLeave={handleChartMouseUp}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="distance"
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}km`}
                  stroke="#64748b"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}m`}
                  stroke="#64748b"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}m`,
                    'Elevation'
                  ]}
                  labelFormatter={(value: number) => `Distance: ${(value / 1000).toFixed(2)}km`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="elevation"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: '#f59e0b',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    cursor: 'ns-resize'
                  }}
                />
                {/* Reference lines for edited points */}
                {Array.from(editedPoints).slice(0, 5).map(index => (
                  <ReferenceLine
                    key={index}
                    x={trackPoints[index]?.distance || 0}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    strokeOpacity={0.5}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
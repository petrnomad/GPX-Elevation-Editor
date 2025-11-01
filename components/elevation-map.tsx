"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapContainer as LeafletMapComponent, TileLayer as LeafletTileLayerComponent, Polyline as LeafletPolylineComponent } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false
}) as unknown as typeof LeafletMapComponent;
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false
}) as unknown as typeof LeafletTileLayerComponent;
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), {
  ssr: false
}) as unknown as typeof LeafletPolylineComponent;

import 'leaflet/dist/leaflet.css';

interface ElevationMapProps {
  points: Array<{ lat: number; lon: number }>;
}

export function ElevationMap({ points }: ElevationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prev => prev + 1);
    return () => {
      if (mapContainerRef.current) {
        const existing = mapContainerRef.current.querySelector('.leaflet-container');
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }
    };
  }, []);

  const polylinePositions = useMemo(() => {
    return points
      .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      .map(point => [point.lat, point.lon]) as [number, number][];
  }, [points]);

  const bounds = useMemo(() => {
    if (polylinePositions.length === 0) {
      return undefined;
    }
    let minLat = polylinePositions[0][0];
    let minLon = polylinePositions[0][1];
    let maxLat = polylinePositions[0][0];
    let maxLon = polylinePositions[0][1];

    polylinePositions.forEach(([lat, lon]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    });

    return [
      [minLat, minLon],
      [maxLat, maxLon]
    ] as [[number, number], [number, number]];
  }, [polylinePositions]);

  const mapCenter = useMemo(() => {
    if (polylinePositions.length === 0) {
      return [0, 0] as [number, number];
    }
    const lastIndex = Math.floor(polylinePositions.length / 2);
    const [lat, lon] = polylinePositions[lastIndex];
    return [lat, lon] as [number, number];
  }, [polylinePositions]);

  return (
    <div className="h-96 w-full" ref={mapContainerRef}>
      <MapContainer
        key={`map-${renderKey}-${polylinePositions.length}`}
        center={mapCenter}
        zoom={13}
        scrollWheelZoom
        bounds={bounds}
        className="h-full w-full rounded-md"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="#2563eb" weight={4} opacity={0.75} />
        )}
      </MapContainer>
    </div>
  );
}

"use client";

import { useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

interface ElevationMapProps {
  points: Array<{ lat: number; lon: number }>;
  hoveredPointIndex?: number | null;
}

export function ElevationMap({ points, hoveredPointIndex }: ElevationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const polylinePositions = useMemo(() => {
    return points
      .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      .map(point => [point.lat, point.lon] as [number, number]);
  }, [points]);

  // Initialize map only once
  useEffect(() => {
    const initMap = async () => {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix default marker icon issue with webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (polylinePositions.length === 0) return;

      // Calculate center
      const centerIndex = Math.floor(polylinePositions.length / 2);
      const center = polylinePositions[centerIndex];

      // Create map
      const map = L.map(containerRef.current).setView(center, 13);
      mapRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add polyline
      const polyline = L.polyline(polylinePositions, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.75
      }).addTo(map);
      polylineRef.current = polyline;

      // Fit bounds to show entire route
      map.fitBounds(polyline.getBounds());
    };

    initMap();

    // Cleanup on unmount
    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency - initialize only once

  // Update polyline when points change
  useEffect(() => {
    const updatePolyline = async () => {
      if (!mapRef.current || !polylineRef.current) return;

      // Update polyline positions
      polylineRef.current.setLatLngs(polylinePositions);
    };

    updatePolyline();
  }, [polylinePositions]);

  // Update marker position when hoveredPointIndex changes
  useEffect(() => {
    const updateMarker = async () => {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;

      // Remove existing marker if hoveredPointIndex is null
      if (hoveredPointIndex === null || hoveredPointIndex === undefined) {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        return;
      }

      // Get the point from the polyline positions
      const point = polylinePositions[hoveredPointIndex];
      if (!point) return;

      // Create or update marker
      if (markerRef.current) {
        markerRef.current.setLatLng(point);
      } else {
        markerRef.current = L.circleMarker(point, {
          radius: 8,
          fillColor: '#f59e0b',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(mapRef.current);
      }
    };

    updateMarker();
  }, [hoveredPointIndex, polylinePositions]);

  return <div ref={containerRef} className="h-96 w-full rounded-md" />;
}

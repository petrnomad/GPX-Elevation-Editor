import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ElevationMap } from '../elevation-map';
import { parseGPX } from '../../lib/gpx-parser';
import fs from 'fs';
import path from 'path';

vi.mock('react-leaflet', async () => {
  const React = await import('react');
  let active = false;

  const MapContainer = ({ whenCreated, children }: any) => {
    if (active) {
      throw new Error('Map container is already initialized');
    }
    active = true;
    const remove = () => {
      active = false;
    };

    React.useEffect(() => {
      whenCreated?.({ remove } as any);
      return () => {
        // MapContainer itself does not reset `active` to ensure the caller removes explicitly.
      };
    }, [whenCreated]);

    return React.createElement('div', { 'data-testid': 'mock-map-container' }, children);
  };

  const TileLayer = (props: any) => React.createElement('div', null, props.children);
  const Polyline = () => React.createElement(React.Fragment, null);

  return {
    MapContainer,
    TileLayer,
    Polyline
  };
});

const gpxPath = path.join(process.cwd(), 'test.gpx');
const gpxContent = fs.readFileSync(gpxPath, 'utf-8');
const gpxData = parseGPX(gpxContent);
const samplePoints = gpxData.trackPoints.map(point => ({ lat: point.lat, lon: point.lon }));

describe('ElevationMap', () => {
  it('can unmount and mount again without Leaflet reinitialization error', () => {
    expect(samplePoints.length).toBeGreaterThan(0);

    const firstRender = render(<ElevationMap points={samplePoints} />);
    expect(() => firstRender.unmount()).not.toThrow();

    expect(() => {
      const secondRender = render(<ElevationMap points={samplePoints} />);
      secondRender.unmount();
    }).not.toThrow();
  });
});

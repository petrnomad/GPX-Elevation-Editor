import { XMLParser } from 'fast-xml-parser';

export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
  distance?: number;
  originalIndex: number;
}

export interface GPXData {
  name?: string;
  trackPoints: TrackPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
}

export function parseGPX(gpxContent: string): GPXData {
  console.log('Starting GPX parsing...');
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  const gpxData = parser.parse(gpxContent);
  console.log('GPX parsed successfully:', gpxData);

  const trackPoints: TrackPoint[] = [];
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  // Navigate through the GPX structure
  const gpx = gpxData.gpx;

  if (!gpx) {
    throw new Error('Invalid GPX file: No GPX root element found');
  }

  if (!gpx.trk) {
    throw new Error('Invalid GPX file: No track data found');
  }

  const tracks = Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk];

  tracks.forEach((track: any) => {
    const segments = Array.isArray(track.trkseg) ? track.trkseg : [track.trkseg];
    
    segments.forEach((segment: any) => {
      const points = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt];
      
      points.forEach((point: any, index: number) => {
        const lat = parseFloat(point['@_lat']);
        const lon = parseFloat(point['@_lon']);
        const ele = point.ele ? parseFloat(point.ele) : 0;
        
        // Calculate distance from previous point
        let distance = 0;
        if (trackPoints.length > 0) {
          const prevPoint = trackPoints[trackPoints.length - 1];
          distance = calculateDistance(prevPoint.lat, prevPoint.lon, lat, lon);
          totalDistance += distance;
        }

        // Calculate elevation changes
        if (trackPoints.length > 0) {
          const elevationDiff = ele - trackPoints[trackPoints.length - 1].ele;
          if (elevationDiff > 0) {
            elevationGain += elevationDiff;
          } else {
            elevationLoss += Math.abs(elevationDiff);
          }
        }

        trackPoints.push({
          lat,
          lon,
          ele,
          time: point.time,
          distance: totalDistance,
          originalIndex: trackPoints.length
        });
      });
    });
  });

  console.log(`Parsed ${trackPoints.length} track points`);
  console.log(`Total distance: ${totalDistance.toFixed(2)}m`);
  console.log(`Elevation gain: ${elevationGain.toFixed(2)}m`);

  // Prefer metadata name over track name
  const trackName = gpx.metadata?.name || gpx.trk?.name || 'GPX Track';

  return {
    name: trackName,
    trackPoints,
    totalDistance,
    elevationGain,
    elevationLoss
  };
}

export function exportGPX(gpxData: GPXData, originalContent: string): string {
  console.log('Exporting modified GPX...');
  
  // Parse the original GPX to maintain structure
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  const originalGpx = parser.parse(originalContent);
  
  // Update elevation values in the original structure
  const tracks = Array.isArray(originalGpx.gpx.trk) ? originalGpx.gpx.trk : [originalGpx.gpx.trk];
  
  let pointIndex = 0;
  tracks.forEach((track: any) => {
    const segments = Array.isArray(track.trkseg) ? track.trkseg : [track.trkseg];
    
    segments.forEach((segment: any) => {
      const points = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt];
      
      points.forEach((point: any) => {
        if (pointIndex < gpxData.trackPoints.length) {
          point.ele = gpxData.trackPoints[pointIndex].ele.toFixed(2);
          pointIndex++;
        }
      });
    });
  });

  // Convert back to XML
  const xmlBuilder = new (require('fast-xml-parser').XMLBuilder)({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true
  });

  const xmlString = xmlBuilder.build(originalGpx);
  console.log('GPX export completed');
  
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlString}`;
}

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
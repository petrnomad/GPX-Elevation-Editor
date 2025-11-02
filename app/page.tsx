"use client";

import { useState, useEffect } from 'react';
import { ElevationEditor } from '@/components/elevation-editor';
import { Footer } from '@/components/footer';
import { parseGPX, GPXData } from '@/lib/gpx-parser';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function Home() {
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  console.log('Home component rendered, gpxData:', gpxData ? 'loaded' : 'not loaded');

  // Load sample.gpx on mount
  useEffect(() => {
    const loadSampleGPX = async () => {
      try {
        // Use relative path - works in both dev and production with basePath
        const response = await fetch('./sample.gpx');
        const content = await response.text();
        const parsed = parseGPX(content);

        setGpxData(parsed);
        setOriginalContent(content);
        setFilename('sample.gpx');
        setIsLoading(false);

        toast.success(`Sample GPX loaded! Found ${parsed.trackPoints.length} track points.`);
      } catch (error) {
        console.error('Error loading sample GPX:', error);
        toast.error('Failed to load sample GPX file.');
        setIsLoading(false);
      }
    };

    loadSampleGPX();
  }, []);

  const handleFileUpload = (content: string, uploadedFilename: string) => {
    console.log('File uploaded:', uploadedFilename);

    try {
      const parsed = parseGPX(content);
      console.log('GPX parsed successfully:', parsed);

      setGpxData(parsed);
      setOriginalContent(content);
      setFilename(uploadedFilename);

      toast.success(`GPX file loaded successfully! Found ${parsed.trackPoints.length} track points.`);
    } catch (error) {
      console.error('Error parsing GPX:', error);
      toast.error('Failed to parse GPX file. Please ensure it\'s a valid GPX file.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      <div className="flex-1">
        {gpxData && (
          <ElevationEditor
            key={filename}
            gpxData={gpxData}
            originalContent={originalContent}
            filename={filename}
            onLoadNewFile={handleFileUpload}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

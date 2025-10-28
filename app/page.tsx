"use client";

import { useState } from 'react';
import { GPXUpload } from '@/components/gpx-upload';
import { ElevationEditor } from '@/components/elevation-editor';
import { parseGPX, GPXData } from '@/lib/gpx-parser';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function Home() {
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');

  console.log('Home component rendered, gpxData:', gpxData ? 'loaded' : 'not loaded');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {!gpxData ? (
        <div className="flex justify-center items-center min-h-screen">
          <GPXUpload onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <ElevationEditor 
          gpxData={gpxData} 
          originalContent={originalContent}
          filename={filename}
        />
      )}
    </div>
  );
}

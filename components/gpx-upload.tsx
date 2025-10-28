"use client";

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GPXUploadProps {
  onFileUpload: (content: string, filename: string) => void;
}

export function GPXUpload({ onFileUpload }: GPXUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('GPXUpload component rendered');

  const handleFile = useCallback((file: File) => {
    console.log('Processing file:', file.name);
    setError(null);

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Please select a valid GPX file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('File read successfully, content length:', content.length);
      onFileUpload(content, file.name);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      setError('Error reading file');
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    console.log('File dropped');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          GPX Elevation Editor
        </h1>
        <p className="text-slate-600">
          Upload your GPX file to edit and smooth elevation profiles
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-0">
          <div
            className={`relative p-12 text-center transition-colors ${
              isDragging ? 'bg-blue-50 border-blue-400' : 'hover:bg-slate-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Drop your GPX file here
                </h3>
                <p className="text-slate-600 mb-4">
                  or click to browse files
                </p>
                <Button variant="outline" className="pointer-events-none">
                  <FileText className="h-4 w-4 mr-2" />
                  Choose GPX File
                </Button>
              </div>
              
              <p className="text-sm text-slate-500">
                Supports GPX files from GPS devices and fitness trackers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
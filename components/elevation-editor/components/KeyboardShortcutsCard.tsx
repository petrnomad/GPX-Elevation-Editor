/**
 * Keyboard shortcuts help card
 */

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsCardProps {
  show: boolean;
  onDismiss: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['⌘', 'Z'], description: 'Undo last change' },
  { keys: ['⌘', 'O'], description: 'Load GPX file' },
  { keys: ['⌘', 'D'], description: 'Download modified GPX' },
  { keys: ['⌘', 'S'], description: 'Toggle original elevation' },
  { keys: ['⌘', 'M'], description: 'Toggle map view' },
  { keys: ['⌘', 'A'], description: 'Toggle anomaly detection' },
  { keys: ['⌘', 'I'], description: 'Toggle metric/imperial units' },
  { keys: ['⌘', 'Mouse Wheel'], description: 'Zoom in/out' },
  { keys: ['⌘', 'Mouse Drag'], description: 'Pan zoomed chart' },
];

/**
 * Card displaying keyboard shortcuts help
 */
export function KeyboardShortcutsCard({ show, onDismiss }: KeyboardShortcutsCardProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use these shortcuts to work more efficiently
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8 -mt-1 -mr-2"
            aria-label="Close keyboard shortcuts"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-md bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1 ml-4">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    <kbd
                      className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-background px-2 font-mono text-xs font-medium text-foreground opacity-100 whitespace-nowrap"
                    >
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-xs text-muted-foreground dark:text-white mx-0.5">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          <span className="font-medium">Note:</span> On Windows/Linux, use <kbd className="px-1.5 py-0.5 text-xs rounded border bg-background">Ctrl</kbd> instead of <kbd className="px-1.5 py-0.5 text-xs rounded border bg-background">⌘</kbd>
        </p>
      </div>
    </div>
  );
}

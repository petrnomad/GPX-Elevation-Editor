/**
 * Individual statistics card component
 */

import { Card } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string;
  className?: string;
}

/**
 * Displays a single statistic with label and value
 */
export function StatsCard({ label, value, className = '' }: StatsCardProps) {
  return (
    <Card className={`p-2 md:p-4 ${className}`}>
      <div className="text-xs md:text-sm text-slate-600">{label}</div>
      <div className="text-sm md:text-lg font-bold">{value}</div>
    </Card>
  );
}

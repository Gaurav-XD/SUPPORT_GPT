import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';

const icons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function MetricCard({
  label,
  value,
  change,
  trend,
}: {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
}) {
  const Icon = icons[trend];
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              trend === 'up' && 'bg-emerald-500/15 text-emerald-300',
              trend === 'down' && 'bg-rose-500/15 text-rose-300',
              trend === 'flat' && 'bg-slate-500/15 text-slate-300',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {change}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

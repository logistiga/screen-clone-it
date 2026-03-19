import { Card, CardContent } from "@/components/ui/card";

interface BudgetHealthGaugeProps {
  score: number; // 0-100
  label: string;
}

export function BudgetHealthGauge({ score, label }: BudgetHealthGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 75) return { stroke: 'hsl(142, 71%, 45%)', text: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Excellent' };
    if (s >= 50) return { stroke: 'hsl(38, 92%, 50%)', text: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Moyen' };
    return { stroke: 'hsl(0, 84%, 60%)', text: 'text-destructive', bg: 'bg-destructive/10', label: 'Critique' };
  };

  const colors = getColor(clampedScore);

  // SVG arc
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  return (
    <Card className={`${colors.bg} border-0`}>
      <CardContent className="pt-3 pb-2 flex flex-col items-center justify-center">
        <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
          <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <span className={`text-2xl font-black ${colors.text}`}>{clampedScore}%</span>
          </div>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground mt-1">{label}</p>
        <p className={`text-xs font-bold ${colors.text}`}>{colors.label}</p>
      </CardContent>
    </Card>
  );
}

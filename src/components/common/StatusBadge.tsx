import React from 'react';
import { Leaf, DollarSign, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  type: 'renewable' | 'cost' | 'priority' | 'status' | 'verified';
  value: string | number;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  label,
  className = '',
}) => {
  if (type === 'renewable') {
    const val = typeof value === 'number' ? value : parseFloat(String(value));
    const isHigh = val >= 75;
    const isMedium = val >= 50;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.8 text-xs font-semibold rounded-full border ${
          isHigh
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : isMedium
            ? 'bg-teal-50 text-teal-700 border-teal-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        } ${className}`}
      >
        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
        <span>{val}% Green</span>
      </span>
    );
  }

  if (type === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Verified Green</span>
      </span>
    );
  }

  if (type === 'priority') {
    const labels: Record<string, { text: string; bg: string; icon: any }> = {
      lowest_cost: {
        text: 'Lowest Cost',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: DollarSign,
      },
      max_renewable: {
        text: 'Max Green Energy',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: Leaf,
      },
      balanced: {
        text: 'Balanced Optimization',
        bg: 'bg-teal-50 text-teal-800 border-teal-200',
        icon: Zap,
      },
      asap: {
        text: 'Fastest / ASAP',
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        icon: Clock,
      },
    };

    const config = labels[String(value)] || {
      text: String(value),
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Zap,
    };
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${config.bg} ${className}`}
      >
        <IconComponent className="w-3 h-3" />
        <span>{label || config.text}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      <span>{label || value}</span>
    </span>
  );
};

import React from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'active' | 'ready' | 'idle';
}

export const StatusCard: React.FC<StatusCardProps> = ({ icon, label, value, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-emerald-500';
      case 'ready': return 'text-blue-500';
      case 'idle': return 'text-neutral-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'ready': return <CheckCircle2 size={16} className="text-blue-500" />;
      case 'idle': return <CircleDashed size={16} className="text-neutral-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-md bg-neutral-800 ${getStatusColor()}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</div>
          <div className="text-neutral-200 font-semibold">{value}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
      </div>
    </div>
  );
};
import React from 'react';

interface SlowModeSelectorProps {
  value: number; // in seconds
  onChange: (value: number) => void;
}

const SlowModeSelector: React.FC<SlowModeSelectorProps> = ({ value, onChange }) => {
  const options = [
    { label: 'Off', value: 0 },
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
    { label: '15m', value: 900 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm">timer</span>
        Slow Mode
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-2 py-1.5 text-[10px] font-black rounded-xl border transition-all duration-200 ${
              value === option.value
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[9px] text-slate-400 font-medium italic px-1">
        {value > 0 
          ? `Members will be able to send one message every ${value >= 60 ? `${value / 60}m` : `${value}s`}`
          : 'Members can send messages at any time'}
      </p>
    </div>
  );
};

export default SlowModeSelector;

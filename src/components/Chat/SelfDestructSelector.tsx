import React from 'react';

interface SelfDestructSelectorProps {
  value: number | null;
  onChange: (seconds: number | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DURATIONS = [
  { label: 'Off', seconds: null },
  { label: '5 seconds', seconds: 5 },
  { label: '10 seconds', seconds: 10 },
  { label: '30 seconds', seconds: 30 },
  { label: '1 minute', seconds: 60 },
  { label: '5 minutes', seconds: 300 },
  { label: '1 hour', seconds: 3600 },
  { label: '1 day', seconds: 86400 },
];

const SelfDestructSelector: React.FC<SelfDestructSelectorProps> = ({
  value,
  onChange,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 min-w-[200px] animate-slide-up max-h-[300px] overflow-y-auto">
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Self-destruct timer
          </p>
        </div>
        {DURATIONS.map((duration) => (
          <button
            key={duration.label}
            type="button"
            onClick={() => {
              onChange(duration.seconds);
              onClose();
            }}
            className={`w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors ${
              value === duration.seconds 
                ? 'text-primary bg-primary/5 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="text-sm">{duration.label}</span>
            {value === duration.seconds && (
              <span className="material-symbols-outlined text-sm">check</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default SelfDestructSelector;

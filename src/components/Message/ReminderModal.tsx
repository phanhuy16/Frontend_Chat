import React, { useState } from "react";
import { format, addHours, addDays, startOfHour } from "date-fns";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  messageContent?: string;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  messageContent,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    addHours(startOfHour(new Date()), 1)
  );

  if (!isOpen) return null;

  const presets = [
    { label: "In 1 hour", value: addHours(new Date(), 1) },
    { label: "Tonight (8 PM)", value: new Date(new Date().setHours(20, 0, 0, 0)) },
    { label: "Tomorrow morning (9 AM)", value: addDays(new Date(new Date().setHours(9, 0, 0, 0)), 1) },
    { label: "Next Monday (9 AM)", value: addDays(new Date(new Date().setHours(9, 0, 0, 0)), (8 - new Date().getDay()) % 7 || 7) },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1e1e2d] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-zoom-in">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Set Reminder
          </h2>
          {messageContent && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic">
              "{messageContent}"
            </p>
          )}
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(preset.value)}
                className={`p-3 rounded-2xl border text-sm font-bold transition-all text-left ${
                  selectedDate.getTime() === preset.value.getTime()
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                }`}
              >
                {preset.label}
                <div className="text-[10px] font-normal opacity-60 mt-1">
                  {format(preset.value, "MMM d, HH:mm")}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Custom Date & Time</label>
            <input
              type="datetime-local"
              value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-5 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold transition-all"
            />
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 dark:bg-black/20 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-2xl font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedDate)}
            className="flex-1 px-6 py-3.5 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;

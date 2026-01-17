import React, { useState } from "react";
import { CreatePollRequest } from "../../types";
import { pollApi } from "../../api/poll.api";
import { useTranslation } from "react-i18next";

interface PollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

const PollCreationModal: React.FC<PollCreationModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || options.some((o) => !o.trim())) return;

    setLoading(true);
    try {
      const data: CreatePollRequest = {
        question,
        options: options.filter((o) => o.trim()),
        allowMultipleVotes,
        conversationId,
      };
      await pollApi.createPoll(data);
      onClose();
    } catch (err) {
      console.error("Failed to create poll:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-zoom-in">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Tạo cuộc bình chọn
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Câu hỏi
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
              placeholder="Đặt câu hỏi..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Các lựa chọn
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  placeholder={`Lựa chọn ${idx + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Thêm lựa chọn
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowMultiple"
              checked={allowMultipleVotes}
              onChange={(e) => setAllowMultipleVotes(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <label
              htmlFor="allowMultiple"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Cho phép chọn nhiều phương án
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !question || options.some((o) => !o)}
              className="px-6 py-2 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Đang tạo..." : "Tạo bình chọn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollCreationModal;

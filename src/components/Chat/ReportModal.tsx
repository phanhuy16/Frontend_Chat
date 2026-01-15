import React, { useState } from "react";
import toast from "react-hot-toast";
import reportApi from "../../api/report.api";
import { useAuth } from "../../hooks/useAuth";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser?: {
    id: number;
    displayName: string;
  };
  conversationId?: number;
}

const REPORT_REASONS = [
  { value: "spam", label: "Thư rác/Quảng cáo" },
  { value: "harassment", label: "Quấy rối/Tấn công" },
  { value: "hate_speech", label: "Phát ngôn gây thù địch" },
  { value: "misinformation", label: "Thông tin sai lệch" },
  { value: "adult_content", label: "Nội dung người lớn" },
  { value: "violence", label: "Bạo lực/Đe dọa" },
  { value: "other", label: "Khác" },
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUser,
  conversationId,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }

    if (!user?.id || !reportedUser?.id) {
      toast.error("Không thể xác định người dùng");
      return;
    }

    setLoading(true);
    try {
      await reportApi.createReport({
        reportedUserId: reportedUser.id,
        reporterId: user.id,
        conversationId,
        reason,
        description: description.substring(0, 500),
      });

      toast.success("Báo cáo đã được gửi thành công");
      setSubmitted(true);

      setTimeout(() => {
        onClose();
        reset();
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting report:", err);
      toast.error(err.response?.data?.message || "Lỗi khi gửi báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReason("");
    setDescription("");
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#111418] rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-zoom-in">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">flag</span>
            Báo cáo người dùng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">
                  check_circle
                </span>
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white">
                Báo cáo đã được ghi lại
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Cảm ơn bạn đã thông báo. Chúng tôi sẽ xử lý sớm nhất có thể.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-xl">
                <p className="text-[10px] text-yellow-800 dark:text-yellow-200 leading-relaxed">
                  ⚠️ Báo cáo của bạn sẽ được đội ngũ kiểm duyệt xem xét. Vui
                  lòng cung cấp lý do chính xác.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                  Người bị báo cáo
                </p>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50/80 dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-bold text-black dark:text-white">
                    {reportedUser?.displayName}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                  Lý do báo cáo *
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        reason === r.value
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-white dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      <div
                        className={`size-3.5 rounded-full border-2 flex items-center justify-center ${
                          reason === r.value
                            ? "border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {reason === r.value && (
                          <div className="size-1.5 bg-primary rounded-full" />
                        )}
                      </div>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                  Mô tả thêm (Tùy chọn)
                </label>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.substring(0, 500))
                  }
                  placeholder="Ghi thêm chi tiết về vi phạm..."
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-black dark:text-white"
                  rows={3}
                />
                <p className="text-[9px] text-right text-gray-400 mt-1">
                  {description.length}/500
                </p>
              </div>
            </div>
          )}
        </div>

        {!submitted && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 shrink-0 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
            >
              {loading ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import reportApi from "../../api/report.api";
import { useAuth } from "../../hooks/useAuth";
import { ReportListItemDto } from "../../types/report.types";
import { ReportStatus } from "../../types/enums";
import { formatTime } from "../../utils/formatters";

const ReportsTab: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportListItemDto[]>([]);
  const [pendingReports, setPendingReports] = useState<ReportListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState<"my_reports" | "admin_panel">(
    "my_reports"
  );
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "reviewed" | "resolved" | "dismissed"
  >("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // Fetch own reports
        const ownData = await reportApi.getReportsByReporter(user.id);
        setReports(ownData);

        // Check admin status from user profile instead of probing API
        const adminStatus = user.role === "Admin";
        setIsAdmin(adminStatus);

        if (adminStatus) {
          try {
            const pendingData = await reportApi.getPendingReports();
            setPendingReports(pendingData);
          } catch (err: any) {
            console.error("Error fetching pending reports for admin:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        toast.error("Không thể tải danh sách báo cáo");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleUpdateStatus = async (reportId: number, status: ReportStatus) => {
    try {
      // numeric enum to string for API
      const statusString = ReportStatus[status];
      await reportApi.updateReportStatus(reportId, statusString);
      toast.success("Đã cập nhật trạng thái báo cáo");

      // Update local state
      setPendingReports((prev) => prev.filter((r) => r.id !== reportId));
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Failed to update report:", err);
      toast.error("Lỗi khi cập nhật báo cáo");
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case ReportStatus.Reviewed:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case ReportStatus.Resolved:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case ReportStatus.Dismissed:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending:
        return "Đang chờ";
      case ReportStatus.Reviewed:
        return "Đã xem";
      case ReportStatus.Resolved:
        return "Đã xử lý";
      case ReportStatus.Dismissed:
        return "Bị bác bỏ";
      default:
        return "Không xác định";
    }
  };

  const filteredMyReports = reports.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return r.status === ReportStatus.Pending;
    if (activeFilter === "reviewed") return r.status === ReportStatus.Reviewed;
    if (activeFilter === "resolved") return r.status === ReportStatus.Resolved;
    if (activeFilter === "dismissed")
      return r.status === ReportStatus.Dismissed;
    return true;
  });

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col gap-6">
        {/* View Switcher (Admin only) */}
        {isAdmin && (
          <div className="flex gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
            <button
              onClick={() => setActiveView("my_reports")}
              className={`text-[11px] font-black uppercase tracking-widest pb-2 transition-all relative ${
                activeView === "my_reports"
                  ? "text-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Báo cáo của tôi
              {activeView === "my_reports" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveView("admin_panel")}
              className={`text-[11px] font-black uppercase tracking-widest pb-2 transition-all relative flex items-center gap-2 ${
                activeView === "admin_panel"
                  ? "text-red-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Quản lý báo cáo
              {pendingReports.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full min-w-4 text-center">
                  {pendingReports.length}
                </span>
              )}
              {activeView === "admin_panel" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin text-primary">
              <span className="material-symbols-outlined text-4xl">sync</span>
            </div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : activeView === "admin_panel" ? (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-2xl">
              <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                Chào Quản trị viên, vui lòng xem xét và xử lý các báo cáo vi
                phạm bên dưới.
              </p>
            </div>

            {pendingReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <span className="material-symbols-outlined text-6xl text-green-500">
                  verified
                </span>
                <p className="font-black text-slate-900 dark:text-white">
                  Tuyệt vời! Không có báo cáo tồn đọng.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm hover:border-red-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                          <span className="material-symbols-outlined">
                            gavel
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Báo cáo #{report.id}
                          </p>
                          <h4 className="text-[14px] font-bold text-slate-900 dark:text-white">
                            <span className="text-red-500">
                              {report.reporterName}
                            </span>{" "}
                            báo cáo{" "}
                            <span className="text-primary">
                              {report.reportedUserName}
                            </span>
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {formatTime(report.reportedAt)}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl mb-4 text-sm">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2">
                        Thông tin vi phạm:
                      </p>
                      <div className="space-y-2">
                        <p className="font-bold text-slate-700 dark:text-slate-300">
                          Lý do: {report.reason}
                        </p>
                        <p className="italic text-slate-500 dark:text-slate-400">
                          "{report.description || "Không có mô tả thêm"}"
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(report.id, ReportStatus.Resolved)
                        }
                        className="flex-1 px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-600 transition-colors"
                      >
                        Giải quyết
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(report.id, ReportStatus.Dismissed)
                        }
                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                      >
                        Bác bỏ
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(report.id, ReportStatus.Reviewed)
                        }
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:border-primary hover:text-primary transition-all"
                      >
                        Đã xem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit">
              {(
                ["all", "pending", "reviewed", "resolved", "dismissed"] as const
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === filter
                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {filter === "all"
                    ? "Tất cả"
                    : filter === "pending"
                    ? "Chờ"
                    : filter === "reviewed"
                    ? "Đã xem"
                    : filter === "resolved"
                    ? "Xong"
                    : "Bị bác"}
                </button>
              ))}
            </div>

            {filteredMyReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <span className="material-symbols-outlined text-6xl text-slate-300">
                  report_off
                </span>
                <p className="font-black text-slate-900 dark:text-white text-center">
                  Bạn không gửi báo cáo nào trong mục này.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMyReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">
                            flag
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Báo cáo:{" "}
                            <span className="text-primary">
                              {report.reportedUserName}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {formatTime(report.reportedAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl text-xs">
                      <span className="font-black text-slate-400 mr-2 uppercase tracking-tighter">
                        Lý do:
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {report.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;

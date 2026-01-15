import { CreateReportRequest, ReportDto, ReportListItemDto } from "../types/report.types";
import axiosInstance from "./axios";

const reportApi = {
  // Create report
  createReport: (data: CreateReportRequest): Promise<any> =>
    axiosInstance
      .post("/reports", data)
      .then((res) => res.data),

  // Get report by ID (Admin)
  getReport: (reportId: number): Promise<ReportDto> =>
    axiosInstance
      .get(`/reports/${reportId}`)
      .then((res) => res.data),

  // Get reports for user (Admin)
  getUserReports: (userId: number): Promise<ReportListItemDto[]> =>
    axiosInstance
      .get(`/reports/user/${userId}`)
      .then((res) => res.data),

  // Get pending reports (Admin)
  getPendingReports: (): Promise<ReportListItemDto[]> =>
    axiosInstance
      .get("/reports/pending")
      .then((res) => res.data),

  // Get reports by reporter (Admin)
  getReportsByReporter: (reporterId: number): Promise<ReportListItemDto[]> =>
    axiosInstance
      .get(`/reports/reporter/${reporterId}`)
      .then((res) => res.data),

  // Update report status (Admin)
  updateReportStatus: (
    reportId: number,
    status: string | number,
    adminNotes?: string
  ): Promise<any> =>
    axiosInstance
      .put(`/reports/${reportId}/status`, { status, adminNotes })
      .then((res) => res.data),

  // Delete report (Admin)
  deleteReport: (reportId: number): Promise<any> =>
    axiosInstance
      .delete(`/reports/${reportId}`)
      .then((res) => res.data),
};

export default reportApi;
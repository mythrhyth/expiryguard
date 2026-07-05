import { axiosClient } from "../api/axiosClient";

export interface DashboardSummary {
  total: number;
  active: number;
  expiring: number;
  critical: number;
  expired: number;
  renewedThisMonth: number;
}

export interface ChartData {
  categoryDistribution: { name: string; value: number; color: string }[];
  departmentAnalytics: { name: string; value: number }[];
  monthlyRenewals: { month: string; renewals: number; expired: number }[];
  expiryTrends: { month: string; active: number; expiring: number; expired: number }[];
}

export interface ActivityItem {
  id: string;
  action: string;
  recordId?: string;
  recordName?: string;
  userId: string;
  userName: string;
  details?: string;
  createdAt: string;
}

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const res = await axiosClient.get("/dashboard/summary");
    return res.data.data;
  }

  static async getCharts(): Promise<ChartData> {
    const res = await axiosClient.get("/dashboard/charts");
    return res.data.data;
  }

  static async getRecentActivity(): Promise<ActivityItem[]> {
    const res = await axiosClient.get("/dashboard/activity");
    return res.data.data.activities;
  }
}

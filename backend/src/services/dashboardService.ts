import { prisma } from "../prisma/client";
import { calculateRecordStatus } from "../utils/statusCalculator";

export class DashboardService {
  static async getSummary() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const d7 = new Date(today);
    d7.setUTCDate(today.getUTCDate() + 7);

    const d8 = new Date(today);
    d8.setUTCDate(today.getUTCDate() + 8);

    const d30 = new Date(today);
    d30.setUTCDate(today.getUTCDate() + 30);

    const [total, active, expiring, critical, expired] = await prisma.$transaction([
      prisma.record.count(),
      prisma.record.count({ where: { expiryDate: { gt: d30 } } }),
      prisma.record.count({ where: { expiryDate: { gte: d8, lte: d30 } } }),
      prisma.record.count({ where: { expiryDate: { gte: today, lte: d7 } } }),
      prisma.record.count({ where: { expiryDate: { lt: today } } }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const renewedThisMonth = await prisma.renewalHistory.count({
      where: { renewedAt: { gte: startOfMonth } },
    });

    return {
      total,
      active,
      expiring,
      critical,
      expired,
      renewedThisMonth,
    };
  }

  static async getCharts() {
    // 1. Category Distribution
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { records: true } },
      },
    });

    const categoryDistribution = categories.map((cat) => ({
      name: cat.name,
      value: cat._count.records,
      color: cat.color,
    }));

    // 2. Department Analytics
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { records: true } },
      },
    });

    const departmentAnalytics = departments.map((dept) => ({
      name: dept.name,
      value: dept._count.records,
    }));

    // 3. Monthly Renewals & Expired (Current Calendar Year)
    const currentYear = new Date().getUTCFullYear();
    const monthlyData: { month: string; renewals: number; expired: number }[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 12; i++) {
      const startOfMonth = new Date(Date.UTC(currentYear, i, 1));
      const endOfMonth = new Date(Date.UTC(currentYear, i + 1, 0, 23, 59, 59, 999));

      const [renewals, expired] = await prisma.$transaction([
        prisma.renewalHistory.count({
          where: {
            renewedAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.record.count({
          where: {
            expiryDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
      ]);

      monthlyData.push({
        month: months[i],
        renewals,
        expired,
      });
    }

    // 4. Expiry Trend over the last 12 months (or next 12 months for forecasting)
    // To match frontend visuals, let's construct trendData for the last 6 months + next 6 months
    const trendData: { month: string; active: number; expiring: number; expired: number }[] = [];
    const today = new Date();
    
    for (let i = -5; i <= 6; i++) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1));
      const monthLabel = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });

      const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

      // Calculate totals for active/expiring/expired relative to that month's endpoint
      const activeCount = await prisma.record.count({
        where: {
          issueDate: { lte: end },
          expiryDate: { gt: new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
      });

      const expiringCount = await prisma.record.count({
        where: {
          expiryDate: {
            gt: end,
            lte: new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const expiredCount = await prisma.record.count({
        where: {
          expiryDate: { lte: end },
        },
      });

      trendData.push({
        month: monthLabel,
        active: activeCount,
        expiring: expiringCount,
        expired: expiredCount,
      });
    }

    return {
      categoryDistribution,
      departmentAnalytics,
      monthlyRenewals: monthlyData,
      expiryTrends: trendData,
    };
  }

  static async getRecentActivity() {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    return logs;
  }
}

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, FileText, FolderOpen, Calendar, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, Search, Moon, Sun,
  Plus, Upload, Download, AlertTriangle, CheckCircle, Clock, XCircle,
  Eye, Edit, RotateCcw, X, Building2, Shield, Activity,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Users, FileCheck,
  ChevronDown, User, RefreshCw, TrendingUp, SlidersHorizontal,
  ClipboardList, Filter, Layers
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

import { AuthService, User as UserType } from "./services/authService";
import { RecordsService, RecordItem } from "./services/recordsService";
import { DashboardService, DashboardSummary, ChartData, ActivityItem } from "./services/dashboardService";
import { GeneralService, CategoryItem, DepartmentItem } from "./services/generalService";
import { NotificationsService, NotificationItem } from "./services/notificationsService";
import { AIService as AIApiService, ExtractedInfo } from "./services/aiService";
import { AuthScreen } from "./components/AuthScreen";
import { LandingPage } from "./components/LandingPage";

// ─── UTILITY COMPONENTS ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    Expiring: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    Critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    Expired: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  };
  const c = cfg[status] || cfg.Active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, string> = {
    HIGH: "bg-red-50 text-red-700 border border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
    LOW: "bg-green-50 text-green-700 border border-green-200",
  };
  const label = priority.toUpperCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg[label] || ""}`}>
      {priority}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cfg: Record<string, string> = {
    Contracts: "bg-blue-50 text-blue-700",
    Compliance: "bg-purple-50 text-purple-700",
    Insurance: "bg-cyan-50 text-cyan-700",
    Licenses: "bg-emerald-50 text-emerald-700",
    Safety: "bg-orange-50 text-orange-700",
    "Machine Inspection": "bg-rose-50 text-rose-700",
    Other: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cfg[category] || "bg-gray-100 text-gray-600"}`}>
      {category}
    </span>
  );
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-cyan-600", "bg-rose-500"];
  const idx = name.charCodeAt(0) % colors.length;
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  return (
    <div className={`${colors[idx]} ${sizes[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-xl text-sm" style={{ boxShadow: "0 10px 40px rgba(15,23,42,0.12)" }}>
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 text-xs">{p.name}:</span>
          <span className="font-semibold text-gray-800 text-xs">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed,
  setCollapsed,
  currentPage,
  setCurrentPage,
  user,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  user: UserType;
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "records", label: "Records", icon: FileText },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? "w-[64px]" : "w-[232px]"}`}
      style={{ boxShadow: "1px 0 0 0 rgba(15,23,42,0.05)" }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0 gap-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.35)" }}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight">ExpiryGuard</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Enterprise</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative ${
                active ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon
                  style={{ width: "17px", height: "17px" }}
                  className={active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}
                />
              </div>
              {!collapsed && (
                <>
                  <span className={`text-sm font-medium flex-1 text-left whitespace-nowrap ${active ? "text-blue-700" : ""}`}>
                    {item.label}
                  </span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <Avatar name={user.fullName} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── TOP NAV ──────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  records: "Record Management",
  categories: "Categories",
  calendar: "Expiry Calendar",
  reports: "Reports",
  analytics: "Analytics",
  notifications: "Notifications",
  settings: "Settings",
};

function TopNav({
  darkMode,
  setDarkMode,
  setShowAddModal,
  currentPage,
  user,
  onLogout,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  setShowAddModal: (v: boolean) => void;
  currentPage: string;
  user: UserType;
  onLogout: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const list = await NotificationsService.getNotifications();
      setNotifications(list);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Poll notifications every 10s
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    await NotificationsService.markAllAsRead();
    fetchNotifs();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0 relative z-40"
      style={{ boxShadow: "0 1px 0 0 rgba(15,23,42,0.05)" }}
    >
      <div className="flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-900 leading-tight">{PAGE_TITLES[currentPage] || "Dashboard"}</h1>
        <p className="text-xs text-gray-400 leading-tight">Tata Steel Ltd · Enterprise</p>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search records, documents, owners..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-gray-100 z-50 overflow-hidden"
                style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.15)" }}
              >
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No alerts found</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 p-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            n.severity === "CRITICAL" || n.severity === "DANGER"
                              ? "bg-red-100"
                              : n.severity === "WARNING"
                              ? "bg-amber-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {n.severity === "CRITICAL" || n.severity === "DANGER" ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : n.severity === "WARNING" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Bell className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 font-medium leading-snug">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between">
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-600 font-medium hover:underline">
                    Mark all read
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User Card with click-to-logout */}
        <div
          onClick={onLogout}
          title="Click to Logout"
          className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Avatar name={user.fullName} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user.fullName}</p>
            <p className="text-[10px] text-red-500 font-bold leading-tight mt-0.5">Logout</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  trend,
  trendLabel,
  Icon,
  iconColor,
  bgColor,
  accentBorder,
}: {
  title: string;
  value: string;
  trend: "up" | "down";
  trendLabel: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  iconColor: string;
  bgColor: string;
  accentBorder: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-default group"
      style={{ borderColor: accentBorder, boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon style={{ width: "18px", height: "18px" }} className={iconColor} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-green-600" : "text-red-500"}`}>
          {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trendLabel}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{title}</div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────

function DashboardPage({
  setShowAddModal,
  setCurrentPage,
}: {
  setShowAddModal: (v: boolean) => void;
  setCurrentPage: (p: string) => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [upcoming, setUpcoming] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [calEvents, setCalEvents] = useState<Record<number, { name: string; status: string }[]>>({});
  const [calExpiries, setCalExpiries] = useState<Record<number, string>>({});

  const daysInJuly = 31;
  const firstDow = 3; // July 1, 2026 is a Wednesday
  const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [sumRes, chartsRes, actRes, alertsRes, recsRes] = await Promise.all([
          DashboardService.getSummary(),
          DashboardService.getCharts(),
          DashboardService.getRecentActivity(),
          NotificationsService.getNotifications(),
          RecordsService.getRecords({ limit: 6, status: "Critical" }),
        ]);

        setSummary(sumRes);
        setCharts(chartsRes);
        setActivities(actRes);
        setAlerts(alertsRes.filter((n) => !n.read));
        setUpcoming(recsRes.records);

        // Generate calendar markers dynamically from records expiring in July 2026
        const allRecs = await RecordsService.getRecords({ limit: 100 });
        const eventsMap: Record<number, any[]> = {};
        const expiriesMap: Record<number, string> = {};

        allRecs.records.forEach((r) => {
          const exp = new Date(r.expiryDate);
          if (exp.getFullYear() === 2026 && exp.getMonth() === 6) {
            // July
            const day = exp.getDate();
            if (!eventsMap[day]) eventsMap[day] = [];
            eventsMap[day].push({ name: r.name, status: r.status.toLowerCase() });

            const color = r.status === "Critical" ? "red" : r.status === "Expiring" ? "orange" : "green";
            expiriesMap[day] = color;
          }
        });
        setCalEvents(eventsMap);
        setCalExpiries(expiriesMap);
      } catch (error) {
        console.error("Failed to load dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading || !summary || !charts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1360px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Good morning 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here is what needs your attention today</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage("reports")}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Reports
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
            style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          title="Total Records"
          value={String(summary.total)}
          trend="up"
          trendLabel="+4.2%"
          Icon={ClipboardList}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          accentBorder="rgba(37,99,235,0.15)"
        />
        <KPICard
          title="Active Records"
          value={String(summary.active)}
          trend="up"
          trendLabel="+2.8%"
          Icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          accentBorder="rgba(22,163,74,0.15)"
        />
        <KPICard
          title="Expiring Soon"
          value={String(summary.expiring)}
          trend="down"
          trendLabel="+5.1%"
          Icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          accentBorder="rgba(245,158,11,0.15)"
        />
        <KPICard
          title="Critical (0–7 days)"
          value={String(summary.critical)}
          trend="down"
          trendLabel="+12%"
          Icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          accentBorder="rgba(220,38,38,0.15)"
        />
        <KPICard
          title="Expired"
          value={String(summary.expired)}
          trend="down"
          trendLabel="+3.2%"
          Icon={XCircle}
          iconColor="text-gray-500"
          bgColor="bg-gray-100"
          accentBorder="rgba(107,114,128,0.12)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Renewals by Month</h3>
              <p className="text-xs text-gray-400 mt-0.5">Scheduled renewals vs expirations</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                Renewals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />
                Expired
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.monthlyRenewals} barSize={20} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(37,99,235,0.04)", radius: 8 }} />
              <Bar dataKey="renewals" fill="#2563EB" radius={[6, 6, 0, 0]} name="Renewals" />
              <Bar dataKey="expired" fill="#FCA5A5" radius={[6, 6, 0, 0]} name="Expired" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Category Distribution</h3>
          <p className="text-xs text-gray-400 mb-3">{summary.total} records across categories</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={charts.categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {charts.categoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {charts.categoryDistribution.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-xs text-gray-600">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-5">
        {/* Area/Line chart - Expiry Trend */}
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Record Expiry Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Active, Expiring, and Expired status projections</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />
                Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-amber-500 rounded" />
                Expiring
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-red-400 rounded" />
                Expired
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.expiryTrends}>
              <defs>
                <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpiring" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="active" stroke="#2563EB" strokeWidth={2.5} fill="url(#gActive)" name="Active" dot={false} />
              <Area type="monotone" dataKey="expiring" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gExpiring)" name="Expiring" dot={false} />
              <Area type="monotone" dataKey="expired" stroke="#F87171" strokeWidth={2.5} fill="none" name="Expired" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts panel */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Live Alerts</h3>
            <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">{alerts.length} new</span>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((n) => (
              <div key={n.id} onClick={() => setCurrentPage("notifications")} className="flex gap-3 cursor-pointer group">
                <div
                  className={`w-1 rounded-full flex-shrink-0 self-stretch ${
                    n.severity === "CRITICAL" || n.severity === "DANGER"
                      ? "bg-red-500"
                      : n.severity === "WARNING"
                      ? "bg-amber-400"
                      : "bg-blue-400"
                  }`}
                  style={{ minHeight: "36px" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 font-medium leading-snug group-hover:text-blue-600 transition-colors">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage("notifications")}
            className="mt-4 w-full text-xs text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-xl transition-colors text-center cursor-pointer"
          >
            View all alerts →
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Upcoming renewals table */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Renewals</h3>
              <p className="text-xs text-gray-400 mt-0.5">Critical records expiring within 7 days</p>
            </div>
            <button onClick={() => setCurrentPage("records")} className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Record Name</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Expiry</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Days Left</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcoming.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800 max-w-[180px] truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.department.name}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <CategoryBadge category={r.category.name} />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.owner.fullName} size="sm" />
                        <span className="text-xs text-gray-600">{r.owner.fullName.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-600">
                      {new Date(r.expiryDate).toISOString().split("T")[0]}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-sm font-bold ${r.daysLeft <= 7 ? "text-red-600" : "text-amber-600"}`}>
                        {r.daysLeft}d
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Add Record",
                  Icon: Plus,
                  cls: "text-blue-600 bg-blue-50 hover:bg-blue-100",
                  fn: () => setShowAddModal(true),
                },
                {
                  label: "Record List",
                  Icon: FileText,
                  cls: "text-purple-600 bg-purple-50 hover:bg-purple-100",
                  fn: () => setCurrentPage("records"),
                },
                {
                  label: "Export CSV",
                  Icon: Download,
                  cls: "text-green-600 bg-green-50 hover:bg-green-100",
                  fn: () => {
                    const token = localStorage.getItem("accessToken");
                    const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
                    window.open(`${apiBase}/reports/export?format=csv&token=${token}`);
                  },
                },
                {
                  label: "Expiry Calendar",
                  Icon: Calendar,
                  cls: "text-amber-600 bg-amber-50 hover:bg-amber-100",
                  fn: () => setCurrentPage("calendar"),
                },
              ].map((qa) => (
                <button
                  key={qa.label}
                  onClick={qa.fn}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 cursor-pointer ${qa.cls}`}
                >
                  <qa.Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">July 2026</h3>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInJuly }).map((_, i) => {
                const day = i + 1;
                const expColor = calExpiries[day];
                const isToday = day === 2; // Fixed reference date
                return (
                  <div key={day} className="flex flex-col items-center py-0.5 cursor-pointer group">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-colors ${
                        isToday ? "bg-blue-600 text-white font-bold" : "text-gray-600 group-hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </div>
                    {expColor && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          expColor === "red" ? "bg-red-500" : expColor === "orange" ? "bg-amber-400" : "bg-green-500"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              {[
                ["red-500", "Critical"],
                ["amber-400", "Expiring"],
                ["green-500", "Active"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full`}
                    style={{
                      background: color === "red-500" ? "#EF4444" : color === "amber-400" ? "#FBBF24" : "#22C55E",
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.action.toLowerCase().includes("add") || a.action.toLowerCase().includes("creat")
                        ? "bg-blue-100"
                        : a.action.toLowerCase().includes("renew")
                        ? "bg-green-100"
                        : a.action.toLowerCase().includes("updat")
                        ? "bg-amber-100"
                        : a.action.toLowerCase().includes("delet")
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {a.action.toLowerCase().includes("add") || a.action.toLowerCase().includes("creat") ? (
                      <Plus style={{ width: "13px", height: "13px" }} className="text-blue-600" />
                    ) : a.action.toLowerCase().includes("renew") ? (
                      <RotateCcw style={{ width: "13px", height: "13px" }} className="text-green-600" />
                    ) : a.action.toLowerCase().includes("updat") ? (
                      <Edit style={{ width: "13px", height: "13px" }} className="text-amber-600" />
                    ) : a.action.toLowerCase().includes("delet") ? (
                      <X style={{ width: "13px", height: "13px" }} className="text-red-600" />
                    ) : (
                      <Download style={{ width: "13px", height: "13px" }} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold">{a.action}</span> {a.recordName || a.details}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {a.userName} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS PAGE ─────────────────────────────────────────────────────────────

function RecordsPage({ setShowAddModal }: { setShowAddModal: (v: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [renewRecord, setRenewRecord] = useState<RecordItem | null>(null);
  const [renewExpiry, setRenewExpiry] = useState("");
  const [renewRemarks, setRenewRemarks] = useState("");
  const [renewing, setRenewing] = useState(false);

  const perPage = 8;

  useEffect(() => {
    GeneralService.getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await RecordsService.getRecords({
        page,
        limit: perPage,
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setRecords(res.records);
      setPagination({ total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this record?")) {
      try {
        await RecordsService.deleteRecord(id);
        loadRecords();
      } catch (err) {
        alert("Failed to delete record: Verify you have Administrator access.");
      }
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewRecord || !renewExpiry) return;
    setRenewing(true);

    try {
      await RecordsService.renewRecord(renewRecord.id, renewExpiry, renewRemarks);
      setRenewRecord(null);
      setRenewExpiry("");
      setRenewRemarks("");
      loadRecords();
    } catch (err) {
      alert("Failed to renew record.");
    } finally {
      setRenewing(false);
    }
  };

  const toggleRow = (id: string) =>
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  
  const allOnPage = records.length > 0 && records.every((r) => selectedRows.includes(r.id));

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    const token = localStorage.getItem("accessToken");
    let queryParams = `format=${format}&token=${token}`;
    if (search) queryParams += `&search=${encodeURIComponent(search)}`;
    if (statusFilter !== "All") queryParams += `&status=${statusFilter}`;
    if (categoryFilter !== "All") queryParams += `&category=${categoryFilter}`;
    const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
    window.open(`${apiBase}/reports/export?${queryParams}`);
  };

  return (
    <div className="p-6 max-w-[1360px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Records</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total records synced</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Excel Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
            style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              type="text"
              placeholder="Search records..."
              className="h-9 pl-9 pr-4 w-56 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
            />
          </div>
          <div className="flex items-center gap-1">
            {["All", "Active", "Expiring", "Critical", "Expired"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none min-w-36"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-gray-400">{pagination.total} records found</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={() =>
                        allOnPage ? setSelectedRows([]) : setSelectedRows(records.map((r) => r.id))
                      }
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                    />
                  </th>
                  {[
                    "Document Name",
                    "Category",
                    "Department",
                    "Owner",
                    "Issue Date",
                    "Expiry Date",
                    "Days Left",
                    "Priority",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-3.5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <FileCheck className="w-10 h-10 text-gray-200" />
                        <p className="text-sm font-medium text-gray-400">No records found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50/60 transition-colors group ${selectedRows.includes(r.id) ? "bg-blue-50/30" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(r.id)}
                          onChange={() => toggleRow(r.id)}
                          className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-semibold text-gray-800 max-w-[170px] truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.documentNumber || "N/A"}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <CategoryBadge category={r.category.name} />
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-600 whitespace-nowrap">{r.department.name}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.owner.fullName} size="sm" />
                          <span className="text-sm text-gray-700">{r.owner.fullName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(r.issueDate).toISOString().split("T")[0]}
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-600 whitespace-nowrap font-medium">
                        {new Date(r.expiryDate).toISOString().split("T")[0]}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-sm font-bold ${
                            r.daysLeft < 0 ? "text-gray-400" : r.daysLeft <= 7 ? "text-red-600" : r.daysLeft <= 30 ? "text-amber-600" : "text-gray-700"
                          }`}
                        >
                          {r.daysLeft}d
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.attachmentUrl && (
                            <a
                              href={`${((import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api").replace(/\/api$/, "")}${r.attachmentUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Download Attachment"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setRenewRecord(r)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                            title="Renew Record"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">
            Page {page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {renewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Renew: {renewRecord.name}</h3>
            <p className="text-xs text-gray-400 mb-4">Extend document expiry bounds</p>
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={renewExpiry}
                  onChange={(e) => setRenewExpiry(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks</label>
                <textarea
                  placeholder="Reason for renewal or notes..."
                  value={renewRemarks}
                  onChange={(e) => setRenewRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewRecord(null)}
                  className="px-4 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewing}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 cursor-pointer disabled:opacity-50"
                >
                  {renewing ? "Renewing..." : "Complete Renewal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADD RECORD MODAL ─────────────────────────────────────────────────────────

function AddRecordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    departmentId: "",
    ownerId: "",
    vendor: "",
    docNumber: "",
    issueDate: "",
    expiryDate: "",
    priority: "MEDIUM",
    description: "",
  });

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // AI Document Intelligence States
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [confidence, setConfidence] = useState<Record<string, number> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);

  const steps = [
    "Analyzing document...",
    "Extracting information...",
    "Detecting expiry date...",
    "Finding category...",
    "Reading document...",
  ];

  useEffect(() => {
    // Fetch dropdown data
    GeneralService.getCategories().then(setCategories).catch(console.error);
    GeneralService.getDepartments().then(setDepartments).catch(console.error);
    AuthService.getUsers().then(setUsers).catch(console.error);
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setAnalyzing(true);
    setAnalysisStep(0);

    // Animate loader texts
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1100);

    try {
      const extracted = await AIApiService.extractDocument(selectedFile);

      // Map dynamic dropdown IDs
      let categoryId = "";
      if (extracted.category) {
        const found = categories.find(
          (c) =>
            c.name.toLowerCase().includes(extracted.category.toLowerCase()) ||
            extracted.category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (found) categoryId = found.id;
      }

      let departmentId = "";
      if (extracted.department) {
        const found = departments.find(
          (d) =>
            d.name.toLowerCase().includes(extracted.department.toLowerCase()) ||
            extracted.department.toLowerCase().includes(d.name.toLowerCase())
        );
        if (found) departmentId = found.id;
      }

      let ownerId = "";
      if (users.length > 0) {
        // Fallback to first user in list or matching owner name
        ownerId = users[0].id;
      }

      setForm({
        name: extracted.recordName || "",
        categoryId: categoryId || (categories[0]?.id || ""),
        departmentId: departmentId || (departments[0]?.id || ""),
        ownerId: ownerId,
        vendor: extracted.vendor || "",
        docNumber: extracted.documentNumber || "",
        issueDate: extracted.issueDate || "",
        expiryDate: extracted.expiryDate || "",
        priority: (extracted.priority?.toUpperCase() as any) || "MEDIUM",
        description: extracted.description || "",
      });

      setConfidence(extracted.confidence);
      setWarnings(extracted.warnings || []);
      setAiSummary(extracted.summary || "");
    } catch (error) {
      console.error("Document intelligence error:", error);
      alert("AI Extraction failed. Reverting to manual entry.");
      setIsManualEntry(true);
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.departmentId || !form.ownerId || !form.issueDate || !form.expiryDate) {
      alert("Please fill all required fields (*)");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("categoryId", form.categoryId);
    formData.append("departmentId", form.departmentId);
    formData.append("ownerId", form.ownerId);
    formData.append("issueDate", form.issueDate);
    formData.append("expiryDate", form.expiryDate);
    formData.append("priority", form.priority);

    if (form.vendor) formData.append("vendor", form.vendor);
    if (form.docNumber) formData.append("documentNumber", form.docNumber);
    if (form.description) formData.append("description", form.description);
    if (file) formData.append("attachment", file);

    try {
      await RecordsService.createRecord(formData);
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  // Helper flags for low confidence indicators (<70%)
  const isLowConf = (field: string) => {
    if (!confidence || confidence[field] === undefined) return false;
    return confidence[field] < 70;
  };

  const getInputClass = (field: string) => {
    const base = "w-full h-10 px-3.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-gray-800";
    if (isLowConf(field)) {
      return `${base} border-amber-400 focus:ring-amber-500/20 focus:border-amber-500`;
    }
    return `${base} border-gray-200 focus:ring-blue-500/20 focus:border-blue-400`;
  };

  const renderLabel = (label: string, field: string, required = false) => {
    return (
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {isLowConf(field) && (
          <span className="ml-2 text-[10px] text-amber-600 font-bold inline-flex items-center gap-0.5 uppercase tracking-wide bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" /> Verify ({confidence?.[field]}%)
          </span>
        )}
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" style={{ boxShadow: "0 40px 80px rgba(15,23,42,0.22)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-blue-600" style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Add New Record</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create or auto-extract expiry tracking record</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Inner Layout */}
        {!file && !isManualEntry && !analyzing ? (
          /* Step 1: Upload Dropzone Panel */
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Contract or Document</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Drop your PDF, contract, safety or training certificate here. ExpiryGuard AI will pre-fill values dynamically.
            </p>

            <input
              type="file"
              id="initial-file-upload"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFileUpload(selected);
              }}
            />
            <label
              htmlFor="initial-file-upload"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/20 mb-4 inline-block"
            >
              Browse Files
            </label>

            <button
              onClick={() => setIsManualEntry(true)}
              className="text-xs text-gray-400 font-semibold hover:text-gray-600 hover:underline cursor-pointer"
            >
              Skip to manual entry
            </button>
          </div>
        ) : analyzing ? (
          /* Step 2: Animated Loader Steps */
          <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              <Shield className="w-8 h-8 text-blue-600 relative z-10" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Document Intelligence Active</h3>
            <p className="text-sm text-blue-600 font-semibold animate-pulse transition-all duration-300">
              {steps[analysisStep]}
            </p>
            <p className="text-xs text-gray-400 mt-2">Extracting vendor names, category distributions, and dates...</p>
          </div>
        ) : (
          /* Step 3: Prefilled / Manual Entry Form */
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* AI Summary Block */}
              {aiSummary && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> AI Summary
                  </h4>
                  <p className="text-xs text-blue-900 leading-relaxed font-medium">{aiSummary}</p>
                </div>
              )}

              {/* AI Compliance Warnings */}
              {warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> AI Verification Alerts
                  </h4>
                  {warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-amber-900 leading-normal font-medium">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              <div>
                {renderLabel("Record Name", "recordName", true)}
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Annual Fire Safety Certificate"
                  className={getInputClass("recordName")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderLabel("Category", "category", true)}
                  <select
                    value={form.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                    className={getInputClass("category")}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {renderLabel("Department", "department", true)}
                  <select
                    value={form.departmentId}
                    onChange={(e) => set("departmentId", e.target.value)}
                    className={getInputClass("department")}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderLabel("Record Owner", "owner", true)}
                  <select
                    value={form.ownerId}
                    onChange={(e) => set("ownerId", e.target.value)}
                    className={getInputClass("owner")}
                  >
                    <option value="">Select owner</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {renderLabel("Vendor / Authority", "vendor")}
                  <input
                    value={form.vendor}
                    onChange={(e) => set("vendor", e.target.value)}
                    placeholder="e.g. Bureau of Indian Standards"
                    className={getInputClass("vendor")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderLabel("Document Number", "documentNumber")}
                  <input
                    value={form.docNumber}
                    onChange={(e) => set("docNumber", e.target.value)}
                    placeholder="e.g. FSC-2024-0891"
                    className={getInputClass("documentNumber")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => set("priority", e.target.value)}
                    className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderLabel("Issue Date", "issueDate", true)}
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => set("issueDate", e.target.value)}
                    className={getInputClass("issueDate")}
                  />
                </div>
                <div>
                  {renderLabel("Expiry Date", "expiryDate", true)}
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => set("expiryDate", e.target.value)}
                    className={getInputClass("expiryDate")}
                  />
                </div>
              </div>

              <div>
                {renderLabel("Description", "description")}
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Add relevant notes, context, or reminders..."
                  rows={3}
                  className={getInputClass("description") + " h-auto resize-none"}
                />
              </div>

              {/* Show file details if uploaded */}
              {file && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
              >
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────

function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [sumRes, chartsRes] = await Promise.all([
          DashboardService.getSummary(),
          DashboardService.getCharts(),
        ]);
        setSummary(sumRes);
        setCharts(chartsRes);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleExport = (format: "excel" | "pdf") => {
    const token = localStorage.getItem("accessToken");
    const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
    window.open(`${apiBase}/reports/export?format=${format}&token=${token}`);
  };

  if (loading || !summary || !charts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Comprehensive compliance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Compliance Records", value: String(summary.total), Icon: Clock, colors: "text-blue-600 bg-blue-50" },
          { label: "Critical Warn Files", value: String(summary.critical), Icon: AlertTriangle, colors: "text-red-600 bg-red-50" },
          { label: "Upcoming (30 days)", value: String(summary.expiring), Icon: Bell, colors: "text-amber-600 bg-amber-50" },
          { label: "Renewed (Current)", value: String(summary.renewedThisMonth), Icon: Building2, colors: "text-green-600 bg-green-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.colors.split(" ")[1]}`}>
              <card.Icon style={{ width: "18px", height: "18px" }} className={card.colors.split(" ")[0]} />
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Monthly Renewals</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.monthlyRenewals} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="renewals" fill="#2563EB" radius={[6, 6, 0, 0]} name="Renewals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Records by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.categoryDistribution} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={95} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Records">
                {charts.categoryDistribution.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Active vs. Expired Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.expiryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="active" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Active" />
              <Line type="monotone" dataKey="expired" stroke="#DC2626" strokeWidth={2.5} dot={false} name="Expired" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Renewal Rate by Category</h3>
          <div className="space-y-4 mt-2">
            {[
              { name: "Contracts", rate: 94, color: "#2563EB" },
              { name: "Compliance", rate: 88, color: "#7C3AED" },
              { name: "Insurance", rate: 97, color: "#0891B2" },
              { name: "Licenses", rate: 82, color: "#059669" },
              { name: "Safety", rate: 76, color: "#D97706" },
              { name: "Machine Insp.", rate: 91, color: "#DC2626" },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900">{item.rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.rate}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────

function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysInMonth = 31;
  const firstDow = 3; // July 2026 starts on Wednesday

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true);
        const res = await RecordsService.getRecords({ limit: 100 });
        setRecords(res.records);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadCalendar();
  }, []);

  const calEvents: Record<number, { name: string; status: string }[]> = {};
  records.forEach((r) => {
    const expDate = new Date(r.expiryDate);
    if (expDate.getFullYear() === 2026 && expDate.getMonth() === 6) {
      const day = expDate.getDate();
      if (!calEvents[day]) {
        calEvents[day] = [];
      }
      calEvents[day].push({ name: r.name, status: r.status.toLowerCase() });
    }
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expiry Calendar</h2>
          <p className="text-sm text-gray-500 mt-0.5">July 2026 · Color-coded by urgency</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            {(["month", "week", "agenda"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer ${
                  view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 py-3.5 border-r border-gray-100 last:border-r-0 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" style={{ gridAutoRows: "110px" }}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} className="border-r border-b border-gray-100 bg-gray-50/40" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === 2; // Fixed reference matching current mock dates
            const events = calEvents[day] || [];
            const col = (i + firstDow) % 7;
            return (
              <div
                key={day}
                className={`border-b border-gray-100 p-2 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                  col < 6 ? "border-r border-gray-100" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1.5 transition-colors ${
                    isToday ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {events.map((ev, ei) => (
                    <div
                      key={ei}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold truncate ${
                        ev.status === "critical"
                          ? "bg-red-100 text-red-700"
                          : ev.status === "expiring"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ev.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4">
        {[
          { color: "#EF4444", label: "Critical (0–7 days)", bg: "bg-red-100" },
          { color: "#F59E0B", label: "Expiring (8–30 days)", bg: "bg-amber-100" },
          { color: "#22C55E", label: "Active (30+ days)", bg: "bg-green-100" },
        ].map((leg) => (
          <div key={leg.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-md ${leg.bg}`} style={{ border: `1.5px solid ${leg.color}30` }} />
            <span className="text-xs text-gray-500 font-medium">{leg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORIES PAGE ──────────────────────────────────────────────────────────

function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const res = await GeneralService.getCategories();
        setCategories(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const grandTotal = categories.reduce((sum, cat) => sum + (cat._count?.records || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage and configure record categories</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {categories.map((cat) => {
          const val = cat._count?.records || 0;
          const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
              style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: cat.color + "18" }}>
                  <div className="w-5 h-5 rounded-full" style={{ background: cat.color }} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{val}</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{pct.toFixed(1)}% of all records</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct.toFixed(0)}%`, background: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────

function AnalyticsPage() {
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        setLoading(true);
        const res = await DashboardService.getCharts();
        setCharts(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadCharts();
  }, []);

  if (loading || !charts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Deep insights into compliance health and renewal performance</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">12-Month Expiry Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={charts.expiryTrends}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="active" stroke="#2563EB" strokeWidth={2.5} fill="url(#ag1)" name="Active" dot={false} />
              <Area type="monotone" dataKey="expiring" stroke="#F59E0B" strokeWidth={2.5} fill="none" name="Expiring" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Renewal Success Rate by Category</h3>
          <div className="space-y-4 mt-2">
            {[
              { name: "Insurance", rate: 97, color: "#0891B2" },
              { name: "Contracts", rate: 94, color: "#2563EB" },
              { name: "Machine Insp.", rate: 91, color: "#DC2626" },
              { name: "Compliance", rate: 88, color: "#7C3AED" },
              { name: "Licenses", rate: 82, color: "#059669" },
              { name: "Safety", rate: 76, color: "#D97706" },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>
                    {item.rate}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.rate}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Monthly Renewals vs. Expirations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.monthlyRenewals} barSize={22} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="renewals" fill="#2563EB" radius={[5, 5, 0, 0]} name="Renewals" />
              <Bar dataKey="expired" fill="#FCA5A5" radius={[5, 5, 0, 0]} name="Expired" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────────

function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationsService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    await NotificationsService.markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await NotificationsService.markAllAsRead();
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread alerts requiring attention</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No notifications available</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`flex gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                !n.read ? "bg-blue-50/20" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.severity === "CRITICAL" || n.severity === "DANGER"
                    ? "bg-red-100"
                    : n.severity === "WARNING"
                    ? "bg-amber-100"
                    : "bg-blue-100"
                }`}
              >
                {(n.severity === "CRITICAL" || n.severity === "DANGER") && <XCircle className="w-5 h-5 text-red-600" />}
                {n.severity === "WARNING" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {n.severity === "INFO" && <Bell className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function SettingsPage() {
  const [emailR, setEmailR] = useState(true);
  const [slackN, setSlackN] = useState(false);
  const [smsN, setSmsN] = useState(true);
  const [reminderDays, setReminderDays] = useState("30");
  const [users, setUsers] = useState<{ id: string; fullName: string; email: string; role: string }[]>([]);

  useEffect(() => {
    AuthService.getUsers()
      .then((res) => {
        // Map users list to render mock settings role (or default role)
        const mapped = res.map((u) => ({
          ...u,
          role: u.email.includes("rohan") ? "Admin" : u.email.includes("priya") || u.email.includes("amit") ? "Manager" : "Viewer",
        }));
        setUsers(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organization, notifications, and security</p>
      </div>

      <div className="space-y-5">
        {/* Organization */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-5">Organization Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Organization Name</label>
                <input
                  defaultValue="Tata Steel Ltd"
                  className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Industry</label>
                <select className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none text-gray-800">
                  <option>Steel and Mining</option>
                  <option>Manufacturing</option>
                  <option>IT Services</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contact Email</label>
              <input
                defaultValue="compliance@tatasteel.com"
                className="w-full h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-5">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              {
                label: "Email Reminders",
                desc: "Receive email alerts for records approaching expiry",
                checked: emailR,
                toggle: () => setEmailR((v) => !v),
              },
              {
                label: "Slack Notifications",
                desc: "Push alerts directly to your team Slack workspace",
                checked: slackN,
                toggle: () => setSlackN((v) => !v),
              },
              {
                label: "SMS Alerts",
                desc: "Text message alerts for critical expiries only",
                checked: smsN,
                toggle: () => setSmsN((v) => !v),
              },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                </div>
                <Toggle checked={p.checked} onChange={p.toggle} />
              </div>
            ))}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Send reminder before expiry</label>
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="h-10 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none w-40 text-gray-800"
              >
                {["7", "14", "30", "60", "90"].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users & Roles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900">Users & Roles</h3>
          </div>
          <div className="space-y-1">
            {users.map((u) => (
              <div key={u.email} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <Avatar name={u.fullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{u.fullName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    u.role === "Admin"
                      ? "bg-blue-50 text-blue-700"
                      : u.role === "Manager"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check local session
    if (AuthService.isAuthenticated()) {
      AuthService.getMe()
        .then((u) => {
          setUser(u);
          setAuthLoading(false);
        })
        .catch(() => {
          setUser(null);
          setAuthLoading(false);
        });
    } else {
      setUser(null);
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setShowAuth(false);
    setCurrentPage("dashboard");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage setShowAddModal={setShowAddModal} setCurrentPage={setCurrentPage} />;
      case "records":
        return <RecordsPage setShowAddModal={setShowAddModal} />;
      case "categories":
        return <CategoriesPage />;
      case "calendar":
        return <CalendarPage />;
      case "reports":
        return <ReportsPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage setShowAddModal={setShowAddModal} setCurrentPage={setCurrentPage} />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    if (!showAuth) {
      return (
        <LandingPage
          onGetStarted={() => setShowAuth(true)}
          onSignIn={() => setShowAuth(true)}
        />
      );
    }
    return (
      <AuthScreen
        onLoginSuccess={setUser}
        onBackToHome={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: darkMode ? "#0A0A0F" : "#F8FAFC",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          user={user}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNav
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setShowAddModal={setShowAddModal}
            currentPage={currentPage}
            user={user}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>
            {renderPage()}
          </main>
        </div>
        {showAddModal && <AddRecordModal onClose={() => setShowAddModal(false)} />}
      </div>
    </div>
  );
}

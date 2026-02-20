"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Activity,
  Loader2,
  CalendarIcon,
  Users,
  AlertTriangle,
  BarChart3,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

// ---- Types ----

interface DashboardLog {
  id: string;
  user: string;
  role: string;
  timestamp: string;
  action: string;
  target: string;
  highlight?: Record<string, string[]> | null;
  sort?: any[];
}

interface ApplicationLog {
  id: string;
  timestamp: string;
  server: string;
  application: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "CRIT";
  message: string;
  highlight?: Record<string, string[]> | null;
  sort?: any[];
}

interface AuditStats {
  dashboard: {
    total: number;
    eventsToday: number;
    uniqueUsers: number;
    actionBreakdown: { action: string; count: number }[];
    users: string[];
    timeline: { time: string; count: number }[];
  };
  application: {
    total: number;
    errorsToday: number;
    levelBreakdown: { level: string; count: number }[];
    servers: string[];
    applications: string[];
  };
}

// ---- Constants ----

const LOG_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG", "CRIT"] as const;
const ACTIONS = [
  "LOGIN", "LOGOUT", "SIGNUP", "SEARCH", "VIEW", "DOWNLOAD",
  "WHITELIST_ADD", "WHITELIST_DELETE", "BULK_WHITELIST",
  "USER_DELETE", "ROLE_UPDATE", "RETENTION_UPDATE", "PASSWORD_CHANGE",
] as const;
const ROLES = ["admin", "viewer", "whitelist"] as const;
const PAGE_SIZE = 20;

const timelineChartConfig: ChartConfig = {
  count: { label: "Events", color: "hsl(var(--chart-1))" },
};

// ---- Helpers ----

function getLogLevelBadge(level: string) {
  const styles: Record<string, string> = {
    INFO: "bg-chart-2/20 text-chart-2",
    WARN: "bg-warning/20 text-warning-foreground",
    ERROR: "bg-destructive/20 text-destructive",
    CRIT: "bg-destructive/20 text-destructive",
    DEBUG: "bg-muted text-muted-foreground",
  };
  return styles[level] || "bg-muted text-muted-foreground";
}

function getActionBadgeColor(action: string) {
  if (action.includes("LOGIN") || action.includes("LOGOUT")) return "bg-chart-1/20 text-chart-1";
  if (action.includes("WHITELIST")) return "bg-warning/20 text-warning-foreground";
  if (action.includes("DELETE") || action.includes("ERROR")) return "bg-destructive/20 text-destructive";
  return "bg-muted text-muted-foreground";
}

function SortIcon({ field, currentField, currentOrder }: { field: string; currentField: string; currentOrder: string }) {
  if (field !== currentField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
  return currentOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
}

function formatTimestamp(ts: string): string {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function HighlightedCell({ highlight, field, fallback, className }: { highlight?: Record<string, string[]> | null; field: string; fallback: string; className?: string }) {
  const fragments = highlight?.[field];
  if (fragments && fragments.length > 0) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: fragments[0] }} />;
  }
  return <span className={className}>{fallback}</span>;
}

// ---- Component ----

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Stats
  const [stats, setStats] = useState<AuditStats | null>(null);

  // Dashboard logs state
  const [dashLogs, setDashLogs] = useState<DashboardLog[]>([]);
  const [dashTotal, setDashTotal] = useState(0);
  const [dashPage, setDashPage] = useState(1);
  const [dashSortField, setDashSortField] = useState("timestamp");
  const [dashSortOrder, setDashSortOrder] = useState<"asc" | "desc">("desc");
  const [dashLoading, setDashLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  // Application logs state
  const [appLogs, setAppLogs] = useState<ApplicationLog[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const [appSortField, setAppSortField] = useState("timestamp");
  const [appSortOrder, setAppSortOrder] = useState<"asc" | "desc">("desc");
  const [appLoading, setAppLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState("all");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset pages when search/filters change
  useEffect(() => { setDashPage(1); }, [debouncedSearch, actionFilter, roleFilter, userFilter, dateRange]);
  useEffect(() => { setAppPage(1); }, [debouncedSearch, levelFilter, dateRange]);

  // Fetch stats on mount
  useEffect(() => {
    fetch("/api/audit/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  // ---- Data fetchers ----

  const fetchDashboardLogs = useCallback(async () => {
    setDashLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(dashPage),
        pageSize: String(PAGE_SIZE),
        sortField: dashSortField,
        sortOrder: dashSortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter !== "all") params.set("actionFilter", actionFilter);
      if (roleFilter !== "all") params.set("roleFilter", roleFilter);
      if (userFilter !== "all") params.set("userFilter", userFilter);
      if (dateRange?.from) params.set("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.set("endDate", dateRange.to.toISOString());

      const res = await fetch(`/api/audit/dashboard-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDashLogs(data.logs || []);
      setDashTotal(data.total || 0);
    } catch {
      setDashLogs([]);
      setDashTotal(0);
    } finally {
      setDashLoading(false);
    }
  }, [dashPage, dashSortField, dashSortOrder, debouncedSearch, actionFilter, roleFilter, userFilter, dateRange]);

  const fetchAppLogs = useCallback(async () => {
    setAppLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(appPage),
        pageSize: String(PAGE_SIZE),
        sortField: appSortField,
        sortOrder: appSortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (levelFilter !== "all") params.set("levelFilter", levelFilter);
      if (dateRange?.from) params.set("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.set("endDate", dateRange.to.toISOString());

      const res = await fetch(`/api/audit/application-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAppLogs(data.logs || []);
      setAppTotal(data.total || 0);
    } catch {
      setAppLogs([]);
      setAppTotal(0);
    } finally {
      setAppLoading(false);
    }
  }, [appPage, appSortField, appSortOrder, debouncedSearch, levelFilter, dateRange]);

  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboardLogs();
  }, [activeTab, fetchDashboardLogs]);

  useEffect(() => {
    if (activeTab === "application") fetchAppLogs();
  }, [activeTab, fetchAppLogs]);

  // ---- Sort handlers ----

  function toggleDashSort(field: string) {
    setDashPage(1);
    if (dashSortField === field) {
      setDashSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setDashSortField(field);
      setDashSortOrder("desc");
    }
  }

  function toggleAppSort(field: string) {
    setAppPage(1);
    if (appSortField === field) {
      setAppSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setAppSortField(field);
      setAppSortOrder("desc");
    }
  }

  const totalDashPages = Math.max(1, Math.ceil(dashTotal / PAGE_SIZE));
  const totalAppPages = Math.max(1, Math.ceil(appTotal / PAGE_SIZE));

  // Prepare timeline data for chart
  const timelineData = (stats?.dashboard.timeline ?? []).map((t) => ({
    time: new Date(t.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
    count: t.count,
  }));

  const dynamicUsers = stats?.dashboard.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          View system activity and application logs
        </p>
      </div>

      {/* ---- Stats Cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.dashboard.total ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Dashboard log entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.dashboard.eventsToday ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dashboard.uniqueUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Distinct users logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.application.errorsToday ?? 0}</div>
            <p className="text-xs text-muted-foreground">ERROR + CRIT today</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Activity Timeline ---- */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Timeline (7 days)</CardTitle>
            <CardDescription>Hourly event distribution from date_histogram aggregation</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={timelineChartConfig} className="h-[140px] w-full">
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={30} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" fill="url(#fillEvents)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ---- Tabs ---- */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dashboard Logs
            </TabsTrigger>
            <TabsTrigger value="application" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Application Logs
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder='Search'
                className="pl-10 w-[320px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 gap-2 text-sm", dateRange?.from && "text-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}` : format(dateRange.from, "MMM d, yyyy")
                  ) : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                {dateRange?.from && (
                  <div className="p-2 border-t flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Dashboard-specific filters */}
            {activeTab === "dashboard" && (
              <>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dynamicUsers.length > 0 && (
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Users className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {dynamicUsers.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            {/* Application-specific filters */}
            {activeTab === "application" && (
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LOG_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* ---- Dashboard Logs Tab ---- */}
        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard Activity</CardTitle>
              <CardDescription>
                User actions and system events (whitelist data masked) &mdash; 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleDashSort("user")}>
                          User <SortIcon field="user" currentField={dashSortField} currentOrder={dashSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleDashSort("role")}>
                          Role <SortIcon field="role" currentField={dashSortField} currentOrder={dashSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleDashSort("timestamp")}>
                          Timestamp <SortIcon field="timestamp" currentField={dashSortField} currentOrder={dashSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleDashSort("action")}>
                          Action <SortIcon field="action" currentField={dashSortField} currentOrder={dashSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleDashSort("target")}>
                          Target <SortIcon field="target" currentField={dashSortField} currentOrder={dashSortOrder} />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : dashLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No logs found.</TableCell>
                      </TableRow>
                    ) : (
                      dashLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:rounded-sm [&_mark]:px-0.5">
                            <HighlightedCell highlight={log.highlight} field="user" fallback={log.user} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{log.role}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getActionBadgeColor(log.action))}>{log.action}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:rounded-sm [&_mark]:px-0.5">
                            <HighlightedCell highlight={log.highlight} field="target" fallback={log.target} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {dashTotal > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(dashPage - 1) * PAGE_SIZE + 1} to {Math.min(dashPage * PAGE_SIZE, dashTotal)} of {dashTotal} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDashPage((p) => Math.max(1, p - 1))} disabled={dashPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {dashPage} of {totalDashPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setDashPage((p) => p + 1)} disabled={dashPage >= totalDashPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Application Logs Tab ---- */}
        <TabsContent value="application" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Logs</CardTitle>
              <CardDescription>
                Server and application event logs &mdash; 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleAppSort("timestamp")}>
                          Timestamp <SortIcon field="timestamp" currentField={appSortField} currentOrder={appSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[130px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleAppSort("server")}>
                          Server <SortIcon field="server" currentField={appSortField} currentOrder={appSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleAppSort("application")}>
                          Application <SortIcon field="application" currentField={appSortField} currentOrder={appSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleAppSort("level")}>
                          Level <SortIcon field="level" currentField={appSortField} currentOrder={appSortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : appLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No logs found.</TableCell>
                      </TableRow>
                    ) : (
                      appLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="font-mono text-sm">{log.server}</TableCell>
                          <TableCell className="font-medium">{log.application}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getLogLevelBadge(log.level))}>{log.level}</Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[400px] truncate [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:rounded-sm [&_mark]:px-0.5">
                            <HighlightedCell highlight={log.highlight} field="message" fallback={log.message} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {appTotal > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(appPage - 1) * PAGE_SIZE + 1} to {Math.min(appPage * PAGE_SIZE, appTotal)} of {appTotal} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAppPage((p) => Math.max(1, p - 1))} disabled={appPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {appPage} of {totalAppPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setAppPage((p) => p + 1)} disabled={appPage >= totalAppPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

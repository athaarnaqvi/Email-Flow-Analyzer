"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Activity,
  Filter,
  Search,
} from "lucide-react";

interface DashboardLog {
  id: string;
  user: string;
  role: string;
  timestamp: string;
  action: string;
  target: string;
}

interface ApplicationLog {
  id: string;
  timestamp: string;
  server: string;
  application: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRIT";
  message: string;
}

// Mock dashboard logs
const mockDashboardLogs: DashboardLog[] = [
  {
    id: "1",
    user: "admin",
    role: "Administrator",
    timestamp: "2024-01-15 14:32:00",
    action: "LOGIN",
    target: "System",
  },
  {
    id: "2",
    user: "wlviewer",
    role: "WL+Viewer",
    timestamp: "2024-01-15 14:30:00",
    action: "WHITELIST_ADD",
    target: "****@****.com",
  },
  {
    id: "3",
    user: "admin",
    role: "Administrator",
    timestamp: "2024-01-15 14:28:00",
    action: "USER_CREATE",
    target: "newuser",
  },
  {
    id: "4",
    user: "viewer",
    role: "Viewer",
    timestamp: "2024-01-15 14:25:00",
    action: "EMAIL_SEARCH",
    target: "domain:example.com",
  },
  {
    id: "5",
    user: "wlviewer",
    role: "WL+Viewer",
    timestamp: "2024-01-15 14:20:00",
    action: "WHITELIST_DELETE",
    target: "+***********",
  },
  {
    id: "6",
    user: "admin",
    role: "Administrator",
    timestamp: "2024-01-15 14:15:00",
    action: "RETENTION_UPDATE",
    target: "30 days",
  },
  {
    id: "7",
    user: "viewer",
    role: "Viewer",
    timestamp: "2024-01-15 14:10:00",
    action: "EMAIL_DOWNLOAD",
    target: "msg-123456",
  },
  {
    id: "8",
    user: "admin",
    role: "Administrator",
    timestamp: "2024-01-15 14:05:00",
    action: "LOGOUT",
    target: "System",
  },
];

// Mock application logs
const mockApplicationLogs: ApplicationLog[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:32:15",
    server: "app-server-01",
    application: "email-parser",
    level: "INFO",
    message: "Successfully processed 150 emails in batch",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:31:45",
    server: "db-server-01",
    application: "opensearch",
    level: "WARN",
    message: "High memory usage detected: 85% utilized",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:31:00",
    server: "app-server-02",
    application: "radius-collector",
    level: "ERROR",
    message: "Connection timeout to RADIUS server 10.0.0.50",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:30:30",
    server: "app-server-01",
    application: "cgnat-mapper",
    level: "INFO",
    message: "CGNAT mapping table updated with 5,000 entries",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:30:00",
    server: "web-server-01",
    application: "dashboard-api",
    level: "DEBUG",
    message: "API request: GET /api/statistics - 200 OK (45ms)",
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:29:30",
    server: "db-server-02",
    application: "opensearch",
    level: "INFO",
    message: "Index rotation completed for email-2024-01",
  },
  {
    id: "7",
    timestamp: "2024-01-15 14:29:00",
    server: "app-server-01",
    application: "email-parser",
    level: "WARN",
    message: "Malformed email header detected, skipping entry",
  },
  {
    id: "8",
    timestamp: "2024-01-15 14:28:30",
    server: "app-server-02",
    application: "radius-collector",
    level: "INFO",
    message: "RADIUS session established with 10.0.0.51",
  },
];

function getLogLevelBadge(level: ApplicationLog["level"]) {
  const styles = {
    INFO: "bg-chart-2/20 text-chart-2",
    WARN: "bg-warning/20 text-warning-foreground",
    ERROR: "bg-destructive/20 text-destructive",
    DEBUG: "bg-muted text-muted-foreground",
    CRIT: "bg-destructive/30 text-destructive",
  };
  return styles[level];
}

function getActionBadgeColor(action: string) {
  if (action.includes("LOGIN") || action.includes("LOGOUT")) {
    return "bg-chart-1/20 text-chart-1";
  }
  if (action.includes("WHITELIST")) {
    return "bg-warning/20 text-warning-foreground";
  }
  if (action.includes("DELETE") || action.includes("ERROR")) {
    return "bg-destructive/20 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

type SortDirection = "asc" | "desc";
type DashboardSortKey = keyof DashboardLog;
type AppSortKey = Exclude<keyof ApplicationLog, "message">;

function toLocalTimestamp(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function getSortableTimestamp(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function sortByKey<T>(
  items: T[],
  key: keyof T,
  direction: SortDirection,
  numeric = false
) {
  const sorted = [...items].sort((a, b) => {
    const av = a[key] as unknown as string | number;
    const bv = b[key] as unknown as string | number;
    if (numeric) {
      return (Number(av) - Number(bv)) * (direction === "asc" ? 1 : -1);
    }
    return String(av).localeCompare(String(bv)) * (direction === "asc" ? 1 : -1);
  });
  return sorted;
}

function toggleSort<T extends string>(
  current: { key: T; direction: SortDirection },
  nextKey: T
): { key: T; direction: SortDirection } {
  if (current.key === nextKey) {
    return {
      key: nextKey,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }
  return { key: nextKey, direction: "asc" };
}

type UserRole = "admin" | "viewer" | "wl_viewer" | null;

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  const [dashboardSort, setDashboardSort] = useState<{
    key: DashboardSortKey;
    direction: SortDirection;
  }>({ key: "timestamp", direction: "desc" });

  const [appSort, setAppSort] = useState<{
    key: AppSortKey;
    direction: SortDirection;
  }>({ key: "timestamp", direction: "desc" });

  const [dashboardFilters, setDashboardFilters] = useState<
    Record<DashboardSortKey, string>
  >({
    id: "",
    user: "",
    role: "",
    timestamp: "",
    action: "",
    target: "",
  });

  const [appFilters, setAppFilters] = useState<Record<AppSortKey, string>>({
    id: "",
    timestamp: "",
    server: "",
    application: "",
    level: "",
  });

  const [levelFilter, setLevelFilter] = useState("all");

  const filteredDashboardLogs = mockDashboardLogs.filter((log) =>
    (Object.keys(dashboardFilters) as DashboardSortKey[]).every((key) => {
      const val = dashboardFilters[key].trim().toLowerCase();
      if (!val) return true;
      return String(log[key]).toLowerCase().includes(val);
    })
  );

  const filteredApplicationLogs = mockApplicationLogs.filter((log) =>
    (Object.keys(appFilters) as AppSortKey[]).every((key) => {
      const val = appFilters[key].trim().toLowerCase();
      if (!val) return true;
      return String(log[key]).toLowerCase().includes(val);
    })
  ).filter((log) => (levelFilter === "all" ? true : log.level === levelFilter));

  const sortedDashboardLogs =
    dashboardSort.key === "timestamp"
      ? sortByKey(
          filteredDashboardLogs.map((l) => ({
            ...l,
            __ts: getSortableTimestamp(l.timestamp),
          })),
          "__ts" as keyof (DashboardLog & { __ts: number }),
          dashboardSort.direction,
          true
        ).map(({ __ts, ...rest }) => rest)
      : sortByKey(filteredDashboardLogs, dashboardSort.key, dashboardSort.direction);

  const sortedApplicationLogs =
    appSort.key === "timestamp"
      ? sortByKey(
          filteredApplicationLogs.map((l) => ({
            ...l,
            __ts: getSortableTimestamp(l.timestamp),
          })),
          "__ts" as keyof (ApplicationLog & { __ts: number }),
          appSort.direction,
          true
        ).map(({ __ts, ...rest }) => rest)
      : sortByKey(filteredApplicationLogs, appSort.key, appSort.direction);

  const paginatedDashboardLogs = sortedDashboardLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedApplicationLogs = sortedApplicationLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalDashboardPages = Math.ceil(filteredDashboardLogs.length / itemsPerPage);
  const totalApplicationPages = Math.ceil(filteredApplicationLogs.length / itemsPerPage);



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          View system activity and application logs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }}>
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-10 w-[250px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {activeTab === "application" && (
              <Select
                value={levelFilter}
                onValueChange={(v) => {
                  setLevelFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard Activity</CardTitle>
              <CardDescription>
                User actions and system events (whitelist data masked)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setDashboardSort((s) => toggleSort(s, "user"))
                          }
                        >
                          User
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setDashboardSort((s) => toggleSort(s, "role"))
                          }
                        >
                          Role
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setDashboardSort((s) => toggleSort(s, "timestamp"))
                          }
                        >
                          Timestamp
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setDashboardSort((s) => toggleSort(s, "action"))
                          }
                        >
                          Action
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setDashboardSort((s) => toggleSort(s, "target"))
                          }
                        >
                          Target
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead>
                        <Input
                          value={dashboardFilters.user}
                          onChange={(e) => {
                            setDashboardFilters((f) => ({ ...f, user: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={dashboardFilters.role}
                          onChange={(e) => {
                            setDashboardFilters((f) => ({ ...f, role: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={dashboardFilters.timestamp}
                          onChange={(e) => {
                            setDashboardFilters((f) => ({
                              ...f,
                              timestamp: e.target.value,
                            }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={dashboardFilters.action}
                          onChange={(e) => {
                            setDashboardFilters((f) => ({ ...f, action: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={dashboardFilters.target}
                          onChange={(e) => {
                            setDashboardFilters((f) => ({ ...f, target: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDashboardLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDashboardLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.user}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {log.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {toLocalTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs",
                                getActionBadgeColor(log.action)
                              )}
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.target}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredDashboardLogs.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredDashboardLogs.length)} of{" "}
                    {filteredDashboardLogs.length} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalDashboardPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalDashboardPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Logs</CardTitle>
              <CardDescription>
                Server and application event logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setAppSort((s) => toggleSort(s, "timestamp"))
                          }
                        >
                          Timestamp
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[130px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setAppSort((s) => toggleSort(s, "server"))
                          }
                        >
                          Server
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setAppSort((s) => toggleSort(s, "application"))
                          }
                        >
                          Application
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 -ml-3"
                          onClick={() =>
                            setAppSort((s) => toggleSort(s, "level"))
                          }
                        >
                          Level
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead>
                        <Input
                          value={appFilters.timestamp}
                          onChange={(e) => {
                            setAppFilters((f) => ({ ...f, timestamp: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={appFilters.server}
                          onChange={(e) => {
                            setAppFilters((f) => ({ ...f, server: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={appFilters.application}
                          onChange={(e) => {
                            setAppFilters((f) => ({
                              ...f,
                              application: e.target.value,
                            }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          value={appFilters.level}
                          onChange={(e) => {
                            setAppFilters((f) => ({ ...f, level: e.target.value }));
                            setCurrentPage(1);
                          }}
                          placeholder="Filter..."
                        />
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplicationLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedApplicationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {toLocalTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.server}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.application}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn("text-xs", getLogLevelBadge(log.level))}
                            >
                              {log.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[400px] truncate">
                            {log.message}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredApplicationLogs.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredApplicationLogs.length)} of{" "}
                    {filteredApplicationLogs.length} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalApplicationPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalApplicationPages}
                    >
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

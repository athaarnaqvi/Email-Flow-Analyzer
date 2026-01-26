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
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Activity,
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
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
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

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredDashboardLogs = mockDashboardLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApplicationLogs = mockApplicationLogs.filter(
    (log) =>
      (levelFilter === "all" || log.level === levelFilter) &&
      (log.server.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedDashboardLogs = filteredDashboardLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedApplicationLogs = filteredApplicationLogs.slice(
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
                      <TableHead className="w-[120px]">User</TableHead>
                      <TableHead className="w-[120px]">Role</TableHead>
                      <TableHead className="w-[180px]">
                        <Button variant="ghost" size="sm" className="h-8 -ml-3">
                          Timestamp
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[150px]">Action</TableHead>
                      <TableHead>Target</TableHead>
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
                            {log.timestamp}
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
                        <Button variant="ghost" size="sm" className="h-8 -ml-3">
                          Timestamp
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[130px]">Server</TableHead>
                      <TableHead className="w-[150px]">Application</TableHead>
                      <TableHead className="w-[80px]">Level</TableHead>
                      <TableHead>Message</TableHead>
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
                            {log.timestamp}
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

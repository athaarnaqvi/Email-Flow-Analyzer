"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EncryptionChart } from "@/components/dashboard/charts/encryption-chart";
import { CgnatChart } from "@/components/dashboard/charts/cgnat-chart";
import { RadiusCorrelationChart } from "@/components/dashboard/charts/radius-correlation-chart";
import { ProtocolChart } from "@/components/dashboard/charts/protocol-chart";
import { TrafficChart } from "@/components/dashboard/charts/traffic-chart";
import { ServerHealthCard } from "@/components/dashboard/server-health-card";

const servers = [
  { name: "Server 01", cpu: 45, ram: 62, disk: 38 },
  { name: "Server 02", cpu: 72, ram: 55, disk: 45 },
  { name: "Server 03", cpu: 28, ram: 41, disk: 52 },
  { name: "Server 04", cpu: 89, ram: 78, disk: 61 },
  { name: "Server 05", cpu: 34, ram: 49, disk: 33 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const protocolData = stats?.protocols?.map((b: any) => ({ name: b.key, value: b.doc_count })) || [];
  const boolToLabel = (key: any, yes: string, no: string) => (key === true || key === "true" ? yes : no);
  const encryptionData = stats?.encryption?.map((b: any) => ({ name: boolToLabel(b.key, "Encrypted", "Unencrypted"), value: b.doc_count })) || [];
  const cgnatData = stats?.cgnat?.map((b: any) => ({ name: boolToLabel(b.key, "Matched", "Unmatched"), value: b.doc_count })) || [];
  const radiusData = stats?.radius?.map((b: any) => ({ name: boolToLabel(b.key, "Session Found", "No Session"), value: b.doc_count })) || [];
  const monthlyTrafficData = stats?.trafficMonthly?.map((b: any) => {
    const d = new Date(b.key);
    return {
      time: d.toLocaleDateString([], { month: "short", year: "numeric" }),
      value: b.doc_count,
    };
  }) || [];

  const dailyTrafficData = stats?.trafficDaily?.map((b: any) => {
    const d = new Date(b.key);
    return {
      time: d.toLocaleDateString([], { day: "numeric", month: "short" }),
      value: b.doc_count,
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Statistics Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Pie Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EncryptionChart data={encryptionData} />
        <CgnatChart data={cgnatData} />
        <RadiusCorrelationChart data={radiusData} />
        <ProtocolChart data={protocolData} />
      </div>

      {/* Line Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrafficChart
          title="Total Traffic"
          description="Monthly email volume over the last 5 years"
          data={monthlyTrafficData}
          unit="Emails"
          color="#6366f1"
          chartId="total"
        />
        <TrafficChart
          title="Data RX Traffic"
          description="Daily email volume over the last 30 days"
          data={dailyTrafficData}
          unit="Emails"
          color="#22c55e"
          chartId="rx"
        />
      </div>

      {/* Server Health Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Server Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {servers.map((server) => (
              <ServerHealthCard key={server.name} {...server} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

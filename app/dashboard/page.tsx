"use client";

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
        <EncryptionChart />
        <CgnatChart />
        <RadiusCorrelationChart />
        <ProtocolChart />
      </div>

      {/* Line Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrafficChart
          title="RADIUS RX Traffic"
          description="Last 24 hours (Gbps)"
          dataKey="radius"
          unit="Gbps"
        />
        <TrafficChart
          title="Data RX Traffic"
          description="Last 24 hours (Mbps)"
          dataKey="data"
          unit="Mbps"
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

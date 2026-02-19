"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Generate mock traffic data for 24 hours
const generateTrafficData = (type: "radius" | "data") => {
  const baseValue = type === "radius" ? 2.5 : 450;
  const variance = type === "radius" ? 1.5 : 200;

  return Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return {
      time: hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance * 2),
    };
  });
};

interface TrafficChartProps {
  title: string;
  description: string;
  data: { time: string; value: number }[];
  unit: string;
  color?: string;
}

const CustomTooltip = ({ active, payload, label, unit, title }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg border border-border bg-popover p-3 shadow-md"
        style={{
          backgroundColor: "hsl(var(--popover))",
          borderColor: "hsl(var(--border))",
          color: "hsl(var(--popover-foreground))",
        }}
      >
        <p className="font-semibold">{payload[0].payload?.time || label}</p>
        <p className="text-sm">
          {title}: {payload[0].value ? payload[0].value.toFixed(0) : 0} {unit}
        </p>
      </div>
    );
  }
  return null;
};

export function TrafficChart({ title, description, data = [], unit, color = "#6366f1" }: TrafficChartProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <defs>
                <linearGradient id="gradient-traffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `${value.toFixed(0)}`}
              />
              <Tooltip
                content={<CustomTooltip unit={unit} title={title} />}
                cursor={{ strokeDasharray: "3 3" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#gradient-traffic)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useId } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TrafficChartProps {
  title: string;
  description: string;
  data: { time: string; value: number }[];
  unit: string;
  color?: string;
  chartId?: string;
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

const CustomTooltip = ({ active, payload, label, unit, title }: any) => {
  if (active && payload?.length) {
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
          {title}: {Number(payload[0].value).toLocaleString()} {unit}
        </p>
      </div>
    );
  }
  return null;
};

export function TrafficChart({
  title,
  description,
  data = [],
  unit,
  color = "#6366f1",
  chartId,
}: TrafficChartProps) {
  const fallbackId = useId();
  const gradientId = `gradient-${chartId || fallbackId.replace(/:/g, "")}`;

  const tickInterval = data.length <= 12
    ? 0
    : Math.max(1, Math.floor(data.length / 8));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
                interval={tickInterval}
                angle={-35}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={formatYAxis}
                width={48}
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
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

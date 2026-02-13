"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "Encrypted", value: 68 },
  { name: "Unencrypted", value: 32 },
];

const COLORS = ["#6366f1", "#94a3b8"];

interface EncryptionChartProps {
  data?: { name: string; value: number }[];
}

export function EncryptionChart({ data = [] }: EncryptionChartProps) {
  return (
    <Card>
        <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Email Encryption</CardTitle>
        <CardDescription>All Data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {(() => {
                const visibleData = data.filter((d) => Number(d.value) > 0);
                const useData = visibleData.length ? visibleData : data;
                return (
                  <Pie
                    data={useData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
               </Pie>
                );
              })()}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: any) => {
                  const visibleData = data.filter((d) => Number(d.value) > 0);
                  const total = visibleData.length ? visibleData.reduce((s, d) => s + (Number(d.value) || 0), 0) : data.reduce((s, d) => s + (Number(d.value) || 0), 0);
                  const pct = total > 0 ? ((Number(value) || 0) / total) * 100 : 0;
                  return [`${pct.toFixed(1)}%`, ""];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

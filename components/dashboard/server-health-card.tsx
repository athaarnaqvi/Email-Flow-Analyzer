"use client";

import { cn } from "@/lib/utils";
import { Cpu, MemoryStick, HardDrive, Server } from "lucide-react";

interface ServerHealthCardProps {
  name: string;
  cpu: number;
  ram: number;
  disk: number;
}

function getStatusColor(value: number): string {
  if (value >= 80) return "text-destructive";
  if (value >= 60) return "text-warning";
  return "text-success";
}

function getProgressColor(value: number): string {
  if (value >= 80) return "bg-destructive";
  if (value >= 60) return "bg-warning";
  return "bg-success";
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", getStatusColor(value))}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary">
        <div
          className={cn("h-1.5 rounded-full transition-all", getProgressColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ServerHealthCard({ name, cpu, ram, disk }: ServerHealthCardProps) {
  const overallStatus = Math.max(cpu, ram, disk);
  const statusColor = overallStatus >= 80 ? "border-destructive/50" : overallStatus >= 60 ? "border-warning/50" : "border-border";

  return (
    <div className={cn("rounded-lg border p-4 bg-card", statusColor)}>
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{name}</span>
        <div
          className={cn(
            "ml-auto h-2 w-2 rounded-full",
            overallStatus >= 80 ? "bg-destructive" : overallStatus >= 60 ? "bg-warning" : "bg-success"
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1">
            <ProgressBar value={cpu} label="CPU" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MemoryStick className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1">
            <ProgressBar value={ram} label="RAM" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HardDrive className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1">
            <ProgressBar value={disk} label="Disk" />
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3, PieChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHART_POINTS = [40, 55, 45, 70, 60, 85, 78, 92, 88, 95, 90, 98];
const maxY = Math.max(...CHART_POINTS);
const minY = Math.min(...CHART_POINTS);
const normalize = (v: number) => 100 - ((v - minY) / (maxY - minY)) * 75 - 12;
const chartPath = CHART_POINTS
  .map((v, i) => `${(i / (CHART_POINTS.length - 1)) * 500},${normalize(v)}`)
  .join(" L ");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATS = [
  { label: "Total Revenue", value: "Ksh 148,500", change: "+18%", up: true },
  { label: "Total Orders", value: "247", change: "+12%", up: true },
  { label: "Avg Order Value", value: "Ksh 601", change: "+3%", up: true },
  { label: "Cancellation Rate", value: "4.2%", change: "-1.1%", up: true },
];

export function TabReports() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black text-foreground">Reports</h2>
        <Button variant="outline" className="rounded-full border-border text-sm flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-background rounded-2xl border border-border p-4 sm:p-5"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-black text-foreground">{stat.value}</p>
            <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${stat.up ? "text-[#007606]" : "text-destructive"}`}>
              <TrendingUp className="w-3 h-3" />
              {stat.change} this month
            </p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-background rounded-2xl border border-border p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">Revenue Over Time</h3>
          </div>
          <select className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground">
            <option>This Year</option>
            <option>Last 6 months</option>
          </select>
        </div>
        <div style={{ height: "160px" }}>
          <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DD3131" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#DD3131" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M ${chartPath} L 500,100 L 0,100 Z`} fill="url(#revGrad)" />
            <polyline points={chartPath} fill="none" stroke="#DD3131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          {MONTHS.map((m) => <span key={m}>{m}</span>)}
        </div>
      </motion.div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background rounded-2xl border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-secondary-foreground" />
            <h3 className="text-sm font-black text-foreground">Orders by Meal Time</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Lunch", pct: 45, color: "#F4CD2E" },
              { label: "Dinner", pct: 38, color: "#DD3131" },
              { label: "Breakfast", pct: 17, color: "#007606" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-foreground">{row.label}</span>
                  <span className="text-muted-foreground">{row.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full rounded-full"
                    style={{ background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-background rounded-2xl border border-border p-5"
        >
          <h3 className="text-sm font-black text-foreground mb-4">Top Menu Items by Revenue</h3>
          <div className="space-y-2">
            {[
              { name: "Herb Roasted Salmon", revenue: 32040, orders: 36 },
              { name: "Grilled Chicken Nuggets", revenue: 19350, orders: 30 },
              { name: "Spaghetti Carbonara", revenue: 15750, orders: 21 },
              { name: "Vitality Veggie Bowl", revenue: 12480, orders: 24 },
            ].map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.orders} orders</p>
                </div>
                <span className="text-xs font-bold text-foreground flex-shrink-0">
                  Ksh {item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
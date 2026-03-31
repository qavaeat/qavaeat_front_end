
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays, Users, TrendingUp, Edit } from "lucide-react";
import { Star } from "lucide-react";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const STATS = [
  { label: "Today's Orders", value: "8", sub: "Delivered", icon: CheckCircle2, color: "#007606", iconBg: "#007606" },
  { label: "Upcoming Deliveries", value: "12", sub: "Scheduled", icon: CalendarDays, color: "#F4CD2E", iconBg: "#8E771B" },
  { label: "Active", value: "5", sub: "Meal Plans", icon: TrendingUp, color: "#DD3131", iconBg: "#DD3131" },
  { label: "Subscriptions", value: "47", sub: "Subscribers", icon: Users, color: "#DD3131", iconBg: "#DD3131" },
];

const TOP_ITEMS = [
  { name: "Grilled Chicken Nuggets", price: 645, orders: 5, tags: ["Lunch", "Dinner"] },
  { name: "Herb Roasted Salmon", price: 890, orders: 4, tags: ["Dinner"] },
  { name: "Vitality Veggie Bowl", price: 520, orders: 3, tags: ["Lunch"] },
  { name: "Spaghetti Carbonara", price: 750, orders: 3, tags: ["Lunch", "Dinner"] },
];

const MEAL_PLANS = [
  { name: "Performance Fuel", desc: "Low carb focus", price: 2700, meals: "10 meals/week", status: "Active" },
  { name: "Vitality Veggie", desc: "Vegetarian diet", price: 1600, meals: "5 meals/week", status: "Active" },
  { name: "Performance Fuel", desc: "Low carb focus", price: 2700, meals: "10 meals/week", status: "Active" },
];

const RECENT_ORDERS = [
  { name: "James Wafula", item: "Herb roasted salmon", date: "Today", time: "8:00 AM" },
  { name: "Alex Mwangi", item: "Fried chicken with fries", date: "Today", time: "11:15 AM" },
  { name: "Emma Oketch", item: "Grilled Mutton with corn", date: "Yesterday", time: "12:30 PM" },
  { name: "Eunice Wendo", item: "Spaghetti carbonara", date: "Yesterday", time: "8:30 PM" },
];

const UPCOMING = [
  { name: "Sarah Kim", item: "Herb roasted salmon", date: "Tomorrow", time: "1:00 PM" },
  { name: "Alex Mwangi", item: "Fried chicken with fries", date: "Tomorrow", time: "1:15 PM" },
  { name: "Emma Oketch", item: "Grilled Mutton with corn", date: "Tomorrow", time: "12:30 PM" },
  { name: "Eunice Wendo", item: "Spaghetti carbonara", date: "Tomorrow", time: "1:30 PM" },
];

const CHART_POINTS = [20, 35, 28, 55, 42, 70, 65, 80, 75, 90, 85, 93];

interface Props {
  chefName: string;
}

export function TabDashboard({ chefName }: Props) {
  const maxY = Math.max(...CHART_POINTS);
  const minY = Math.min(...CHART_POINTS);
  const normalize = (v: number) => 100 - ((v - minY) / (maxY - minY)) * 80 - 10;
  const chartPath = CHART_POINTS
    .map((v, i) => `${(i / (CHART_POINTS.length - 1)) * 280},${normalize(v)}`)
    .join(" L ");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.h2
        {...fadeUp(0)}
        className="text-xl sm:text-2xl font-black text-foreground"
      >
        Welcome back, Chef {chefName}!
      </motion.h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              {...fadeUp(i * 0.07)}
              className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-2"
            >
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.iconBg}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.iconBg }} />
                </div>
                <span
                  className="text-2xl sm:text-3xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Top Performing Menu Items */}
        <motion.div
          {...fadeUp(0.2)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <h3 className="text-sm font-black text-foreground">Top Performing Menu Items</h3>
          <div className="flex flex-col gap-2">
            {TOP_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-secondary/20 flex items-center justify-center text-xs">🍗</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.orders} Orders</p>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {item.tags.map((t) => (
                      <span key={t} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-foreground">Ksh {item.price}</span>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Meal Plans */}
        <motion.div
          {...fadeUp(0.25)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <h3 className="text-sm font-black text-foreground">Active Meal Plans</h3>
          <div className="flex flex-col gap-3">
            {MEAL_PLANS.map((plan, i) => (
              <div key={i} className="flex items-start justify-between gap-2 pb-3 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{plan.name}</p>
                  <p className="text-[10px] text-muted-foreground">{plan.desc}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">📅 {plan.meals}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-bold text-foreground">Ksh {plan.price.toLocaleString()}</span>
                  <span className="text-[9px] bg-[#007606]/10 text-[#007606] font-bold px-2 py-0.5 rounded-full">{plan.status}</span>
                  <button className="text-muted-foreground hover:text-primary transition-colors mt-1">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Deliveries */}
        <motion.div
          {...fadeUp(0.3)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground">Upcoming Deliveries</h3>
            <button className="text-xs text-primary font-semibold hover:underline">See All &gt;</button>
          </div>
          <div className="flex flex-col gap-2">
            {UPCOMING.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{o.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{o.item}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold text-foreground">{o.date}</p>
                  <p className="text-[10px] text-muted-foreground">{o.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Recent Feedback */}
        <motion.div
          {...fadeUp(0.35)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <h3 className="text-sm font-black text-foreground">Recent Feedback Review</h3>
          <div className="flex flex-col items-center justify-center flex-1 py-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-foreground">4.7</span>
              <Star className="w-8 h-8 text-secondary fill-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Average Reviews</p>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          {...fadeUp(0.4)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <h3 className="text-sm font-black text-foreground">Recent Orders</h3>
          <div className="flex flex-col gap-2">
            {RECENT_ORDERS.map((o, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {o.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{o.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{o.item}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold text-foreground">{o.date}</p>
                  <p className="text-[10px] text-muted-foreground">{o.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account Performance */}
        <motion.div
          {...fadeUp(0.45)}
          className="bg-background rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3"
        >
          <h3 className="text-sm font-black text-foreground">Account Performance</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-foreground">93%</p>
              <p className="text-xs text-muted-foreground">Order completion rate</p>
            </div>
            <div className="flex items-center gap-1 text-[#007606] text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              +2.5%
            </div>
          </div>
          {/* Mini line chart */}
          <div className="w-full" style={{ height: "80px" }}>
            <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007606" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#007606" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M ${chartPath} L 280,100 L 0,100 Z`}
                fill="url(#chartGrad)"
              />
              <polyline
                points={chartPath}
                fill="none"
                stroke="#007606"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
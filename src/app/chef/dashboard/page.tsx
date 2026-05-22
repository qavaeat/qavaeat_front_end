"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardNav }    from "@/components/chef-dashboard/DashboardNav";
import { TabDashboard }    from "@/components/chef-dashboard/TabDashboard";
import { TabOrders }       from "@/components/chef-dashboard/TabOrders";
import { TabCustomers }    from "@/components/chef-dashboard/TabCustomers";
import { TabMenus }        from "@/components/chef-dashboard/TabMenus";
import { TabReports }      from "@/components/chef-dashboard/TabReports";
import { TabSettings }     from "@/components/chef-dashboard/TabSettings";
import { ProfileProvider } from "@/components/chef-dashboard/ProfileContext";
import type { DashboardTab } from "@/components/chef-dashboard/types";

const slide = {
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};

export default function ChefDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  return (
    <ProfileProvider>
      <div className="min-h-screen bg-muted/20">
        <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <motion.div key="dashboard" {...slide}><TabDashboard /></motion.div>}
            {activeTab === "orders"    && <motion.div key="orders"    {...slide}><TabOrders /></motion.div>}
            {activeTab === "customers" && <motion.div key="customers" {...slide}><TabCustomers /></motion.div>}
            {activeTab === "menus"     && <motion.div key="menus"     {...slide}><TabMenus /></motion.div>}
            {activeTab === "reports"   && <motion.div key="reports"   {...slide}><TabReports /></motion.div>}
            {activeTab === "settings"  && <motion.div key="settings"  {...slide}><TabSettings /></motion.div>}
          </AnimatePresence>
        </main>
      </div>
    </ProfileProvider>
  );
}
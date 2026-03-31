
"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/chef-dashboard/DashboardNav";
import { TabDashboard } from "@/components/chef-dashboard/TabDashboard";
import { TabOrders } from "@/components/chef-dashboard/TabOrders";
import { TabCustomers } from "@/components/chef-dashboard/TabCustomers";
import { TabMenus } from "@/components/chef-dashboard/TabMenus";
import { TabReports } from "@/components/chef-dashboard/TabReports";
import type { DashboardTab } from "@/components/chef-dashboard/types";
import { motion, AnimatePresence } from "framer-motion";

// ── In production replace with real auth/user data ──────
const CHEF = {
  name: "Miriam",
  avatarUrl: null, // replace with actual avatar URL
};

export default function ChefDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chefName={`Chef ${CHEF.name}`}
        chefAvatarUrl={CHEF.avatarUrl}
      />

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <TabDashboard chefName={CHEF.name} />
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <TabOrders />
            </motion.div>
          )}

          {activeTab === "customers" && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <TabCustomers />
            </motion.div>
          )}

          {activeTab === "menus" && (
            <motion.div
              key="menus"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <TabMenus />
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <TabReports />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

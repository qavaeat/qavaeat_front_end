"use client";

import { useLastRoute } from "@/hooks/useLastRoute";

export function RouteTracker() {
  useLastRoute();
  return null; // renders nothing — pure side-effect
}
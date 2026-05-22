"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserCoords {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const LOCATION_KEY = "qavaeat_user_location";
const LOCATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

function loadStored(): UserCoords | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed: UserCoords = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > LOCATION_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeCoords(coords: UserCoords) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATION_KEY, JSON.stringify(coords));
}

export function useLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(() => loadStored());
  const [status, setStatus] = useState<LocationStatus>(() =>
    loadStored() ? "granted" : "idle"
  );

  const request = useCallback(async (): Promise<UserCoords | null> => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return null;
    }
    setStatus("requesting");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: UserCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: Date.now(),
          };
          storeCoords(c);
          setCoords(c);
          setStatus("granted");

          // Sync to backend profile silently
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: c.latitude,
              longitude: c.longitude,
            }),
          }).catch(() => {/* silent */});

          resolve(c);
        },
        () => {
          setStatus("denied");
          resolve(null);
        },
        { timeout: 10000, maximumAge: LOCATION_TTL_MS },
      );
    });
  }, []);

  const clear = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(LOCATION_KEY);
    setCoords(null);
    setStatus("idle");
  }, []);

  return { coords, status, request, clear };
}
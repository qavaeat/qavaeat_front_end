"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ChefUser } from "./types";

interface ProfileContextValue {
  user: ChefUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateOptimistic: (patch: Partial<ChefUser["profile"] & Pick<ChefUser, "email">>) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  updateOptimistic: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ChefUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      // backend returns { success, data: { user } } or { success, data: profile }
      const data = json?.data;
      if (data) setUser(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOptimistic = useCallback(
    (patch: Partial<NonNullable<ChefUser["profile"]> & Pick<ChefUser, "email">>) => {
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: prev.profile ? { ...prev.profile, ...patch } : prev.profile,
        };
      });
    },
    [],
  );

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ProfileContext.Provider value={{ user, loading, refresh, updateOptimistic }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
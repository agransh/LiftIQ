"use client";

import { useEffect } from "react";
import "@/lib/pose/mediapipe-console-filter";
import { createClient } from "@/utils/supabase/client";
import { ensureStorageOwner } from "@/lib/storage";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) ensureStorageOwner(data.user.id);
      });
  }, []);

  return <>{children}</>;
}

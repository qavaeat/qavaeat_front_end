
"use client";

import { useEffect } from "react";
import { installFetchInterceptor } from "@/lib/fetch-interceptor";

export function FetchInterceptor() {
  useEffect(() => {
    installFetchInterceptor();
  }, []);

  return null;
}
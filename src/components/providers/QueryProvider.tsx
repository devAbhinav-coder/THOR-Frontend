"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setQueryClient } from "@/lib/queryClient";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
  { ssr: false },
);

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 10 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: process.env.NODE_ENV === "production",
        },
      },
    });
    // Register singleton so Zustand stores can access the cache outside React components
    setQueryClient(qc);
    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}

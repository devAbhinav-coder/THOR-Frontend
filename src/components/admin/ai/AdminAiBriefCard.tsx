"use client";

import { useCallback, useEffect, useState } from "react";
import { adminAiApi } from "@/lib/adminAiApi";
import { AdminAiBulletList, AdminAiCard } from "./AdminAiCard";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";
import type { AdminAiTextResult } from "./types";

export function AdminAiBriefCard() {
  const { status, loading: statusLoading } = useAdminAiStatus();
  const [data, setData] = useState<AdminAiTextResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!status?.enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminAiApi.getDailyBrief(force);
      setData(res.data as AdminAiTextResult);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [status?.enabled]);

  useEffect(() => {
    if (!statusLoading && status?.enabled) load(false);
  }, [statusLoading, status?.enabled, load]);

  if (statusLoading || !status?.enabled) return null;

  return (
    <AdminAiCard
      title="Daily business brief"
      subtitle="Revenue, inventory, and priorities from your store data"
      loading={loading && !data}
      error={error}
      cached={data?.cached}
      onRefresh={() => load(true)}
    >
      {data && (
        <AdminAiBulletList bullets={data.bullets} text={data.text} intro={data.intro} />
      )}
    </AdminAiCard>
  );
}

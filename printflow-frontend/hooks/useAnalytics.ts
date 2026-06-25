import { useCallback, useEffect, useState } from "react";
import { getAdminDashboard, getStudentHistory } from "../services/analyticsService";

export function useAnalytics(role?: string, autoLoad = true) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response =
        role === "admin" || role === "operator"
          ? await getAdminDashboard()
          : await getStudentHistory();
      setData(response?.data || null);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  return { data, loading, error, refresh };
}

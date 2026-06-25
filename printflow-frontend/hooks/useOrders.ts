import { useCallback, useEffect, useState } from "react";
import { getOrders } from "../services/orderService";

export function useOrders(autoLoad = true) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrders();
      setOrders(response?.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  return { orders, loading, error, refresh, setOrders };
}

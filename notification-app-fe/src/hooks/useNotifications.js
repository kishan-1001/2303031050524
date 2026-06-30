import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../lib/logger";

const LIMIT = 8;

export function useNotifications(filter) {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (currentPage, currentFilter) => {
    setLoading(true);
    setError(null);
    Log("frontend", "info", "hook", `useNotifications load page=${currentPage} filter=${currentFilter ?? "all"}`);

    try {
      const data = await fetchNotifications({
        page: currentPage,
        limit: LIMIT,
        notificationType: currentFilter,
      });
      setNotifications(data);
      setHasNextPage(data.length === LIMIT);
    } catch (err) {
      setError(err.message);
      Log("frontend", "error", "hook", `useNotifications error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(1, filter);
  }, [filter, load]);

  const goToPage = useCallback((newPage) => {
    setPage(newPage);
    load(newPage, filter);
  }, [filter, load]);

  return { notifications, page, hasNextPage, loading, error, goToPage };
}

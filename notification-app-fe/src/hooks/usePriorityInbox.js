import { useState, useEffect } from "react";
import { fetchAllNotifications } from "../api/notifications";
import { getTopN } from "../lib/heap";
import { Log } from "../lib/logger";

export function usePriorityInbox(topN) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [prioritized, setPrioritized] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      Log("frontend", "info", "hook", "usePriorityInbox fetching all notifications");

      try {
        const data = await fetchAllNotifications();
        setAllNotifications(data);
        Log("frontend", "info", "hook", `usePriorityInbox received ${data.length} notifications`);
      } catch (err) {
        setError(err.message);
        Log("frontend", "error", "hook", `usePriorityInbox error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (allNotifications.length > 0) {
      const top = getTopN(allNotifications, topN);
      setPrioritized(top);
    }
  }, [allNotifications, topN]);

  return { prioritized, loading, error };
}

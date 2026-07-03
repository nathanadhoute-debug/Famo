"use client";
import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

type RealtimeHandlers = {
  onDoseChange?:    (p: RealtimePayload) => void;
  onVisitChange?:   (p: RealtimePayload) => void;
  onJournalChange?: (p: RealtimePayload) => void;
  onVitalChange?:   (p: RealtimePayload) => void;
};

export function useRealtimeFamily(familyId: string, handlers: RealtimeHandlers) {
  const supabase = createClient();

  const subscribe = useCallback(() => {
    if (!familyId) return () => {};

    const channel = supabase
      .channel(`family:${familyId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"doses",
        filter:`family_id=eq.${familyId}` },
        (p) => handlers.onDoseChange?.(p as RealtimePayload))
      .on("postgres_changes", { event:"*", schema:"public", table:"visits",
        filter:`family_id=eq.${familyId}` },
        (p) => handlers.onVisitChange?.(p as RealtimePayload))
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"journal_entries",
        filter:`family_id=eq.${familyId}` },
        (p) => handlers.onJournalChange?.(p as RealtimePayload))
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"vitals",
        filter:`family_id=eq.${familyId}` },
        (p) => handlers.onVitalChange?.(p as RealtimePayload))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId]);

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);
}

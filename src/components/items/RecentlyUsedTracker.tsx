"use client";

import { useEffect, useRef } from "react";
import { pushRecentItem } from "@/lib/recently-used";

interface Props {
  itemId: string;
}

export function RecentlyUsedTracker({ itemId }: Props) {
  const idRef = useRef(itemId);
  useEffect(() => {
    pushRecentItem(idRef.current);
  }, []);

  return null;
}

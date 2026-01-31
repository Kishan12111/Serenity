"use client";

import { useState, useEffect } from "react";

const VISITOR_ID_KEY = "serenity_visitor_id";

// Generate a unique visitor ID
function generateVisitorId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `visitor_${timestamp}_${randomPart}`;
}

export function useVisitorId(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a visitor ID
    let id = localStorage.getItem(VISITOR_ID_KEY);

    if (!id) {
      // Generate a new one
      id = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    setVisitorId(id);
  }, []);

  return visitorId;
}

// For when you add Clerk auth later, you can use this to migrate
export function migrateVisitorToUser(clerkUserId: string): void {
  const visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (visitorId) {
    // Store the mapping for migration
    localStorage.setItem("serenity_migrated_from", visitorId);
    localStorage.setItem(VISITOR_ID_KEY, clerkUserId);
  }
}

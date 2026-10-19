"use client";

import { track } from "@vercel/analytics/react";

const EVENT_NAMES = new Set([
  "quiz_start",
  "quiz_complete",
  "newsletter_signup_start",
  "newsletter_signup_success",
  "affiliate_click",
  "internal_search",
  "related_article_click",
  "outbound_official_source_click",
]);

export function trackSiteEvent(name, properties = {}) {
  if (!EVENT_NAMES.has(name)) return;
  track(name, properties);
}

"use client";

import { useEffect } from "react";
import config from "../site.config";

export default function AdSense({
  slot,
  format = "auto",
  style = {},
  layout = null,
  layoutKey = null,
  className = "",
}) {
  const isConfigured = Boolean(
    config.adsense.enabled &&
    slot &&
    config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX"
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !isConfigured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [isConfigured]);

  if (process.env.NODE_ENV !== "production" || !isConfigured) return null;

  return (
    <div className={`adsense-wrapper ${className}`.trim()} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={config.adsense.publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      />
    </div>
  );
}

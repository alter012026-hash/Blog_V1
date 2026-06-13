import { useEffect } from "react";
import config from "../../site.config";

export default function AdSense({ slot, format = "auto", style = {} }) {
  // Só renderiza se AdSense estiver configurado e ativado
  if (!config.adsense.enabled) return null;
  if (config.adsense.publisherId === "ca-pub-XXXXXXXXXXXXXXXX") return null;

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div className="adsense-wrapper" style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={config.adsense.publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

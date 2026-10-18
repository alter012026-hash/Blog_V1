import Link from "next/link";
import config from "../site.config";

/**
 * Marca: uma bolinha de cartão-resposta já marcada (anel + miolo
 * amarelo + visto). "Passeja" = "passe já" — a bolinha preenchida é a
 * resposta certa, o gesto de quem está avançando.
 */
export function LogoMark({ className = "logo-mark" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <rect className="lm-bg" width="40" height="40" rx="12" />
      <circle className="lm-ring" cx="20" cy="20" r="13" strokeWidth="2.5" strokeOpacity="0.55" />
      <circle className="lm-fill" cx="20" cy="20" r="8.5" />
      <path className="lm-tick" d="M15.6 20.4 L18.9 23.7 L24.8 16.6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ onClick, label = true }) {
  const [first, ...rest] = config.name.split(" ");
  return (
    <Link href="/" className="logo" onClick={onClick} aria-label={config.name}>
      <LogoMark />
      {label && (
        <span className="logo-text">
          <span className="logo-name">{first}</span>
          <span className="logo-sub">{rest.join(" ").toLowerCase() || config.niche}</span>
        </span>
      )}
    </Link>
  );
}

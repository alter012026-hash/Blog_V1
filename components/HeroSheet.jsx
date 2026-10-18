import { getCoverMarks, COVER_VIEWBOX } from "../lib/cover";

const GROUPS = [17, 117, 217];
const rings = [];
for (const gx of GROUPS) for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) rings.push({ cx: gx + 7 + c * 18, cy: 22 + r * 26 });

/** Fundo do hero: grade de cartão-resposta; as bolhas amarelas se preenchem em sequência. */
export default function HeroSheet() {
  const marks = getCoverMarks("passeja-home").filter((m) => m.cx > 220);
  return (
    <svg className="hero-sheet" viewBox={`0 0 ${COVER_VIEWBOX.w} ${COVER_VIEWBOX.h}`} preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <g className="hero-rings">{rings.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r="7" />)}</g>
      <g className="hero-marks">{marks.map((m, i) => <circle key={i} cx={m.cx} cy={m.cy} r="7" style={{ "--i": i }} />)}</g>
    </svg>
  );
}

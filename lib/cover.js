/**
 * lib/cover.js
 *
 * Gera, de forma determinística a partir do slug, quais "bolhas" do
 * cartão-resposta aparecem preenchidas na capa de cada artigo.
 * Mesmo slug → mesma capa, sempre (sem Math.random → sem hydration
 * mismatch e sem capa "pulando" entre builds).
 *
 * A grade da capa tem 3 blocos × 6 linhas × 5 alternativas (A–E).
 * Em cada linha de cada bloco, exatamente UMA bolha é preenchida —
 * como num cartão-resposta de verdade.
 */

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const COVER_VIEWBOX = { w: 320, h: 180 };
const GROUPS = [17, 117, 217]; // borda esquerda de cada bloco (cada bloco tem 5 bolhas)
const COL_STEP = 18;
const ROW_STEP = 26;
const FIRST_ROW_Y = 22;
const ROWS = 6;

export function getCoverMarks(seed) {
  let h = hashString(String(seed || "passeja"));
  const marks = [];
  for (let g = 0; g < GROUPS.length; g++) {
    for (let r = 0; r < ROWS; r++) {
      // xorshift simples para tirar uma "alternativa" por linha
      h ^= h << 13; h >>>= 0;
      h ^= h >>> 17;
      h ^= h << 5; h >>>= 0;
      const col = h % 5;
      marks.push({
        cx: GROUPS[g] + 7 + col * COL_STEP,
        cy: FIRST_ROW_Y + r * ROW_STEP,
        d: g * 6 + r, // ordem para animações escalonadas
      });
    }
  }
  return marks;
}

/** Gera o SVG (data-URI) da grade de anéis vazios — usado como máscara CSS. */
export function ringsGridSvg() {
  const circles = [];
  for (const gx of GROUPS) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < 5; c++) {
        circles.push(
          `<circle cx="${gx + 7 + c * COL_STEP}" cy="${FIRST_ROW_Y + r * ROW_STEP}" r="7"/>`
        );
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none" stroke="#000" stroke-width="1.6">${circles.join("")}</svg>`;
}

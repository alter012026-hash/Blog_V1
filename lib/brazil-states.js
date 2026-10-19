const stateRows = [
  ["AC", "Acre", "Norte", "Rio Branco", 55, 96, "#38bdf8"],
  ["AL", "Alagoas", "Nordeste", "Maceió", 355, 144, "#fb7185"],
  ["AP", "Amapá", "Norte", "Macapá", 305, 0, "#22c55e"],
  ["AM", "Amazonas", "Norte", "Manaus", 105, 48, "#a78bfa"],
  ["BA", "Bahia", "Nordeste", "Salvador", 255, 144, "#f97316"],
  ["CE", "Ceará", "Nordeste", "Fortaleza", 305, 48, "#eab308"],
  ["DF", "Distrito Federal", "Centro-Oeste", "Brasília", 255, 192, "#06b6d4"],
  ["ES", "Espírito Santo", "Sudeste", "Vitória", 305, 240, "#84cc16"],
  ["GO", "Goiás", "Centro-Oeste", "Goiânia", 205, 192, "#ec4899"],
  ["MA", "Maranhão", "Nordeste", "São Luís", 255, 48, "#14b8a6"],
  ["MT", "Mato Grosso", "Centro-Oeste", "Cuiabá", 155, 144, "#f43f5e"],
  ["MS", "Mato Grosso do Sul", "Centro-Oeste", "Campo Grande", 155, 192, "#8b5cf6"],
  ["MG", "Minas Gerais", "Sudeste", "Belo Horizonte", 255, 240, "#3b82f6"],
  ["PA", "Pará", "Norte", "Belém", 205, 48, "#10b981"],
  ["PB", "Paraíba", "Nordeste", "João Pessoa", 355, 96, "#d946ef"],
  ["PR", "Paraná", "Sul", "Curitiba", 205, 336, "#f59e0b"],
  ["PE", "Pernambuco", "Nordeste", "Recife", 305, 96, "#6366f1"],
  ["PI", "Piauí", "Nordeste", "Teresina", 255, 96, "#0ea5e9"],
  ["RJ", "Rio de Janeiro", "Sudeste", "Rio de Janeiro", 305, 288, "#ef4444"],
  ["RN", "Rio Grande do Norte", "Nordeste", "Natal", 355, 48, "#22d3ee"],
  ["RS", "Rio Grande do Sul", "Sul", "Porto Alegre", 155, 432, "#a3e635"],
  ["RO", "Rondônia", "Norte", "Porto Velho", 105, 96, "#f472b6"],
  ["RR", "Roraima", "Norte", "Boa Vista", 155, 0, "#2dd4bf"],
  ["SC", "Santa Catarina", "Sul", "Florianópolis", 205, 384, "#c084fc"],
  ["SP", "São Paulo", "Sudeste", "São Paulo", 255, 288, "#fb923c"],
  ["SE", "Sergipe", "Nordeste", "Aracaju", 355, 192, "#4ade80"],
  ["TO", "Tocantins", "Norte", "Palmas", 205, 96, "#818cf8"],
];

export const brazilStates = stateRows.map(([code, name, region, capital, x, y, color]) => ({
  code,
  name,
  region,
  capital,
  x,
  y,
  color,
}));

export function getBrazilState(code) {
  return brazilStates.find((state) => state.code === String(code || "").toUpperCase()) || null;
}

function normalize(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const geographicContext = "(?:concurso|concursos|edital|editais|estado|prefeitura|governo|policia|tribunal|defensoria|universidade|uf|pc|pm|dpe|mp)";

export function postMatchesBrazilState(post, state) {
  if (!state) return false;

  const searchableTitle = normalize(`${post.title || ""} ${post.slug || ""}`);
  const searchablePost = normalize(`${searchableTitle} ${post.excerpt || ""}`);
  const geographicNames = [state.name, state.capital].map(normalize);

  if (geographicNames.some((name) => name && searchablePost.includes(name))) return true;

  const code = state.code.toLowerCase();
  const codePattern = new RegExp(
    `\\b${geographicContext}\\s+(?:do\\s+|de\\s+|em\\s+)?${code}\\b|\\b${code}\\s+${geographicContext}\\b`,
    "i"
  );
  return codePattern.test(searchableTitle);
}

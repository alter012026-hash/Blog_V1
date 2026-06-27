#!/usr/bin/env node
/**
 * detect-topic-overlap.js
 *
 * Detecta posts sobre o MESMO TEMA, mesmo quando o TEXTO de cada um é
 * suficientemente diferente para passar pelo checker de similaridade de
 * conteúdo (lib/quality-engine.js → jaccardSimilarity).
 *
 * Por quê isso é um script separado de fix-existing-titles.js:
 *   jaccardSimilarity compara PALAVRAS DO CORPO do artigo. Como o gerador de
 *   IA recebe instrução explícita pra usar exemplos, ângulo e estrutura
 *   diferentes em cada regeneração, dois artigos podem ter texto 80%+
 *   diferente e ainda assim responderem exatamente à mesma busca do leitor
 *   (ex.: "como montar cronograma de estudos para concurso público" e
 *   "...(guia atualizado)" e "...(dicas práticas)" — três URLs competindo
 *   pela mesma palavra-chave no Google, mesmo com texto original em cada).
 *
 * Esse script ataca o problema pela raiz: normaliza o SLUG de cada post
 * (remove sufixos decorativos conhecidos, stopwords, ordena as palavras
 * restantes) e agrupa por essa assinatura. Grupos com 2+ posts são
 * candidatos a canibalização de SEO — mesmo que o conteúdo de cada um
 * seja 100% original.
 *
 * Uso: node scripts/detect-topic-overlap.js
 * Saída: .topic-overlap.json (lido pela aba "Qualidade" do painel admin)
 */

const fs = require("fs");
const path = require("path");
const qe = require("../lib/quality-engine.js");

const postsDir = path.resolve(__dirname, "../posts");
const overlapLogPath = path.resolve(__dirname, "../.topic-overlap.json");

// Sufixos que o gerador (scripts/generate-article.js, antes da correção) ou
// regenerações manuais costumam colar no fim de um tópico já existente.
// Mantém essa lista em sincronia com qualquer variação nova que você notar
// nos títulos publicados.
const DECORATIVE_SUFFIXES = [
  "guia atualizado",
  "dicas praticas",
  "dicas pratica",
  "passo a passo",
  "o que mudou em 2026",
  "o que mudou neste ano",
  "estrategia pratica e mensuravel",
  "estrategias praticas e mensuraveis",
];

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o",
  "as", "os", "no", "na", "nos", "nas", "ou", "um", "uma", "que", "por",
  "seu", "sua", "seus", "suas",
]);

function normalizeTopic(slug) {
  let s = slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ");

  for (const suf of DECORATIVE_SUFFIXES) {
    s = s.replace(new RegExp(`${suf}$`), "").trim();
  }

  const words = s
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .sort();

  return words.join(" ");
}

function main() {
  if (!fs.existsSync(postsDir)) {
    console.error("❌ Pasta /posts não encontrada.");
    process.exit(1);
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  console.log(`\n🔍 Analisando sobreposição temática em ${files.length} posts...\n`);

  const entries = files.map((file) => {
    const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
    const parsed = qe.splitFrontmatterAndBody(raw);
    const slug = qe.slugFromFileName(file);
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "";

    let title = slug;
    let wordCount = 0;
    if (parsed) {
      title = qe.getFrontmatterField(parsed.fm, "title") || slug;
      wordCount = qe.countWords(parsed.body);
    }

    return { file, slug, title, date, wordCount, topicKey: normalizeTopic(slug) };
  });

  const groups = {};
  for (const entry of entries) {
    if (!groups[entry.topicKey]) groups[entry.topicKey] = [];
    groups[entry.topicKey].push(entry);
  }

  const overlapGroups = Object.entries(groups)
    .filter(([, list]) => list.length > 1)
    .map(([topicKey, list]) => {
      // sugestão automática: manter o post com mais palavras (geralmente o
      // mais completo); em empate, manter o mais antigo (já tem mais tempo
      // indexado no Google, então tem mais chance de já ranquear)
      const sorted = [...list].sort((a, b) => {
        if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
        return a.date.localeCompare(b.date);
      });
      const keep = sorted[0];
      const merge = sorted.slice(1);

      return {
        topicKey,
        count: list.length,
        suggestedKeep: { file: keep.file, title: keep.title, wordCount: keep.wordCount, date: keep.date },
        suggestedMergeOrRedirect: merge.map((m) => ({
          file: m.file,
          title: m.title,
          wordCount: m.wordCount,
          date: m.date,
        })),
      };
    })
    .sort((a, b) => b.count - a.count);

  const affectedFiles = overlapGroups.reduce((acc, g) => acc + g.count, 0);

  const output = {
    generatedAt: new Date().toISOString(),
    totalPosts: files.length,
    overlapGroupCount: overlapGroups.length,
    affectedFileCount: affectedFiles,
    groups: overlapGroups,
  };

  fs.writeFileSync(overlapLogPath, JSON.stringify(output, null, 2));

  console.log(`📋 Grupos de MESMO TEMA encontrados: ${overlapGroups.length}`);
  console.log(`📋 Posts afetados: ${affectedFiles} de ${files.length}\n`);

  overlapGroups.forEach((g) => {
    console.log(`🔁 ${g.topicKey}`);
    console.log(`   ✅ manter:  ${g.suggestedKeep.file}  (${g.suggestedKeep.wordCount} palavras)`);
    g.suggestedMergeOrRedirect.forEach((m) => {
      console.log(`   ⚠️  revisar: ${m.file}  (${m.wordCount} palavras) → mesclar conteúdo único nele e redirecionar (301), ou apagar`);
    });
    console.log("");
  });

  console.log(`💾 .topic-overlap.json atualizado.`);
  console.log(
    `\nO que fazer com cada grupo:\n` +
    `  1. Abra os arquivos marcados "revisar" e o "manter" e compare.\n` +
    `  2. Se algum trouxer um ponto/exemplo que vale a pena, copie manualmente\n` +
    `     para dentro do post que vai ficar (o "manter").\n` +
    `  3. Apague o(s) arquivo(s) "revisar" de /posts.\n` +
    `  4. Configure um redirect 301 da URL antiga para a URL do post mantido\n` +
    `     (em next.config.js, no bloco "redirects").\n` +
    `  5. Rode este script de novo para confirmar que o grupo desapareceu.\n`
  );
}

main();

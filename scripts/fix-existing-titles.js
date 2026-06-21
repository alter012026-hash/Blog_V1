#!/usr/bin/env node
/**
 * fix-existing-titles.js
 * Corrige os posts JÁ PUBLICADOS:
 *   1. Título em Title Case (frontmatter)
 *   2. Excerpt sem corte no meio da palavra/frase
 *   3. Detecta grupos de posts DUPLICADOS (mesmo tema, datas diferentes)
 *   4. Detecta posts com conteúdo raso (poucas palavras / muita frase genérica)
 *
 * Popula .quality-log.json com TODOS os posts existentes, pra alimentar
 * a aba "Qualidade" do painel admin desde o primeiro uso.
 *
 * Uso: node scripts/fix-existing-titles.js
 */

const fs = require("fs");
const path = require("path");
const qe = require("../lib/quality-engine.js");

const postsDir = path.resolve(__dirname, "../posts");
const qualityLogPath = path.resolve(__dirname, "../.quality-log.json");
const signaturesLogPath = path.resolve(__dirname, "../.content-signatures.json");

const MIN_WORDS_THRESHOLD = 900; // ~80% do minWords padrão (1200) do site.config.js

function getFrontmatterField(raw, field) {
  const m = raw.match(new RegExp(`^${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*$`, "m"));
  return m ? m[1].replace(/\\"/g, '"') : null;
}

function setFrontmatterField(raw, field, value) {
  const safe = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const re = new RegExp(`^(${field}:\\s*")(?:[^"\\\\]|\\\\.)*("\\s*)$`, "m");
  if (re.test(raw)) return raw.replace(re, `$1${safe}$2`);
  return raw;
}

function splitFrontmatterAndBody(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { fm: match[1], body: match[2] };
}

function main() {
  if (!fs.existsSync(postsDir)) {
    console.error("❌ Pasta /posts não encontrada.");
    process.exit(1);
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  console.log(`\n🔍 Verificando ${files.length} posts...\n`);

  let titlesFixed = 0;
  let excerptsFixed = 0;
  const qualityEntries = [];
  const signatures = [];

  // agrupa por slug (sem prefixo de data) pra achar duplicatas
  const groups = {};

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = splitFrontmatterAndBody(raw);

    if (!parsed) {
      console.warn(`⚠️  ${file}: frontmatter não reconhecido, pulei.`);
      continue;
    }

    let { fm, body } = parsed;
    const slug = qe.slugFromFileName(file);
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : (getFrontmatterField(fm, "date") || "");

    // 1. título
    const currentTitle = getFrontmatterField(fm, "title") || slug;
    const fixedTitle = qe.toTitleCase(currentTitle);
    if (fixedTitle !== currentTitle) {
      fm = setFrontmatterField(fm, "title", fixedTitle);
      titlesFixed++;
      console.log(`✏️  ${file}\n    título: "${currentTitle}" → "${fixedTitle}"`);
    }

    // 2. excerpt — sempre regenera com o cortador seguro (sem mudar o conteúdo)
    const newExcerpt = qe.buildSafeExcerpt(body);
    const currentExcerpt = getFrontmatterField(fm, "excerpt");
    if (newExcerpt !== currentExcerpt) {
      fm = /^excerpt:/m.test(fm)
        ? setFrontmatterField(fm, "excerpt", newExcerpt)
        : fm + `\nexcerpt: "${newExcerpt.replace(/"/g, '\\"')}"`;
      excerptsFixed++;
    }

    fs.writeFileSync(filePath, `---\n${fm}\n---\n${body}`);

    // 3. agrupa por slug pra detectar duplicata
    if (!groups[slug]) groups[slug] = [];
    groups[slug].push({ file, date });

    // 4. qualidade
    const wordCount = qe.countWords(body);
    const fillerCount = qe.countFillerPhrases(body);
    const category = getFrontmatterField(fm, "category") || "Geral";

    qualityEntries.push({
      timestamp: new Date().toISOString(),
      file,
      slug,
      title: fixedTitle,
      category,
      date,
      provider: "—",
      wordCount,
      fillerCount,
      similarity: 0, // calculado abaixo, depois de coletar todas as assinaturas
      similarTo: null,
      status: wordCount < MIN_WORDS_THRESHOLD || fillerCount >= 2 ? "raso" : "ok",
      issues: wordCount < MIN_WORDS_THRESHOLD ? [`poucas palavras (${wordCount})`] : [],
    });

    signatures.push({ slug, file, words: qe.getSignature(body) });
  }

  // ─── calcula similaridade entre TODOS os posts (par a par) ────────────────
  for (let i = 0; i < signatures.length; i++) {
    let maxSim = 0;
    let mostSimilar = null;
    for (let j = 0; j < signatures.length; j++) {
      if (i === j) continue;
      const sim = qe.jaccardSimilarity(signatures[i].words, signatures[j].words);
      if (sim > maxSim) {
        maxSim = sim;
        mostSimilar = signatures[j].file;
      }
    }
    const entry = qualityEntries.find((e) => e.file === signatures[i].file);
    if (entry) {
      entry.similarity = Math.round(maxSim * 100);
      entry.similarTo = mostSimilar;
      if (maxSim > 0.55 && entry.status === "ok") entry.status = "raso";
    }
  }

  // ─── marca grupos duplicados (mesmo slug, datas diferentes) ───────────────
  const duplicateGroups = Object.entries(groups)
    .filter(([, list]) => list.length > 1)
    .map(([slug, list]) => {
      const sorted = list.sort((a, b) => a.date.localeCompare(b.date));
      return {
        slug,
        keep: sorted[0].file, // mantém o mais antigo
        remove: sorted.slice(1).map((x) => x.file),
      };
    });

  for (const group of duplicateGroups) {
    for (const entry of qualityEntries) {
      if (group.remove.includes(entry.file)) {
        entry.status = "duplicado";
        entry.duplicateOf = group.keep;
      }
    }
  }

  // ─── persiste ──────────────────────────────────────────────────────────────
  fs.writeFileSync(qualityLogPath, JSON.stringify(qualityEntries, null, 2));
  fs.writeFileSync(
    signaturesLogPath,
    JSON.stringify(signatures.map(({ slug, words }) => ({ slug, words })), null, 2)
  );

  // ─── relatório no console ───────────────────────────────────────────────────
  console.log(`\n✅ Títulos corrigidos: ${titlesFixed}`);
  console.log(`✅ Excerpts corrigidos: ${excerptsFixed}`);

  console.log(`\n📋 Grupos de posts DUPLICADOS (${duplicateGroups.length}):\n`);
  duplicateGroups.forEach((g) => {
    console.log(`   🔁 ${g.slug}`);
    console.log(`      mantém: ${g.keep}`);
    g.remove.forEach((f) => console.log(`      remover: ${f}`));
  });

  const shallow = qualityEntries.filter((e) => e.status === "raso");
  console.log(`\n📋 Posts com indício de conteúdo raso (${shallow.length}):\n`);
  shallow
    .sort((a, b) => a.wordCount - b.wordCount)
    .forEach((e) => console.log(`   - ${e.file} (${e.wordCount} palavras, ${e.fillerCount} clichês, ${e.similarity}% similar)`));

  console.log(`\n💾 .quality-log.json atualizado — confira a aba "Qualidade" no painel admin.`);
  console.log(
    `\nPra REMOVER um duplicado manualmente:\n  Apague o arquivo em /posts e rode este script de novo.\n` +
    `Pra REGENERAR um post raso (mantendo a URL):\n  node scripts/generate-article.js --topic "tema" --force-file "nome-do-arquivo.md"\n`
  );
}

main();

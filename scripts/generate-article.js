#!/usr/bin/env node
require("dotenv").config({ path: ".env.local", override: false });

const fs = require("fs");
const path = require("path");
const siteConfig = require("../site.config.js");

// ─── CLI ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : siteConfig.generation.articlesPerRun;

// ─── Helpers ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 80);
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Gemini MODELS CORRIGIDOS ───────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
];

// ─── GROQ ────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY ausente");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (res.status === 429) throw new Error("Groq: rate limit (429)");
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── OPENROUTER ──────────────────────────────────────────────────────
async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY ausente");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": siteConfig.url,
      "X-Title": siteConfig.name,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (res.status === 429 || res.status === 402)
    throw new Error("OpenRouter: limite atingido");

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── GEMINI (CORRIGIDO) ─────────────────────────────────────────────
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY ausente");

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (res.status === 429 || res.status === 503) {
        console.warn(`⚠️ Gemini ${model} rate limit`);
        continue;
      }

      if (res.status === 404) {
        console.warn(`⚠️ Gemini ${model} não existe`);
        continue;
      }

      if (!res.ok) {
        console.warn(`⚠️ Gemini ${model} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`✅ Gemini usou: ${model}`);
        return text;
      }
    } catch (e) {
      console.warn(`⚠️ Gemini erro ${model}: ${e.message}`);
    }
  }

  throw new Error("Gemini: todos os modelos falharam");
}

// ─── FALLBACK ────────────────────────────────────────────────────────
async function generateWithFallback(prompt) {
  const providers = [
    { name: "Groq", fn: callGroq },
    { name: "OpenRouter", fn: callOpenRouter },
    { name: "Gemini", fn: callGemini },
  ];

  const errors = [];

  for (const p of providers) {
    try {
      console.log(`🔄 Tentando ${p.name}...`);

      const text = await p.fn(prompt);

      console.log(`✅ Gerado via ${p.name}`);
      return { text, provider: p.name };
    } catch (e) {
      console.warn(`❌ ${p.name}: ${e.message}`);
      errors.push(`${p.name}: ${e.message}`);

      await sleep(1500); // evita burst
    }
  }

  throw new Error("FALHA TOTAL:\n" + errors.join("\n"));
}
import { createSign } from "node:crypto";
import fs from "node:fs";

function parseJsonTolerant(raw) {
  let result = "";
  let insideString = false;
  let escaping = false;

  for (const char of raw) {
    if (insideString) {
      if (escaping) {
        result += char;
        escaping = false;
      } else if (char === "\\") {
        result += char;
        escaping = true;
      } else if (char === '"') {
        result += char;
        insideString = false;
      } else if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      if (char === '"') insideString = true;
      result += char;
    }
  }

  return JSON.parse(result);
}

export function getServiceAccount() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;

  if (encoded) return parseJsonTolerant(Buffer.from(encoded, "base64").toString("utf8"));
  if (filePath) return parseJsonTolerant(fs.readFileSync(filePath, "utf8"));
  return null;
}

export async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const assertion = `${unsignedToken}.${signer.sign(serviceAccount.private_key.replace(/\\n/g, "\n"), "base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Não foi possível autenticar no Google.");
  }
  return data.access_token;
}

function utcDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getPeriods() {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 3);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - 27);

  return {
    current: { startDate: utcDate(start), endDate: utcDate(end) },
    previous: { startDate: utcDate(previousStart), endDate: utcDate(previousEnd) },
  };
}

export async function querySearchAnalytics(property, token, period, dimensions = ["page"], orderBy) {
  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...period,
        dimensions,
        ...(orderBy ? { orderBy } : {}),
        type: "web",
        rowLimit: 25000,
      }),
      cache: "no-store",
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Falha ao consultar o Search Console.");
    error.status = response.status;
    throw error;
  }
  return data.rows || [];
}

#!/usr/bin/env node

/**
 * NUVC MCP Server
 *
 * Exposes NUVC VC-grade intelligence as MCP tools for Claude, Cursor, and any
 * MCP-compatible agent. Wraps the NUVC public API (v3) — no backend access needed.
 *
 * Tools: nuvc_score, nuvc_analyze, nuvc_roast, nuvc_extract, nuvc_models
 *
 * Setup:
 *   export NUVC_API_KEY=nuvc_your_key_here
 *   npx nuvc-mcp
 *
 * Get a free API key (50 calls/month) at https://nuvc.ai/api-platform/keys
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "https://api.nuvc.ai/api/v3";
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

function getApiKey() {
  const key = process.env.NUVC_API_KEY;
  if (!key || !key.startsWith("nuvc_")) {
    throw new Error(
      "NUVC_API_KEY not set or invalid.\n" +
      "Get a free key at https://nuvc.ai/api-platform/keys\n" +
      "Then: export NUVC_API_KEY=nuvc_your_key_here"
    );
  }
  return key;
}

async function apiCall(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        "User-Agent": "nuvc-mcp/1.0",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = err?.error?.message || err?.detail?.message || err?.detail || res.statusText;
      if (res.status === 401) throw new Error(`Auth error: ${msg}. Check your NUVC_API_KEY at https://nuvc.ai/api-platform/keys`);
      if (res.status === 429) throw new Error(`Rate limit reached. Upgrade at https://nuvc.ai/api-platform/keys`);
      throw new Error(`API error (${res.status}): ${msg}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out after 30s");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "nuvc_score",
    description:
      "Score any business idea or startup on a VCGrade 0-10 scale across 5 dimensions: " +
      "Problem & Market, Solution & Product, Business Model, Traction & Metrics, and Team & Execution. " +
      "Powered by the AI engine behind 250+ VC investment memos.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Business idea, startup description, or pitch content to score",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_analyze",
    description:
      "Analyze a market, competitive landscape, financial data, or full pitch deck. " +
      "Returns structured analysis with insights, opportunities, and risks.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Content to analyze",
        },
        analysis_type: {
          type: "string",
          enum: ["market", "competitive", "financial", "pitch_deck", "general"],
          description: "Type of analysis to perform. Defaults to 'market'.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_roast",
    description:
      "Get a brutally honest but constructive VC-perspective roast of any startup idea. " +
      "Returns: The Roast, The Real Talk, The Silver Lining, and a Verdict.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Startup idea or pitch to roast",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_extract",
    description:
      "Extract structured data from pitch text or business descriptions. " +
      "Returns fields like revenue, growth rate, team size, funding stage, market size, and key metrics.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Pitch or business description to extract data from",
        },
        extraction_type: {
          type: "string",
          enum: ["general", "company", "financial", "contact"],
          description: "Type of extraction. Defaults to 'company'.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_models",
    description: "List available AI models, provider health, and embedding models in the NUVC platform.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleScore({ text }) {
  const res = await apiCall("POST", "/ai/score", { text });
  const data = res.data || res;
  const scores = data.scores || {};
  const overall = scores.overall_score;
  const dimensions = scores.scores || {};
  const summary = scores.summary || "";

  const lines = ["## NUVC VCGrade Score\n"];

  if (overall !== undefined) {
    const n = Number(overall);
    const emoji = n >= 7 ? "🟢" : n >= 5 ? "🟡" : "🔴";
    const verdict =
      n >= 8 ? "Exceptional — investors will lean in"
      : n >= 7 ? "Strong — worth pursuing seriously"
      : n >= 5 ? "Promising but needs work"
      : n >= 3 ? "Significant gaps to address"
      : "Back to the drawing board";
    lines.push(`${emoji} **Overall: ${n} / 10** — ${verdict}\n`);
  }

  const entries = Object.entries(dimensions).filter(
    ([k]) => k !== "overall_score" && k !== "summary" && k !== "raw"
  );
  if (entries.length > 0) {
    lines.push("| Dimension | Score | Rationale |");
    lines.push("|-----------|-------|-----------|");
    for (const [key, val] of entries) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (typeof val === "object" && val !== null) {
        lines.push(`| ${label} | ${val.score ?? "—"}/10 | ${val.rationale ?? ""} |`);
      } else {
        lines.push(`| ${label} | ${val}/10 | |`);
      }
    }
    lines.push("");
  }

  if (summary) lines.push(`**Summary:** ${summary}`);

  return lines.join("\n");
}

async function handleAnalyze({ text, analysis_type = "market" }) {
  const res = await apiCall("POST", "/ai/analyze", { text, analysis_type });
  const data = res.data || res;
  const label = analysis_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `## NUVC ${label} Analysis\n\n${data.analysis || JSON.stringify(data, null, 2)}`;
}

async function handleRoast({ text }) {
  const res = await apiCall("POST", "/ai/analyze", { text, analysis_type: "pitch_deck" });
  const data = res.data || res;
  return `## 🔥 NUVC Startup Roast\n\n${data.analysis || JSON.stringify(data, null, 2)}`;
}

async function handleExtract({ text, extraction_type = "company" }) {
  const res = await apiCall("POST", "/ai/extract", { text, extraction_type });
  const data = res.data || res;
  const extracted = data.extracted || data;

  if (typeof extracted !== "object" || extracted === null) {
    return String(extracted);
  }

  const lines = ["## NUVC Structured Extraction\n"];
  for (const [key, val] of Object.entries(extracted)) {
    if (val === null || val === undefined) continue;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const display = Array.isArray(val) ? val.join(", ") : String(val);
    lines.push(`**${label}:** ${display}`);
  }
  return lines.join("\n");
}

async function handleModels() {
  const res = await apiCall("GET", "/ai/models");
  const data = res.data || res;
  const lines = ["## NUVC Available Models\n"];

  if (Array.isArray(data.providers) && data.providers.length > 0) {
    lines.push("| Provider | Available | Healthy |");
    lines.push("|----------|-----------|---------|");
    for (const p of data.providers) {
      lines.push(`| ${p.name} | ${p.available ? "✓" : "✗"} | ${p.healthy ? "✓" : "✗"} |`);
    }
    lines.push("");
  }

  if (Array.isArray(data.embedding_models)) {
    lines.push(`**Embedding models:** ${data.embedding_models.join(", ")}`);
  }
  if (data.preference) {
    lines.push(`**Preference:** ${Array.isArray(data.preference) ? data.preference.join(" → ") : data.preference}`);
  }

  return lines.join("\n");
}

const HANDLERS = {
  nuvc_score: handleScore,
  nuvc_analyze: handleAnalyze,
  nuvc_roast: handleRoast,
  nuvc_extract: handleExtract,
  nuvc_models: handleModels,
};

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "nuvc", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = HANDLERS[name];

    if (!handler) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await handler(args || {});
      return { content: [{ type: "text", text: result }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

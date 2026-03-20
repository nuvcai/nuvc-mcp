/**
 * NUVC tool definitions and handlers — shared by stdio and HTTP transports.
 */

const API_BASE = "https://api.nuvc.ai/api/v3";
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

function getApiKey() {
  const key = process.env.NUVC_API_KEY;
  if (!key || !key.startsWith("nuvc_")) {
    throw new Error(
      "NUVC_API_KEY not set or invalid. Get a free key at https://nuvc.ai/api-platform/keys"
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
        "User-Agent": "nuvc-mcp/1.1",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = err?.error?.message || err?.detail?.message || err?.detail || res.statusText;
      if (res.status === 401) throw new Error(`Auth error: ${msg}. Check NUVC_API_KEY at https://nuvc.ai/api-platform/keys`);
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

export const TOOLS = [
  {
    name: "nuvc_score",
    description:
      "Score any business idea or startup on a VCGrade 0-10 scale across 5 dimensions: " +
      "Problem & Market, Solution & Product, Business Model, Traction & Metrics, and Team & Execution. " +
      "Powered by the AI engine behind 250+ VC investment memos.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Business idea, startup description, or pitch content to score" },
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
        text: { type: "string", description: "Content to analyze" },
        analysis_type: {
          type: "string",
          enum: ["market", "competitive", "financial", "pitch_deck", "general"],
          description: "Type of analysis. Defaults to 'market'.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_roast",
    description:
      "Get a brutally honest but constructive VC-perspective roast of any startup idea. " +
      "Returns sharp, actionable feedback with a verdict.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Startup idea or pitch to roast" },
      },
      required: ["text"],
    },
  },
  {
    name: "nuvc_extract",
    description:
      "Extract structured data from pitch text. Returns fields like revenue, growth rate, team size, funding stage, and key metrics.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Pitch or business description to extract data from" },
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
    description: "List available AI models, provider health, and embedding models.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "nuvc_venture_math",
    description:
      "Compute venture finance metrics from raw startup financials — burn multiple, LTV/CAC ratio, " +
      "Rule of 40, default alive status, dilution, ARR multiples, and financial health score. " +
      "Optionally benchmark against stage-appropriate VC thresholds (elite/strong/adequate/concerning). " +
      "Pure math, no AI calls, instant response. Works for founders validating metrics or VCs screening deals.",
    inputSchema: {
      type: "object",
      properties: {
        arr: { type: "number", description: "Annual recurring revenue (USD)" },
        mrr: { type: "number", description: "Monthly recurring revenue (USD)" },
        burn_rate: { type: "number", description: "Monthly burn rate (USD)" },
        runway_months: { type: "number", description: "Months of runway remaining" },
        cac: { type: "number", description: "Customer acquisition cost (USD)" },
        ltv: { type: "number", description: "Customer lifetime value (USD)" },
        gross_margin: { type: "number", description: "Gross margin percentage (0-100)" },
        total_raised: { type: "number", description: "Total capital raised to date (USD)" },
        raise_amount: { type: "number", description: "Current round size (USD)" },
        pre_money_valuation: { type: "number", description: "Pre-money valuation (USD)" },
        revenue_growth_rate: { type: "number", description: "Revenue growth rate (%)" },
        stage: {
          type: "string",
          enum: ["pre_seed", "seed", "series_a", "series_b", "series_c", "growth"],
          description: "Funding stage (default: seed). Used for benchmark comparison.",
        },
        benchmark: {
          type: "boolean",
          description: "If true, also compare metrics against stage-appropriate VC benchmarks. Default: true.",
        },
      },
    },
  },
  {
    name: "nuvc_fund_economics",
    description:
      "Compute fund economics from an LP perspective — fee drag, GP alignment score, J-curve position, " +
      "return decomposition (alpha vs beta), concentration risk, and overall fund health score. " +
      "Also computes portfolio construction math: investable capital, implied portfolio count, " +
      "follow-on reserves, and deployment capacity. Pure math, instant response. " +
      "For VCs sizing their fund, or LPs/family offices evaluating VC/PE fund commitments.",
    inputSchema: {
      type: "object",
      properties: {
        fund_size: { type: "number", description: "Total fund size (USD)" },
        management_fee: { type: "number", description: "Annual management fee rate (%, e.g. 2.0)" },
        carry: { type: "number", description: "Carried interest rate (%, e.g. 20)" },
        preferred_return: { type: "number", description: "Preferred return / hurdle rate (%)" },
        tvpi: { type: "number", description: "Total Value to Paid-In multiple" },
        dpi: { type: "number", description: "Distributions to Paid-In multiple" },
        net_irr: { type: "number", description: "Net IRR (%)" },
        vintage_year: { type: "integer", description: "Fund vintage year" },
        portfolio_count: { type: "integer", description: "Number of portfolio companies" },
        fund_life_years: { type: "integer", description: "Fund life in years" },
        avg_check_size: { type: "number", description: "Average initial check size (USD)" },
        reserve_ratio: { type: "number", description: "Follow-on reserve ratio (0-1, default 0.50)" },
        include_portfolio: {
          type: "boolean",
          description: "If true, also compute portfolio construction math. Default: true.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Handlers
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
  if (typeof extracted !== "object" || extracted === null) return String(extracted);
  const lines = ["## NUVC Structured Extraction\n"];
  for (const [key, val] of Object.entries(extracted)) {
    if (val === null || val === undefined) continue;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`**${label}:** ${Array.isArray(val) ? val.join(", ") : String(val)}`);
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

async function handleVentureMath(args) {
  const { benchmark = true, ...financials } = args;
  const res = await apiCall("POST", "/ai/venture-math/compute", financials);
  const metrics = res.data || res;

  const lines = ["## NUVC Venture Math\n"];

  // Format computed metrics
  const fmt = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(2)) : v);
  const metricLabels = {
    burn_multiple: "Burn Multiple",
    ltv_cac_ratio: "LTV/CAC Ratio",
    rule_of_40: "Rule of 40",
    default_alive: "Default Alive",
    arr_multiple: "ARR Multiple",
    dilution_pct: "Dilution %",
    runway_months: "Runway (months)",
    gross_margin: "Gross Margin %",
    revenue_growth_rate: "Revenue Growth %",
    financial_health_score: "Financial Health Score",
  };

  const entries = Object.entries(metrics).filter(([k]) => k in metricLabels);
  if (entries.length > 0) {
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    for (const [key, val] of entries) {
      const label = metricLabels[key] || key;
      lines.push(`| ${label} | ${fmt(val)} |`);
    }
    lines.push("");
  }

  // Benchmark comparison
  if (benchmark) {
    try {
      const stage = financials.stage || "seed";
      const benchRes = await apiCall("POST", "/ai/venture-math/benchmark", { metrics, stage });
      const benchmarks = benchRes.data || benchRes;
      if (benchmarks && typeof benchmarks === "object") {
        const benchEntries = Object.entries(benchmarks).filter(
          ([, v]) => typeof v === "object" && v !== null && v.signal
        );
        if (benchEntries.length > 0) {
          lines.push(`### Benchmark vs ${stage.replace(/_/g, " ").toUpperCase()} stage\n`);
          lines.push("| Metric | Value | Signal | Benchmark |");
          lines.push("|--------|-------|--------|-----------|");
          for (const [key, b] of benchEntries) {
            const label = metricLabels[key] || key.replace(/_/g, " ");
            const signal =
              b.signal === "elite" ? "🟣 Elite"
              : b.signal === "strong" ? "🟢 Strong"
              : b.signal === "adequate" ? "🟡 Adequate"
              : "🔴 Concerning";
            lines.push(`| ${label} | ${fmt(b.value)} | ${signal} | ${b.threshold || ""} |`);
          }
          lines.push("");
        }
      }
    } catch {
      // Benchmark is optional — don't fail the whole tool
    }
  }

  return lines.join("\n");
}

async function handleFundEconomics(args) {
  const { include_portfolio = true, avg_check_size, reserve_ratio, ...fundParams } = args;

  const res = await apiCall("POST", "/ai/venture-math/fund-economics", fundParams);
  const data = res.data || res;

  const lines = ["## NUVC Fund Economics\n"];
  const fmt = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(2)) : v);

  // Key economics
  const economicFields = [
    ["fee_drag", "Fee Drag"],
    ["gp_alignment_score", "GP Alignment Score"],
    ["j_curve_position", "J-Curve Position"],
    ["fund_health_score", "Fund Health Score"],
    ["total_fees", "Total Fees (USD)"],
    ["net_to_lp", "Net to LP"],
    ["concentration_risk", "Concentration Risk"],
  ];

  const hasFields = economicFields.filter(([k]) => data[k] !== undefined);
  if (hasFields.length > 0) {
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    for (const [key, label] of hasFields) {
      lines.push(`| ${label} | ${fmt(data[key])} |`);
    }
    lines.push("");
  }

  // Return decomposition
  if (data.return_decomposition) {
    const rd = data.return_decomposition;
    lines.push("### Return Decomposition\n");
    for (const [key, val] of Object.entries(rd)) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`**${label}:** ${fmt(val)}`);
    }
    lines.push("");
  }

  // Full data fallback for any extra fields
  const shown = new Set([...economicFields.map(([k]) => k), "return_decomposition"]);
  const extra = Object.entries(data).filter(
    ([k, v]) => !shown.has(k) && v !== null && v !== undefined && typeof v !== "object"
  );
  if (extra.length > 0) {
    for (const [key, val] of extra) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`**${label}:** ${fmt(val)}`);
    }
    lines.push("");
  }

  // Portfolio construction (optional second call)
  if (include_portfolio && (args.fund_size || fundParams.fund_size)) {
    try {
      const portfolioReq = {
        fund_size: args.fund_size || fundParams.fund_size,
        avg_check_size: avg_check_size || undefined,
        reserve_ratio: reserve_ratio ?? 0.50,
        management_fee_rate: fundParams.management_fee ? fundParams.management_fee / 100 : 0.02,
        fund_life_years: fundParams.fund_life_years || 10,
        investment_period_years: Math.min(fundParams.fund_life_years || 10, 5),
      };
      const pRes = await apiCall("POST", "/ai/venture-math/portfolio", portfolioReq);
      const pData = pRes.data || pRes;

      lines.push("### Portfolio Construction\n");
      const portfolioFields = [
        ["investable_capital", "Investable Capital"],
        ["implied_portfolio_count", "Implied Portfolio Count"],
        ["follow_on_reserves", "Follow-On Reserves"],
        ["fee_drag_pct", "Fee Drag %"],
        ["deployment_per_year", "Deployment Per Year"],
      ];
      const pEntries = portfolioFields.filter(([k]) => pData[k] !== undefined);
      if (pEntries.length > 0) {
        lines.push("| Metric | Value |");
        lines.push("|--------|-------|");
        for (const [key, label] of pEntries) {
          const val = pData[key];
          lines.push(`| ${label} | ${typeof val === "number" && val > 1000 ? `$${val.toLocaleString()}` : fmt(val)} |`);
        }
        lines.push("");
      }

      // Fallback for extra portfolio fields
      const pShown = new Set(portfolioFields.map(([k]) => k));
      const pExtra = Object.entries(pData).filter(
        ([k, v]) => !pShown.has(k) && v !== null && v !== undefined && typeof v !== "object"
      );
      for (const [key, val] of pExtra) {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`**${label}:** ${typeof val === "number" && val > 1000 ? `$${val.toLocaleString()}` : fmt(val)}`);
      }
    } catch {
      // Portfolio construction is optional
    }
  }

  return lines.join("\n");
}

export const HANDLERS = {
  nuvc_score: handleScore,
  nuvc_analyze: handleAnalyze,
  nuvc_roast: handleRoast,
  nuvc_extract: handleExtract,
  nuvc_models: handleModels,
  nuvc_venture_math: handleVentureMath,
  nuvc_fund_economics: handleFundEconomics,
};

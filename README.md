# NUVC MCP Server

> VC-grade startup intelligence for Claude, Cursor, and any MCP-compatible agent.
> Built for **founders** validating ideas and **VCs** screening deals.

[![Smithery](https://smithery.ai/badge/nuvc)](https://smithery.ai/server/nuvc)
[![npm](https://img.shields.io/npm/v/nuvc-mcp)](https://npmjs.com/package/nuvc-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Tools

### For Founders

| Tool | What it does |
|------|-------------|
| `nuvc_score` | VCGrade 0-10 score across 5 dimensions — like having a VC partner review your idea |
| `nuvc_analyze` | Market sizing, competitive analysis, financial review, or full pitch evaluation |
| `nuvc_roast` | Brutally honest but constructive VC-perspective startup roast |
| `nuvc_extract` | Extract structured fields (revenue, stage, team, metrics) from any pitch text |
| `nuvc_venture_math` | Compute burn multiple, LTV/CAC, Rule of 40, runway, dilution — with stage benchmarks |

### For VCs & LPs

| Tool | What it does |
|------|-------------|
| `nuvc_score` | Screen inbound deals — score any pitch content on a 0-10 scale in seconds |
| `nuvc_venture_math` | Validate startup financials against stage-appropriate VC benchmarks |
| `nuvc_fund_economics` | Fund economics from an LP lens — fee drag, GP alignment, J-curve, return decomposition |
| `nuvc_fund_economics` | Portfolio construction — investable capital, implied portfolio count, deployment capacity |
| `nuvc_analyze` | Competitive landscape or market analysis for diligence |

### Utility

| Tool | What it does |
|------|-------------|
| `nuvc_extract` | Extract structured data from any pitch, CIM, or deal memo |
| `nuvc_models` | List available AI models and provider health |

## Setup

### 1. Get an API key

Free tier: 25 AI calls/month at **[nuvc.ai/api-platform/keys](https://nuvc.ai/api-platform/keys)**

### 2. Install via Smithery (Claude Desktop / Cursor)

```bash
npx @smithery/cli install nuvc --client claude
```

### 3. Or run directly

```bash
export NUVC_API_KEY=nuvc_your_key_here
npx nuvc-mcp
```

### 4. Claude Desktop config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nuvc": {
      "command": "npx",
      "args": ["nuvc-mcp"],
      "env": {
        "NUVC_API_KEY": "nuvc_your_key_here"
      }
    }
  }
}
```

### 5. Claude Code

```bash
claude mcp add nuvc -- npx nuvc-mcp
# Then set NUVC_API_KEY in your environment
```

## Usage Examples

Once connected, just ask your AI agent:

**Founders:**
- *"Score my startup idea — an AI tool that helps solo founders validate ideas"*
- *"What's the market like for AI-powered HR tools?"*
- *"Roast this idea: Uber for dog walking but with blockchain"*
- *"I have $1.2M ARR, $80K burn, 18 months runway. How do my metrics stack up for Series A?"*

**VCs:**
- *"Score this pitch: [paste founder's pitch text]"*
- *"This founder says $500K ARR, 15% MoM growth, $200K burn at Seed. Run the math."*
- *"We're raising a $30M Fund II with 2% fee, 20% carry, $500K avg check. What does portfolio construction look like?"*
- *"Evaluate this fund: $50M AUM, 2.5x TVPI, 1.2x DPI, 18% net IRR, 2020 vintage"*

## Pricing

| Plan | Price | AI Calls/Month |
|------|-------|---------------|
| Free | $0 | 25 |
| Builder | $29/mo | 500 |
| Growth | $199/mo | 2,000 |
| Scale | $499/mo | 10,000 |

`nuvc_venture_math` and `nuvc_fund_economics` are pure math — they don't count against AI call limits.

[Get your API key →](https://nuvc.ai/api-platform/keys)

## About NUVC

NUVC is a VC-grade startup intelligence platform used by accelerators, angel networks, emerging fund managers, and family offices. Our AI engine has analyzed 250+ pitch decks.

- **Website:** [nuvc.ai](https://nuvc.ai)
- **API Docs:** [nuvc.ai/api-platform/docs](https://nuvc.ai/api-platform/docs)
- **Support:** hello@nuvc.ai

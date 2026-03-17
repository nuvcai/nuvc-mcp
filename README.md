# NUVC MCP Server

> VC-grade startup intelligence for Claude, Cursor, and any MCP-compatible agent.

[![Smithery](https://smithery.ai/badge/nuvc)](https://smithery.ai/server/nuvc)
[![npm](https://img.shields.io/npm/v/nuvc-mcp)](https://npmjs.com/package/nuvc-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Tools

| Tool | What it does |
|------|-------------|
| `nuvc_score` | VCGrade 0-10 score across 5 dimensions — like having a VC partner review your idea |
| `nuvc_analyze` | Market sizing, competitive analysis, financial review, or full pitch evaluation |
| `nuvc_roast` | Brutally honest but constructive VC-perspective startup roast |
| `nuvc_extract` | Extract structured fields (revenue, stage, team, metrics) from any pitch text |
| `nuvc_models` | List available AI models and provider health |

## Setup

### 1. Get an API key

Free tier: 50 AI calls/month at **[nuvc.ai/api-platform/keys](https://nuvc.ai/api-platform/keys)**

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

## Usage Examples

Once connected, just ask Claude:

- *"Score my startup idea — an AI tool that helps solo founders validate ideas"*
- *"What's the market like for AI-powered HR tools?"*
- *"Roast this idea: Uber for dog walking but with blockchain"*
- *"Extract the key metrics from this pitch: [paste pitch text]"*

## Pricing

| Plan | Price | AI Calls/Month |
|------|-------|---------------|
| Free | $0 | 50 |
| Starter | $49/mo | 500 |
| Growth | $199/mo | 5,000 |
| Scale | $499/mo | 50,000 |

[Get your API key →](https://nuvc.ai/api-platform/keys)

## About NUVC

NUVC is a VC-grade startup intelligence platform used by accelerators, angel networks, and emerging fund managers. Our AI engine has analyzed 250+ pitch decks.

- **Website:** [nuvc.ai](https://nuvc.ai)
- **API Docs:** [nuvc.ai/api-platform/docs](https://nuvc.ai/api-platform/docs)
- **Support:** hello@nuvc.ai

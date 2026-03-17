#!/usr/bin/env node

/**
 * NUVC MCP HTTP Server
 *
 * Exposes the NUVC MCP server over HTTP (Streamable HTTP transport).
 * Compatible with Smithery, Claude Desktop (remote), and any MCP HTTP client.
 *
 * POST /mcp  — MCP Streamable HTTP endpoint
 * GET  /     — Health check
 *
 * env: NUVC_API_KEY, PORT (default 3000)
 */

import http from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, HANDLERS } from "./lib/tools.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// ---------------------------------------------------------------------------
// Build MCP server (shared factory — one instance per request for stateless HTTP)
// ---------------------------------------------------------------------------

function createMcpServer() {
  const server = new Server(
    { name: "nuvc", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = HANDLERS[name];
    if (!handler) {
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
    try {
      const result = await handler(args || {});
      return { content: [{ type: "text", text: result }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  });

  return server;
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const httpServer = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, name: "nuvc-mcp", version: "1.0.0" }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp") {
    // Read body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();

    // Re-expose as readable stream for the transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    res.on("close", () => transport.close());

    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.error(`NUVC MCP server listening on port ${PORT}`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
  if (!process.env.NUVC_API_KEY) {
    console.error("WARNING: NUVC_API_KEY not set — tool calls will fail");
  }
});

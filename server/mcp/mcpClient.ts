/**
 * mcpClient.ts
 * ─────────────────────────────────────────────
 * This is your MCP CLIENT.
 * It connects to the MCP server, discovers its tools,
 * then uses Claude to process user messages and call those tools.
 *
 * Flow:
 *   1. Connect to MCP server → get list of available tools
 *   2. Send user message + tool list to Claude
 *   3. If Claude wants to call a tool → forward to MCP server
 *   4. Send result back to Claude → get final answer
 * ─────────────────────────────────────────────
 */

import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MCP_SERVER_URL = "http://localhost:3000/mcp";

// Represents one message in the conversation
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function runMcpChat(
  userMessage: string,
  history: Message[],
): Promise<{ reply: string; toolsUsed: string[] }> {
  // ── Step 1: Connect to your MCP Server ────────────────
  const mcpClient = new Client({ name: "demo-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  await mcpClient.connect(transport);

  // ── Step 2: Discover available tools from MCP server ──
  // This is the magic of MCP — the client asks "what can you do?"
  // and the server responds with its full tool list automatically.
  const { tools: mcpTools } = await mcpClient.listTools();

  // Convert MCP tool format → Anthropic tool format
  const anthropicTools: Anthropic.Tool[] = mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    input_schema: (tool.inputSchema as Anthropic.Tool["input_schema"]) ?? {
      type: "object",
      properties: {},
    },
  }));

  // ── Step 3: Send to Claude with tools attached ─────────
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const toolsUsed: string[] = [];

  // ── Step 4: Agentic loop — keep going until Claude stops ─
  // Claude may call tools multiple times before giving final answer
  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a helpful store assistant. You have access to tools to search products, get details, place orders, and list orders.
Always use tools to answer product questions — don't guess. Be friendly and concise.`,
      messages,
      tools: anthropicTools,
    });

    // Add Claude's response to message history
    messages.push({ role: "assistant", content: response.content });

    // If Claude is done — return the final text
    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("\n");
      await mcpClient.close();
      return { reply: text, toolsUsed };
    }

    // If Claude wants to call tools — execute them via MCP
    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        toolsUsed.push(block.name);

        // ── Forward tool call to MCP server ─────────────
        // This is where MCP client talks to MCP server
        const result = await mcpClient.callTool({
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: (result.content as { type: string; text?: string }[])
            .filter((c: { type: string }) => c.type === "text")
            .map((c: { type: string; text?: string }) => ({
              type: "text" as const,
              text: c.text ?? "",
            })),
        });
      }

      // Send tool results back to Claude for next iteration
      messages.push({ role: "user", content: toolResults });
    }
  }
}

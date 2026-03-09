# MCP Demo — Store Assistant

### React + Node.js + TypeScript + MCP + Claude

A minimal but complete example of an MCP Server + MCP Client
built to match your existing React/Node/TS stack.

---

## Project Structure

```
mcp-demo/
├── server/                   ← Node.js Express backend
│   ├── src/
│   │   ├── index.ts          ← Express app + all routes
│   │   ├── mcpServer.ts      ← MCP SERVER (exposes tools)
│   │   └── mcpClient.ts      ← MCP CLIENT (connects to server + Claude)
│   ├── package.json
│   └── tsconfig.json
│
└── client/                   ← React frontend (Vite)
    └── src/
        └── App.tsx           ← Chat UI + tool sidebar
```

---

## What Each File Teaches You

### `mcpServer.ts` — The MCP Server

- How to create an `McpServer` with `@modelcontextprotocol/sdk`
- How to define tools using `server.tool(name, description, schema, handler)`
- How Zod schemas define what arguments a tool accepts
- How `StreamableHTTPServerTransport` connects it to Express (modern transport)
- Why each request gets its own transport instance (stateless pattern)

### `mcpClient.ts` — The MCP Client

- How to create a `Client` and connect to an MCP server via HTTP
- How `client.listTools()` discovers tools automatically
- How to convert MCP tools → Anthropic SDK tool format
- The **agentic loop**: keep calling Claude until `stop_reason === "end_turn"`
- How to detect `tool_use` blocks in Claude's response
- How to call `client.callTool()` and send results back to Claude

### `index.ts` — Express Routes

- `POST /mcp` → The MCP server endpoint (tools live here)
- `POST /chat` → The MCP client + Claude bridge (your React app calls this)
- `GET  /tools` → Lists available tools (used by React sidebar)

---

## Setup & Running

### 1. Server setup

```bash
cd server
npm install
```

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Run in dev mode:

```bash
npm run dev
```

Server starts at `http://localhost:3001`

---

### 2. Client setup

```bash
cd client
npm create vite@latest . -- --template react-ts   # if starting fresh
npm install
npm run dev
```

React app starts at `http://localhost:5173`

---

## Key Concepts Demonstrated

### MCP Server Tools (in mcpServer.ts)

| Tool            | What it does                          |
| --------------- | ------------------------------------- |
| search_products | Search by name/category, filter stock |
| get_product     | Get full details by product ID        |
| place_order     | Place order with stock validation     |
| list_orders     | Show all orders this session          |

### The Agentic Loop (in mcpClient.ts)

```
User message
    ↓
Claude (with tools attached)
    ↓
Claude returns tool_use? → call MCP server tool → send result back
    ↓
Repeat until stop_reason === "end_turn"
    ↓
Return final text to user
```

### Transport: Streamable HTTP

- Old way (deprecated): SSE with 2 endpoints (/sse + /messages)
- New way (2025): Single POST /mcp endpoint — stateless, scalable
- Each request is independent — works behind load balancers

---

## Try These Prompts

- "Show me all electronics in stock"
- "I want to order 2 keyboards for John Smith"
- "What's the cheapest product available?"
- "List all orders placed today"
- "Get details for product ID 4"

Watch the tool pills appear under each AI response to see
which MCP tools Claude decided to call.

---

## Extending This App

### Add a new tool (in mcpServer.ts)

```typescript
server.tool(
  "get_discount",
  "Get discount for a product category",
  { category: z.string() },
  async ({ category }) => {
    // your logic here
    return { content: [{ type: "text", text: `10% off ${category}` }] };
  },
);
```

That's it. Claude will automatically discover and use it.

### Connect to a real database

Replace the `PRODUCTS` array with actual DB queries:

```typescript
import { db } from "../db"; // your existing db connection
const results = await db.query("SELECT * FROM products WHERE name ILIKE $1", [
  `%${query}%`,
]);
```

### Add authentication

Pass headers from the MCP client:

```typescript
const transport = new StreamableHTTPClientTransport(url, {
  requestInit: { headers: { Authorization: `Bearer ${token}` } },
});
```

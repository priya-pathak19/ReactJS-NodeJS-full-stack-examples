# AI Full Stack Examples

A collection of full-stack examples built with **React + Node.js + TypeScript**, each demonstrating a different real-world AI/automation pattern. Each example is self-contained and can be run independently.

---

## Examples

### 1. Approval Workflow — `Temporal.io + SendGrid + Slack`

A human-in-the-loop approval system built on durable workflows.

**How it works:**

1. User clicks **"Request Approval"** in the React UI
2. Node.js triggers a **Temporal.io workflow** — this keeps the workflow alive even if the server restarts
3. Temporal sends an **email via SendGrid** containing an "Approve" button
4. Clicking the button posts a message to **Slack** for final sign-off
5. Once approved in Slack, the Temporal workflow receives the signal and completes

**What you learn:**

- Durable workflows with Temporal.io (workflows that survive crashes)
- Sending transactional email via SendGrid API
- Posting interactive messages to Slack via Slack API
- Human-in-the-loop patterns — pausing a workflow until a human acts
- Signal-based workflow completion

**Tech stack:** React · Node.js · Temporal.io · SendGrid · Slack API

---

### 2. Ask LLM — `Ollama + RAG + Local Documents`

A local, fully offline document Q&A system using a small language model.

**How it works:**

1. Local documents (PDFs, text files) are loaded from the app's `/docs` folder at startup
2. Documents are split into chunks and converted into **vector embeddings** (numbers the model understands) using an embedding model
3. Embeddings are stored in a local vector store
4. User types a question in the React UI
5. The question is embedded and matched against stored document vectors — closest chunks are retrieved (**RAG — Retrieval Augmented Generation**)
6. Retrieved context + question are passed to **Ollama running Phi-3** locally
7. Phi-3 answers based only on what's in your documents

**What you learn:**

- Running LLMs locally with Ollama (no API key, no cost, no data leaves your machine)
- What embeddings are and why they're used (converting text → numbers for semantic search)
- The full RAG pipeline: chunk → embed → store → retrieve → generate
- Grounding an LLM in your own documents instead of its training data

**Tech stack:** React · Node.js · Ollama · Phi-3 · RAG · Vector Embeddings

---

### 3. AppForge — `Claude AI Agents + Subagents`

An AI-powered app generator that writes full-stack applications from a single prompt.

**How it works:**

1. User describes the app they want in the React UI (e.g. "a todo app with a Node.js API")
2. An **Orchestrator Agent** (Claude) breaks the request into tasks and delegates to specialized subagents
3. Subagents handle their domain:
   - **Backend Agent** — generates Node.js/Express API code
   - **Frontend Agent** — generates React components and pages (skipped if backend-only is requested)
   - **Review Agent** — validates the generated code for consistency
4. Claude assembles the final output and also **suggests future improvements** based on what was generated

**What you learn:**

- Building multi-agent systems with orchestrator + worker pattern
- How to conditionally skip agents based on user intent (e.g. backend-only mode)
- Prompt chaining — output of one agent becomes input to the next
- How to generate structured code output from Claude
- Having Claude reason about its own output to suggest next steps

**Tech stack:** React · Node.js · Claude API · Agents · Subagents · Prompt Chaining

---

### 4. MCP Store — `Model Context Protocol (Anthropic)`

A full-stack implementation of Anthropic's Model Context Protocol — Claude connected to a live data source via MCP tools.

**How it works:**

1. An **MCP Server** (Node.js) exposes tools backed by a hardcoded in-memory product database
2. An **MCP Client** (also Node.js) connects to the server, auto-discovers its tools, and bridges them to Claude
3. User asks anything in the React chat UI — "show me electronics in stock", "order 2 keyboards for John"
4. Claude decides which MCP tools to call, the client forwards those calls to the MCP server, and results come back to Claude
5. Claude composes a final answer using the real data returned by the tools

**Available MCP Tools:**
| Tool | What it does |
|---|---|
| `search_products` | Search by name or category, filter by stock |
| `get_product` | Get full details for a product by ID |
| `place_order` | Place an order with stock validation |
| `list_orders` | Show all orders placed this session |

**What you learn:**

- What MCP is and why it exists (universal plug standard for AI ↔ tools)
- Building an MCP Server with `@modelcontextprotocol/sdk` and `registerTool()`
- Building an MCP Client that auto-discovers tools via `listTools()`
- The agentic loop — Claude calls tools in a loop until it has a complete answer
- Using Streamable HTTP transport (the modern 2025 MCP transport)
- How tool calls flow: React → Node.js → Claude → MCP Server → Claude → React

**Tech stack:** React · Node.js · TypeScript · Claude API · MCP SDK · Zod

---

## Project Structure

```
/
├── client/                  # React frontend (Vite + TypeScript)
│   └── src/
│       ├── pages/
│       │   ├── Approval.tsx
│       │   ├── AskLLM.tsx
│       │   ├── AppForge.tsx
│       │   └── McpChat.tsx
│       └── App.tsx
│
└── server/                  # Node.js backend (Express + TypeScript)
    └── src/
        ├── app.ts           # Express entry point
        ├── routes/
        │   ├── workflowRoutes.ts
        │   ├── ragRoutes.ts
        │   └── agentRoutes.ts
        └── mcp/
            ├── mcpServer.ts
            └── mcpClient.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Ollama installed locally (for the Ask LLM example)
- API keys: Anthropic, SendGrid, Slack (for their respective examples)

### Install & Run

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Add environment variables
cp server/.env.example server/.env
# Fill in your API keys

# Start backend
cd server && npm run dev     # runs on http://localhost:3000

# Start frontend
cd client && npm run dev     # runs on http://localhost:5173
```

### Environment Variables

```env
# Anthropic (AppForge + MCP)
ANTHROPIC_API_KEY=sk-ant-...

# SendGrid (Approval Workflow)
SENDGRID_API_KEY=SG....
FROM_EMAIL=you@yourdomain.com

# Slack (Approval Workflow)
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...

# Temporal (Approval Workflow)
TEMPORAL_ADDRESS=localhost:7233
```

---

## Concepts at a Glance

| Concept           | Used In              | What It Means                                       |
| ----------------- | -------------------- | --------------------------------------------------- |
| Durable Workflows | Approval             | Workflows that survive server restarts              |
| RAG               | Ask LLM              | Grounding AI answers in your own documents          |
| Embeddings        | Ask LLM              | Converting text into numbers for semantic search    |
| Local LLM         | Ask LLM              | Running AI models on your own machine               |
| Agents            | AppForge             | Claude that takes actions, not just answers         |
| Subagents         | AppForge             | Specialized Claudes delegating from an orchestrator |
| MCP Server        | MCP Store            | A program that exposes tools to any AI              |
| MCP Client        | MCP Store            | The bridge connecting an AI to MCP servers          |
| Tool Use          | MCP Store + AppForge | Claude calling your functions to get real data      |
| Agentic Loop      | MCP Store + AppForge | Claude calling tools repeatedly until task is done  |

# Salesforce → Node.js → Slack Integration

This guide explains how to trigger a **Slack notification when a Salesforce Case is created** using:

- **Salesforce Flow**
- **HTTP Callout**
- **Node.js Express webhook**
- **Slack API**

Architecture:

Salesforce Case Created
↓
Record Triggered Flow
↓
HTTP Callout
↓
Node.js Express
↓
Slack API
↓
Slack Channel Notification

---

# Prerequisites

You should already have:

- Salesforce **Developer Edition**
- **Node.js Express server**
- **Slack App with Bot Token**
- Slack App added to your **channel**
- **ngrok running** to expose your local server

Example ngrok URL:

https://foreknowingly-dedicational-shonta.ngrok-free.dev

---

# 1. Create External Credential

Purpose: Allow Salesforce to access external APIs.

Go to:

Setup → External Credentials → New

Create:

| Field                   | Value               |
| ----------------------- | ------------------- |
| Label                   | NodeWebhookExternal |
| Name                    | NodeWebhookExternal |
| Authentication Protocol | No Authentication   |

Save.

---

# 2. Create Principal

Open:

External Credentials → NodeWebhookExternal

Add Principal:

| Field                   | Value             |
| ----------------------- | ----------------- |
| Parameter Name          | NodePrincipal     |
| Identity Type           | Named Principal   |
| Authentication Protocol | No Authentication |

Save.

---

# 3. Create Permission Set

Purpose: Allow users to use the external credential.

Setup → Permission Sets → New

Create:

| Field    | Value             |
| -------- | ----------------- |
| Label    | NodeWebhookAccess |
| API Name | NodeWebhookAccess |

Save.

---

# 4. Grant External Credential Access

Open the permission set.

Search for:

External Credential Principal Access

Add:

NodeWebhookExternal → NodePrincipal

Save.

---

# 5. Assign Permission Set to User

Inside the permission set:

Manage Assignments → Add Assignment

Assign to your user.

---

# 6. Create Named Credential

Purpose: Store the API base URL.

Setup → Named Credentials → New

Fill:

| Field               | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| Label               | NodeWebhook                                              |
| Name                | NodeWebhook                                              |
| URL                 | https://foreknowingly-dedicational-shonta.ngrok-free.dev |
| External Credential | NodeWebhookExternal                                      |

Save.

---

# 7. Create HTTP Callout

Setup → HTTP Callouts → New

Configure:

| Field            | Value                    |
| ---------------- | ------------------------ |
| Name             | CaseSlackNotification    |
| Named Credential | NodeWebhook              |
| Method           | POST                     |
| Path             | /salesforce/case-created |

---

# 8. Sample JSON Request

Paste:

```json
{
  "caseNumber": "00001001",
  "subject": "Login Issue",
  "priority": "High",
  "description": "User cannot login"
}
```

# 9. Sample JSON Response

Choose:

Use Example Response

Paste:

{
"success": true
}

Save.

# 10. Create Flow

Go to:

Setup → Flows → New Flow

Select:

Record Triggered Flow

Configure:

Field Value
Object Case
Trigger Record Created
Optimize Actions and Related Records

# 11. Add Asynchronous Path

In the Start element:

Add Asynchronous Path

HTTP callouts must run asynchronously.

# 12. Create Assignment

Purpose: populate request body.

Add element:

Assignment → Set Request Body

Set values:

requestBody.caseNumber = $Record.CaseNumber
requestBody.subject = $Record.Subject
requestBody.priority = $Record.Priority
requestBody.description = $Record.Description

# 13. Add HTTP Callout Action

Under Run Asynchronously:

Action → CaseSlackNotification

Set:

body = requestBody

# 14. Save and Activate Flow

Save
Activate

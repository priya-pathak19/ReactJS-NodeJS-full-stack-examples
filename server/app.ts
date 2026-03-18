import workflowRoutes from "./routes/workflowRoutes";
import cors from "cors";
import "dotenv/config";
import askRoute from "./routes/ragRoutes";
import { bootstrapRAG } from "./rag/bootstrapRag";
import agentRoutes from "./routes/agentRoutes";
import { handleMcpRequest } from "./mcp/mcpServer";
import { runMcpChat } from "./mcp/mcpClient";
import { WebClient } from "@slack/web-api";

const express = require("express");
// const morgan = require("morgan");

const mongoose = require("mongoose");
// const blogRoutes = require("./routes/blogRoutes");

// express app
// const app = express();

// connect to mongodb & listen for requests
// const dbURI =
//   "mongodb+srv://priya-19:123456priya@cluster0.nh0urni.mongodb.net/?appName=Cluster0";

// mongoose
//   .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then((result) => app.listen(3000))
//   .catch((err) => console.log(err));

// ----register view engine----
// app.set("view engine", "ejs");

// middleware & static files
// app.use(express.static("public"));
// app.use(express.urlencoded({ extended: true }));

// app.use(morgan("dev"));

// // routes
// app.get("/", (req, res) => {
//   res.redirect("/blogs");
// });

// app.get("/about", (req, res) => {
//   res.render("about", { title: "About" });
// });

// // blog routes
// app.use("/blogs", blogRoutes);

// // 404 page
// app.use((req, res) => {
//   res.status(404).render("404", { title: "404" });
// });

// -----Full stack with react api routes-----

// const dbURI =
//   "mongodb+srv://priya-19:123456priya@cluster0.nh0urni.mongodb.net/?appName=Cluster0";

// mongoose
//   .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then((result) => app.listen(3000))
//   .catch((err) => console.log(err));

const app = express();

async function startServer() {
  // Bootstrap RAG BEFORE accepting requests
  await bootstrapRAG();

  app.use(
    cors({
      origin: "http://localhost:5173",
    }),
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ strict: false }));

  // Slack Bot Token
  const slackToken = process.env.SLACK_BOT_TOKEN;

  // Slack channel id
  const channelId = "C0ALSTZQPQS";

  const slackClient = new WebClient(slackToken);

  /**
   * Webhook endpoint called by Salesforce Flow
   */
  app.post("/salesforce/case-created", async (req, res) => {
    try {
      const payload = { ...req.query, ...req.body };

      console.log("Received Salesforce event:", payload);

      const {
        eventType,
        caseNumber,
        subject,
        priority,
        description,
        ownerEmail,
      } = payload;

      // CASE CREATED
      if (eventType === "CASE_CREATED") {
        await slackClient.chat.postMessage({
          channel: channelId,
          text: "New Salesforce Case Created",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*New Case Created*`,
              },
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `• *Case Number:*\n${caseNumber}`,
                },
                {
                  type: "mrkdwn",
                  text: `• *Priority:*\n${priority}`,
                },
                {
                  type: "mrkdwn",
                  text: `• *Subject:*\n${subject}`,
                },
              ],
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `• *Description:*\n${description}`,
              },
            },
            {
              type: "divider",
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Salesforce • Case Notification`,
                },
              ],
            },
          ],
        });
      }

      // CASE UPDATED (priority escalation)
      if (eventType === "CASE_UPDATED" && priority === "High" && ownerEmail) {
        const user = await slackClient.users.lookupByEmail({
          email: ownerEmail,
        });

        await slackClient.chat.postMessage({
          channel: user.user.id,
          text: `🔥 *High Priority Case Alert*\nCase ${caseNumber}: ${subject}`,
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Slack send error:", error);
      res.status(500).json({ error: "Slack message failed" });
    }
  });

  // Agent orchestration
  app.use("/api", agentRoutes);

  app.use("/api", askRoute);
  app.use("/api/workflow", workflowRoutes);

  app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend 👋" });
  });

  // ── MCP Server endpoint (tools live here) ──
  app.post("/mcp", async (req, res) => {
    try {
      await handleMcpRequest(req, res);
    } catch (err) {
      console.error("MCP error:", err);
      res.status(500).json({ error: "MCP server error" });
    }
  });

  // ── MCP Chat endpoint (React calls this) ──
  app.post("/api/mcp-chat", async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message?.trim())
      return res.status(400).json({ error: "Message required" });
    try {
      const result = await runMcpChat(message, history);
      res.json(result);
    } catch (err) {
      console.error("MCP chat error:", err);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

// 🚀 Start everything
startServer().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

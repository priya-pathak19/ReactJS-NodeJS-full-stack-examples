import workflowRoutes from "./routes/workflowRoutes";
import cors from "cors";
import "dotenv/config";
import askRoute from "./routes/ragRoutes";
import { bootstrapRAG } from "./rag/bootstrapRag";
import agentRoutes from "./routes/agentRoutes";
import { handleMcpRequest } from "./mcp/mcpServer";
import { runMcpChat } from "./mcp/mcpClient";
import { WebClient } from "@slack/web-api";
import session from "express-session";

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
      credentials: true,
    }),
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ strict: false }));

  // app.set("trust proxy", 1); // REQUIRED for ngrok  // for slack

  app.use(
    session({
      secret: "super-secret",
      resave: false,
      saveUninitialized: false,
      // proxy: true, // for slack
      cookie: {
        secure: false, // true only in HTTPS
        httpOnly: true,
        sameSite: "lax",
        // sameSite: "none", // for slack
        // secure: true, // for slack //cookie is dropped after redirect
      },
    }),
  );

  // Slack Bot Token
  const slackToken = process.env.SLACK_BOT_TOKEN;

  // Slack channel id
  const channelId = "C0ALSTZQPQS";

  const slackClient = new WebClient(slackToken);
  /**
   * Slack authentication
   */
  app.get("/auth/slack", (req, res) => {
    console.log("REDIRECT URI SENT:", process.env.SLACK_REDIRECT_URI);
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      user_scope: "users:read users:read.email",
      redirect_uri: process.env.SLACK_REDIRECT_URI,
    });

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?${params}`;

    res.redirect(slackAuthUrl);
  });

  app.get("/auth/slack/callback", async (req, res) => {
    const code = req.query.code;

    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await fetch(
        "https://slack.com/api/oauth.v2.access",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET,
            redirect_uri: process.env.SLACK_REDIRECT_URI,
          }),
        },
      );

      const tokenData = await tokenResponse.json();

      console.log("SLACK TOKEN RESPONSE:", tokenData);

      const accessToken = tokenData?.authed_user?.access_token;
      const userId = tokenData?.authed_user?.id;

      if (!accessToken || !userId) {
        return res.send("Slack Auth failed");
      }

      // Step 2: Fetch user info (correct API)
      const userResponse = await fetch(
        `https://slack.com/api/users.info?user=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const userData = await userResponse.json();
      const user = userData.user;

      console.log("SLACK USER:", user);

      // ✅ Step 3: Save in session (SAME AS OUTLOOK)
      req.session.user = {
        name: user.real_name,
        email: user.profile?.email,
        provider: "slack",
      };

      // ✅ Step 4: Redirect WITHOUT query params
      req.session.save(() => {
        res.redirect("http://localhost:5173");
      });
    } catch (err) {
      console.error(err);
      res.send("Slack Auth failed");
    }
  });

  /**
   * Outlook authentication
   */

  // Step 1: User clicks "Login with Outlook"
  // This API redirects user to Microsoft login page

  app.get("/auth/outlook", (req, res) => {
    // These are the parameters required by Microsoft OAuth
    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID, // your app ID
      response_type: "code", // we want an auth "code" back
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI, // where Microsoft will send user back
      response_mode: "query", // code will come in query params
      scope: "openid profile email User.Read", // permissions we are asking for
    });
    // Microsoft login URL with all params
    const authUrl = `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT}/oauth2/v2.0/authorize?${params}`;
    // Redirect user to Microsoft login page
    res.redirect(authUrl);
  });

  // Step 2: Microsoft redirects back to this API after login : which was set in app registration
  app.get("/auth/outlook/callback", async (req, res) => {
    // Get the "code" sent by Microsoft
    const code = req.query.code;

    try {
      // Step 3: Exchange "code" for access token
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.OUTLOOK_CLIENT_ID,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET,
            code,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
            grant_type: "authorization_code",
          }),
        },
      );
      const tokenData = await tokenResponse.json();
      // Step 4: Use access token to get user details from Microsoft Graph
      const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`, // send token here
        },
      });

      const user = await userResponse.json();

      console.log("GRAPH USER:", user);

      // Step 5: Save user info in session (stored on backend)
      req.session.user = {
        name: user.displayName,
        email: user.mail || user.userPrincipalName, // fallback if mail is null
        provider: "outlook",
      };
      // Step 6: Save session and redirect back to frontend
      req.session.save(() => {
        res.redirect("http://localhost:5173");
      });
    } catch (err) {
      console.error(err);
      res.send("Auth failed");
    }
  });
  // Step 7: Frontend calls this API to get logged-in user
  app.get("/me", (req, res) => {
    console.log("SESSION IN /me:", req.session);
    if (!req.session.user) {
      // If no user in session → not logged in
      return res.status(401).json({ error: "Not logged in" });
    }
    // If logged in → return user data
    res.json(req.session.user);
  });

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

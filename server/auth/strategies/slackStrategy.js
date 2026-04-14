import axios from "axios";
import "dotenv/config";

export class SlackStrategy {
  login(req, res) {
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      user_scope: "users:read users:read.email",
      redirect_uri: process.env.SLACK_REDIRECT_URI,
    });

    const url = `https://slack.com/oauth/v2/authorize?${params}`;
    res.redirect(url);
  }

  async callback(req) {
    const code = req.query.code;

    // Step 1: exchange code
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
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
    });

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData?.authed_user?.access_token;
    const userId = tokenData?.authed_user?.id;

    if (!accessToken || !userId) {
      throw new Error("Slack Auth failed");
    }

    // Step 2: fetch user
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

    // Step 3: normalize
    return {
      id: user.id,
      name: user.real_name,
      email: user.profile?.email,
      provider: "slack",
    };
  }
}

import axios from "axios";

export class MicrosoftStrategy {
  login(req, res) {
    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID,
      response_type: "code",
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
      response_mode: "query",
      scope: "openid profile email User.Read",
    });

    const authUrl = `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT}/oauth2/v2.0/authorize?${params}`;

    res.redirect(authUrl);
  }

  async callback(req) {
    const code = req.query.code;

    try {
      // Step 1: exchange code → token
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET,
          code,
          redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokenData = tokenResponse.data;

      // Step 2: fetch user
      const userResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        },
      );

      const user = userResponse.data;

      console.log("GRAPH USER:", user);

      // ✅ RETURN instead of setting session here
      return {
        name: user.displayName,
        email: user.mail || user.userPrincipalName,
        provider: "microsoft",

        // keep tokens (important for later)
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      };
    } catch (err) {
      console.error("Microsoft auth error:", err.response?.data || err.message);
      throw new Error("Microsoft authentication failed");
    }
  }
}

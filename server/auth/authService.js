import { getStrategy } from "./strategyFactory.js";

export const authService = {
  // 🔐 STEP 1: Start login flow
  login(provider, req, res) {
    // 👉 Get the correct strategy (Slack / Microsoft)
    const strategy = getStrategy(provider);

    // 👉 Call that provider's login function
    // This usually redirects user to OAuth provider login page
    return strategy.login(req, res);
  },

  // 🔁 STEP 2: Handle callback after login
  async callback(provider, req, res) {
    // 👉 Again pick correct strategy based on provider
    const strategy = getStrategy(provider);

    // 👉 Let strategy handle:
    // - exchange code → token
    // - fetch user info
    const user = await strategy.callback(req);

    // ✅ COMMON LOGIC (THIS is why authService exists)
    // Instead of putting this inside each strategy,
    // we centralize shared behavior here

    // 👉 Store user in session (backend memory / store)
    req.session.user = {
      name: user.name,
      email: user.email,
      provider: user.provider,
    };

    // 👉 Save session before responding
    // (important for persistence across requests)
    return new Promise((resolve) => {
      req.session.save(() => {
        resolve(user);
      });
    });
  },
};

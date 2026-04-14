import { SlackStrategy } from "./strategies/slackStrategy.js";
import { MicrosoftStrategy } from "./strategies/microsoftStrategy.js";

// Initialize once (important) , takes in note for providers
const strategies = {
  slack: new SlackStrategy(),
  microsoft: new MicrosoftStrategy(),
  outlook: new MicrosoftStrategy(),
};

export function getStrategy(provider) {
  const strategy = strategies[provider];

  if (!strategy) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return strategy;
}

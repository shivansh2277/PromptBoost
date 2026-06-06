"use strict";

(function attachPromptBoostIntentGraph(globalScope) {
  function create(parts) {
    const primaryIntent = parts.primaryIntent || "unknown";
    const secondaryIntents = parts.secondaryIntents || [];

    return {
      primaryIntent,
      secondaryIntents,
      subject: parts.subject || "",
      platform: parts.platform || "",
      emotionalSignals: parts.emotionalSignals || [],
      languageSignals: parts.languageSignals || [],
      styleSignals: parts.styleSignals || [],
      metaTask: parts.metaTask || "",
      chain: parts.chain || { hasChain: false, steps: [] },
      route: parts.route || primaryIntent,
      confidence: parts.confidence || 70
    };
  }

  globalScope.PromptBoostIntentGraph = {
    create
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

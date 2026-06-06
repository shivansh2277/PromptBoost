"use strict";

(function attachPromptBoostEmotionDetector(globalScope) {
  function detect(input) {
    const text = String(input || "").toLowerCase();
    const signals = [];

    addIf(signals, text, "furious", /\bfurious\b/);
    addIf(signals, text, "angry", /\bangry\b/);
    addIf(signals, text, "upset", /\bupset\b/);
    addIf(signals, text, "disappointed", /\bdisappointed\b/);
    addIf(signals, text, "frustrated", /\bfrustrated\b/);
    addIf(signals, text, "excited", /\bexcited\b/);
    addIf(signals, text, "celebrating", /\bcelebrating|celebrate\b/);
    addIf(signals, text, "apologizing", /\bapologize|apology|sorry\b/);

    const deEscalation = signals.some((signal) => ["furious", "angry", "upset", "disappointed", "frustrated"].includes(signal));

    return {
      hasEmotion: signals.length > 0,
      signals,
      route: deEscalation ? "de_escalation_response" : signals.length ? "emotion_aware_writing" : ""
    };
  }

  function addIf(signals, text, label, regex) {
    if (regex.test(text)) {
      signals.push(label);
    }
  }

  globalScope.PromptBoostEmotionDetector = {
    detect
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

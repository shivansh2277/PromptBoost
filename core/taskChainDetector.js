"use strict";

(function attachPromptBoostTaskChainDetector(globalScope) {
  const SPLIT_PATTERN = /\b(and then|then|after that|followed by|next)\b/i;

  function detect(input) {
    const text = String(input || "").trim();

    if (!SPLIT_PATTERN.test(text) && !/\bfirst\b.+\bnext\b/i.test(text)) {
      return { hasChain: false, steps: [] };
    }

    const normalized = text.replace(/\bfirst\b/gi, "").replace(/\bnext\b/gi, "then");
    const parts = normalized.split(SPLIT_PATTERN).filter((part) => !SPLIT_PATTERN.test(part)).map(cleanStep).filter(Boolean);
    const steps = parts.map((part, index) => ({
      index: index + 1,
      text: part,
      taskType: detectStepTask(part),
      subject: extractStepSubject(part)
    }));

    return {
      hasChain: steps.length > 1,
      steps
    };
  }

  function cleanStep(step) {
    return String(step || "")
      .replace(/^\s*(and|,)\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectStepTask(step) {
    const lower = step.toLowerCase();
    if (/\bsummarize|summary\b/.test(lower)) return "summary";
    if (/\blinkedin\b/.test(lower)) return "linkedin_post";
    if (/\binstagram|caption\b/.test(lower)) return "instagram_caption";
    if (/\bemail\b/.test(lower)) return "email";
    if (/\bexplain\b/.test(lower)) return "explanation";
    return "task";
  }

  function extractStepSubject(step) {
    return String(step || "")
      .replace(/^(summarize|write|create|generate|make|draft|explain)\s+/i, "")
      .replace(/\blinkedin\s+post\b/i, "")
      .replace(/\s+/g, " ")
      .trim() || "the previous result";
  }

  globalScope.PromptBoostTaskChainDetector = {
    detect
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

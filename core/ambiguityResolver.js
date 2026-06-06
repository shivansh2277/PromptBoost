"use strict";

(function attachPromptBoostAmbiguityResolver(globalScope) {
  function resolveAmbiguity(normalized, context, taskType, metadata, confidence = {}) {
    const text = normalized.lower;

    if (!confidence.isAmbiguous && confidence.level !== "low") {
      return { handled: false, prompt: "" };
    }

    if (/^post$/i.test(text)) {
      return {
        handled: true,
        prompt: "Write a compelling social media post. Since no platform was specified, provide versions suitable for LinkedIn, Instagram, and Twitter/X. Include a hook, core message, and CTA."
      };
    }

    if (/^help$/i.test(text)) {
      return {
        handled: true,
        prompt: "Help with this task clearly and effectively. Organize the response logically, include practical guidance, and keep the explanation concise and actionable."
      };
    }

    if (/^review$/i.test(text)) {
      return {
        handled: true,
        prompt: "Create a clear review based on the details provided. Keep it specific, balanced, useful, and include practical reasoning or next steps."
      };
    }

    if (/^explain$/i.test(text)) {
      return {
        handled: true,
        prompt: "Explain the topic clearly once it is provided. Use simple language, examples, and a short recap."
      };
    }

    if (/^optimize$/i.test(text)) {
      return {
        handled: true,
        prompt: "Optimize the item or process once details are provided. Identify bottlenecks, suggest practical improvements, and explain tradeoffs clearly."
      };
    }

    if (/^(write|create|make|generate)$/i.test(text)) {
      return {
        handled: true,
        prompt: "Create the requested content once the topic is provided. Keep it clear, audience-aware, well structured, and practical."
      };
    }

    if (/^(fix|debug)$/i.test(text)) {
      return {
        handled: true,
        prompt: "Fix the issue once the details are provided. Identify the root cause, explain the correction briefly, and mention any important edge cases."
      };
    }

    return {
      handled: false,
      prompt: ""
    };
  }

  globalScope.PromptBoostAmbiguityResolver = {
    resolveAmbiguity
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

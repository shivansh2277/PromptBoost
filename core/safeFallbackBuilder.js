"use strict";

(function attachPromptBoostSafeFallbackBuilder(globalScope) {
  function buildFallback({ normalized, context, taskType, metadata }) {
    const text = normalized.text;

    if (/negative\s+review|bad\s+review|angry\s+customer|complaint/i.test(text)) {
      return "Write a professional and thoughtful response to a negative review. Keep the tone calm, empathetic, and solution-oriented. Acknowledge the concern, offer a helpful next step, and avoid sounding defensive.";
    }

    if (/^write\s+ad$/i.test(text)) {
      return "Write persuasive ad copy for a product or service. Include:\n- strong opening hook\n- clear benefits\n- concise CTA\n- audience-aware tone\n\nProvide 3 variations.";
    }

    if (/^optimize$/i.test(text)) {
      return "Optimize the item or process once details are provided. Identify bottlenecks, suggest practical improvements, and explain tradeoffs clearly.";
    }

    const subject = globalScope.PromptBoostNormalizer.extractSubject(text, context, taskType || "general", metadata);

    if (!subject || subject === "the request") {
      return "Help with this task clearly and effectively. Organize the response logically, include practical guidance, and keep the explanation concise and actionable.";
    }

    return `Help with ${subject}. Preserve the original goal, organize the response logically, include practical guidance, and keep it concise and actionable.`;
  }

  function buildBlended({ normalized, context, taskType, metadata }) {
    if (/negative\s+review|bad\s+review|complaint/i.test(normalized.text)) {
      return buildFallback({ normalized, context, metadata });
    }

    if (context === "marketing" && taskType === "general_marketing") {
      return "Create concise, audience-aware marketing content for the request. Include a clear hook, key message, benefit-focused wording, and a practical CTA. Provide 2-3 variations if useful.";
    }

    return globalScope.PromptBoostPromptBuilder.buildPrompt({ normalized, context, taskType, metadata });
  }

  globalScope.PromptBoostSafeFallbackBuilder = {
    buildBlended,
    buildFallback
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

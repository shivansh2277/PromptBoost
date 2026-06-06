"use strict";

(function attachPromptBoostSemanticValidator(globalScope) {
  function validateRoute({ normalized, context, taskType, metadata }) {
    if (metadata.negativeReviewIntent && context === "marketing") {
      return {
        ok: false,
        context: "writing",
        taskType: "review_response",
        reason: "negative-review-is-not-ad-copy"
      };
    }

    if (metadata.depth === "deep" && taskType === "beginner_learning") {
      return {
        ok: true,
        context: "study",
        taskType: "conceptual_breakdown",
        reason: "deep-learning-priority"
      };
    }

    return {
      ok: true,
      context,
      taskType,
      reason: "valid"
    };
  }

  function validateAndRepair(prompt, source) {
    const sourceText = typeof source === "string" ? source : source && source.text ? source.text : "";
    const semantic = typeof source === "object" && source ? source : {};
    let repaired = String(prompt || "")
      .replace(/\b(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan)\s+\1\b/gi, "$1")
      .replace(/\b(\w+)\s+\1\b/gi, "$1")
      .replace(/\babout\s+about\b/gi, "about")
      .replace(/\bfor\s+for\b/gi, "for")
      .replace(/\bto\s+to\b/gi, "to")
      .replace(/\bpost about a post\b/gi, "post")
      .replace(/\bpost about post\b/gi, "post")
      .replace(/\blinkedin post about linkedin post\b/gi, "LinkedIn post")
      .replace(/\bemail about email\b/gi, "email")
      .replace(/\bemail about an email\b/gi, "email")
      .replace(/\bformal casual email about a formal casual email\b/gi, "professional but natural email")
      .replace(/\bnegative review about a negative review\b/gi, "negative review")
      .replace(/\bnegative review about ad for negative review\b/gi, "negative review")
      .replace(/\bad copy for ad\b/gi, "ad copy for a product or service")
      .replace(/\bdeeply beginner-friendly\b/gi, "clear and appropriately detailed")
      .replace(/\bdeeply for beginners\b/gi, "thorough but beginner-friendly")
      .replace(/\bquickly in detail\b/gi, "concise but complete")
      .replace(/\bformal casual\b/gi, "professional but natural")
      .replace(/\boptimize website faster\b/gi, "optimize the website for better performance")
      .replace(/\boptimize faster\b/gi, "optimize for better performance")
      .replace(/\bhelp with explain\b/gi, "explain")
      .replace(/\bcaption for a thing for\b/gi, "caption for")
      .replace(/\bcaption for (a|an|the)\b/gi, "caption")
      .replace(/\bpost for (a|an|the)\b/gi, "post")
      .replace(/\bemail (a|an|the) to\b/gi, "email to")
      .replace(/\bblog post about for\b/gi, "blog post")
      .replace(/\bfor a thing for\b/gi, "for")
      .replace(/\bfor\s+(a|an|the)(\.|\n|$)/gi, "$2")
      .replace(/\babout\s+(a|an|the)(\.|\n|$)/gi, "$2")
      .replace(/\bsomething for\b/gi, "")
      .replace(/\bsomething about\b/gi, "")
      .replace(/\s+\./g, ".")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (/negative\s+review|bad\s+review|complaint/i.test(sourceText) && /ad copy|persuasive ad/i.test(repaired)) {
      repaired = "Write a calm, professional response to a negative review. Acknowledge the concern, show empathy, avoid defensiveness, offer a helpful next step, and keep the tone solution-oriented.";
    }

    repaired = repairWeakSubjectOutput(repaired, semantic);
    return validateOutput(repaired);
  }

  function repairWeakSubjectOutput(prompt, semantic) {
    if (!semantic || !semantic.taskType || !semantic.subjectQuality || semantic.subjectQuality.usable) {
      return prompt;
    }

    if (semantic.taskType === "instagram_caption" && /\b(caption|content)\s+for\s+(thing|something|a|an|the)\b/i.test(prompt)) {
      return applyRole(globalScope.PromptBoostFallbackRegistry.build({ taskType: "instagram_caption" }, semantic), semantic);
    }

    if (semantic.taskType === "blog_post" && /\babout\s+(thing|something|content|a|an|the)\b/i.test(prompt)) {
      return applyRole(globalScope.PromptBoostFallbackRegistry.build({ taskType: "blog_post" }, semantic), semantic);
    }

    return prompt;
  }

  function applyRole(prompt, semantic) {
    return globalScope.PromptBoostRoleRegistry
      ? globalScope.PromptBoostRoleRegistry.applyRole(prompt, semantic)
      : prompt;
  }

  function validateOutput(prompt) {
    return String(prompt || "")
      .replace(/\b(\w+)\s+\1\b/gi, "$1")
      .replace(/\b(for|about|to)\s+\1\b/gi, "$1")
      .replace(/\b(a|an|the)(\.|\n|$)/gi, "$2")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  globalScope.PromptBoostSemanticValidator = {
    validateOutput,
    validateRoute,
    validateAndRepair
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

"use strict";

(function attachPromptBoostNormalizer(globalScope) {
  const LEADING_FILLERS = /^(please\s+)?(can you|could you|help me|i need you to|can u|pls)\s+/i;
  const TASK_PREFIXES = /^(write|create|generate|make|draft|build|add|implement|explain|explanation|teach|fix|debug|solve|optimize|review|refactor|proofread|rewrite|rephrase|summarize|compare|analyze|research|give me|give)\s+/i;

  function normalizeInput(input) {
    const corrected = globalScope.PromptBoostTypoHandler.correctText(input);
    const text = corrected
      .replace(/\bc\s*\+\s*\+/gi, "c++")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    const lower = text.toLowerCase();
    const tokens = lower.replace(/[^a-z0-9+#.\s]/g, " ").split(/\s+/).filter(Boolean);

    return {
      raw: String(input || "").trim(),
      text,
      lower,
      tokens
    };
  }

  function cleanTaskPrefix(input) {
    return String(input || "")
      .replace(LEADING_FILLERS, "")
      .replace(TASK_PREFIXES, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractSubject(input, context, taskType, metadata = {}) {
    let subject = cleanTaskPrefix(input);

    subject = subject
      .replace(/\b(for exam|for exams|for test|for a test)\b/gi, "")
      .replace(/\b(for interview|for interviews|interview prep)\b/gi, "")
      .replace(/\b(something for|something about)\b/gi, "")
      .replace(/\b(something to|anything for|anything about)\b/gi, "")
      .replace(/\b(deeply|advanced|in depth|detailed|deep dive|beginner friendly|beginner-friendly|simple|quickly|quick|brief|summary|revision|recap)\b/gi, "")
      .replace(/\babout\s+about\b/gi, "about")
      .replace(/\bfor\s+for\b/gi, "for")
      .replace(/\bto\s+to\b/gi, "to")
      .replace(/\bfor\s+about\b/gi, "about")
      .replace(/\bpost\s+about\s+a\s+post\b/gi, "post")
      .replace(/\bemail\s+about\s+(an?\s+)?email\b/gi, "email")
      .replace(/\blinkedin\s+post\s+about\s+(a\s+)?linkedin\s+post\b/gi, "LinkedIn post")
      .trim()
      .replace(/^(about|for)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    subject = stripRepeatedHeadNoun(subject);

    if (context === "writing" && taskType === "linkedin_post") {
      subject = subject.replace(/^a?\s*linkedin\s+post\s+(about\s+)?/i, "").trim();
      return subject || "my project";
    }

    if (context === "writing" && taskType === "email") {
      subject = subject
        .replace(/^an?\s*email\s+/i, "")
        .replace(/^to\s+[^ ]+(\s+[^ ]+)?\s+about\s+/i, "")
        .replace(/^about\s+/i, "")
        .trim();
      return subject || "the main message";
    }

    if (context === "writing" && taskType === "review_response") {
      subject = subject
        .replace(/^(respond|reply)\s+to\s+(a\s+)?/i, "")
        .replace(/^negative\s+review$/i, "")
        .trim();
      return subject || "a negative review";
    }

    if (context === "marketing" && taskType === "social_caption") {
      subject = subject
        .replace(/\b(instagram|tiktok|youtube|social media)\b/gi, "")
        .replace(/\b(caption|post)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^for\s+/i, "")
        .trim();
      return subject || metadata.domain || "the post";
    }

    if (context === "marketing" && taskType === "ad_copy") {
      subject = subject.replace(/^(an?\s+)?(ad|advertisement|ad copy)(\s+for\s+)?/i, "").trim();
      return subject || "a product or service";
    }

    if (context === "marketing" && taskType === "hook_generation") {
      subject = subject.replace(/^(me\s+)?(hooks?|hook ideas)\s+(for\s+)?/i, "").trim();
      return subject || "the campaign";
    }

    if (context === "marketing" && taskType === "CTA_generation") {
      subject = subject.replace(/^(cta|call to action)\s+(for\s+)?/i, "").trim();
      return subject || "the offer";
    }

    if (context === "marketing" && taskType === "product_description") {
      subject = subject.replace(/^product\s+description\s+(for\s+)?/i, "").trim();
      return subject || "the product";
    }

    if (context === "coding" && taskType === "debugging") {
      if (metadata.language) {
        return `${metadata.languageLabel} code${metadata.domain ? ` for ${metadata.domain}` : ""}`;
      }
      return subject.replace(/^this\s+/i, "") || "the code";
    }

    if (context === "coding" && taskType === "feature_build") {
      subject = subject.replace(/^feature\s+(for\s+)?/i, "").trim();
      return subject || "the feature";
    }

    if (context === "coding" && taskType === "implementation") {
      subject = subject.replace(/^program\s+/i, "").trim();
      return subject || "the programming task";
    }

    if (context === "coding" && (taskType === "review" || taskType === "refactor")) {
      return subject.replace(/^this\s+/i, "") || "the code";
    }

    if (context === "research" && taskType === "pros_cons") {
      subject = subject.replace(/^(the\s+)?pros\s+and\s+cons\s+(of\s+)?/i, "").trim();
      return subject || "the topic";
    }

    return subject || metadata.topic || metadata.domain || "the request";
  }

  function stripRepeatedHeadNoun(subject) {
    const repeated = [
      ["post", /\bpost\s+about\s+(a\s+)?post\b/i],
      ["email", /\bemail\s+about\s+(an?\s+)?email\b/i],
      ["ad", /\bad\s+(copy\s+)?for\s+(an?\s+)?ad\b/i],
      ["caption", /\bcaption\s+for\s+(a\s+)?caption\b/i],
      ["review", /\breview\s+about\s+(a\s+)?review\b/i]
    ];

    let cleaned = subject;

    for (const [replacement, pattern] of repeated) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned.replace(/\s+/g, " ").trim();
  }

  globalScope.PromptBoostNormalizer = {
    cleanTaskPrefix,
    extractSubject,
    normalizeInput
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

"use strict";

(function attachPromptBoostMetadataExtractor(globalScope) {
  const LANGUAGE_LABELS = {
    python: "Python",
    javascript: "JavaScript",
    java: "Java",
    "c++": "C++",
    c: "C",
    sql: "SQL",
    html: "HTML",
    css: "CSS"
  };

  function extractMetadata(normalized, context, taskType) {
    const text = normalized.lower;
    const language = findLanguage(text);
    const platform = findFirst(text, ["linkedin", "instagram", "youtube", "tiktok", "twitter", "x"]);
    const framework = findFirst(text, ["react", "node", "express", "django", "flask", "next.js", "vue", "angular"]);
    const auth = findFirst(text, ["oauth", "jwt", "session", "magic link", "passwordless"]);
    const audience = findFirst(text, ["beginners", "developers", "customers", "students", "clients", "founders"]);
    const tone = findFirst(text, ["professional", "casual", "persuasive", "friendly", "formal", "conversational"]);
    const length = findFirst(text, ["short", "concise", "detailed", "brief", "long"]);
    const depth = extractDepth(text);
    const examIntent = /\b(exam|test|marks|common questions)\b/.test(text);
    const interviewIntent = /\b(interview|coding interview|technical interview|interview prep)\b/.test(text);
    const revisionIntent = /\b(revision|revise|quick recap)\b/.test(text);
    const negativeReviewIntent = /\b(negative review|bad review|complaint|angry customer|respond to .*review)\b/.test(text);
    const domain = inferDomain(text, context);

    const metadata = {
      audience,
      auth,
      domain,
      examIntent,
      framework,
      language,
      languageLabel: language ? LANGUAGE_LABELS[language] : "",
      length,
      depth,
      negativeReviewIntent,
      platform,
      revisionIntent,
      tone,
      interviewIntent,
      topic: ""
    };

    metadata.topic = globalScope.PromptBoostNormalizer.extractSubject(normalized.text, context, taskType, metadata);
    return metadata;
  }

  function findFirst(text, values) {
    return values.find((value) => text.includes(value)) || "";
  }

  function findLanguage(text) {
    return Object.keys(LANGUAGE_LABELS).find((value) => {
      if (value === "c" || value === "java") {
        return new RegExp(`\\b${escapeRegex(value)}\\b`).test(text);
      }

      if (value === "c++") {
        return /(^|[^a-z0-9+#])c\+\+($|[^a-z0-9+#])|\bcpp\b/.test(text);
      }

      return new RegExp(`\\b${escapeRegex(value)}\\b`).test(text);
    }) || "";
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function extractDepth(text) {
    if (/\b(deeply|advanced|in depth|detailed|deep dive)\b/.test(text)) {
      return "deep";
    }

    if (/\b(beginner|simple|basics|easy|eli5)\b/.test(text)) {
      return "beginner";
    }

    if (/\b(quickly|quick|brief|summary|revision|recap)\b/.test(text)) {
      return "summary";
    }

    return "";
  }

  function inferDomain(text, context) {
    if (/\b(gym|fitness|workout|protein)\b/.test(text)) {
      return "fitness";
    }

    if (/\b(api|backend|server)\b/.test(text)) {
      return "backend/api";
    }

    if (/\b(project|portfolio|startup)\b/.test(text)) {
      return "project";
    }

    if (context === "marketing" && /\b(shoes|skincare|course|app)\b/.test(text)) {
      return "product";
    }

    return "";
  }

  globalScope.PromptBoostMetadataExtractor = {
    extractMetadata
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

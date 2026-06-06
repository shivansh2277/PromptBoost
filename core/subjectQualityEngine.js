"use strict";

(function attachPromptBoostSubjectQualityEngine(globalScope) {
  const WEAK_SUBJECTS = new Set([
    "",
    "thing",
    "things",
    "stuff",
    "something",
    "anything",
    "content",
    "item",
    "items",
    "a",
    "an",
    "the",
    "for",
    "about",
    "to",
    "for a",
    "about for",
    "post",
    "caption",
    "email",
    "blog",
    "ad",
    "copy",
    "prompt",
    "request"
  ]);

  function score(subject, semantic = {}) {
    const cleaned = clean(subject);

    if (!cleaned) {
      return { score: 0, level: "missing", usable: false, subject: "" };
    }

    if (WEAK_SUBJECTS.has(cleaned)) {
      return { score: 10, level: "weak", usable: false, subject: cleaned };
    }

    if (isLowQualitySubject(cleaned)) {
      return { score: 12, level: "weak", usable: false, subject: cleaned };
    }

    if (isRecursiveSubject(cleaned, semantic)) {
      return { score: 15, level: "recursive", usable: false, subject: cleaned };
    }

    if (cleaned.split(/\s+/).length === 1 && /^(it|this|that)$/i.test(cleaned)) {
      return { score: 20, level: "unclear", usable: false, subject: cleaned };
    }

    const specificity = Math.min(70, cleaned.split(/\s+/).length * 15);
    const entityBonus = semantic.entities && semantic.entities.length ? 20 : 0;
    const domainBonus = semantic.domain ? 10 : 0;
    const finalScore = Math.min(100, 35 + specificity + entityBonus + domainBonus);

    return {
      score: finalScore,
      level: finalScore >= 70 ? "strong" : "usable",
      usable: true,
      subject: cleaned
    };
  }

  function clean(subject) {
    return String(subject || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#./\s-]/g, " ")
      .replace(/\b(for|about|to)\s*$/g, "")
      .replace(/^(for|about)\s+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isLowQualitySubject(subject) {
    const cleaned = clean(subject);

    if (!cleaned || WEAK_SUBJECTS.has(cleaned)) {
      return true;
    }

    if (/^(a|an|the)\s+(thing|things|something|stuff|content|post|caption|email|item|items)$/i.test(cleaned)) {
      return true;
    }

    if (/^(caption|post|email|blog post|content)\s+(for|about|to)?$/i.test(cleaned)) {
      return true;
    }

    if (/\b(for|about|to)\s+(a|an|the)?$/i.test(cleaned)) {
      return true;
    }

    return false;
  }

  function isRecursiveSubject(subject, semantic) {
    const format = semantic.format || "";
    const task = semantic.taskType || "";

    if (format === "linkedin_post" && /\blinkedin\s+post\b/.test(subject)) {
      return true;
    }

    if (format === "instagram_caption" && /\b(instagram\s+)?caption\b/.test(subject)) {
      return true;
    }

    if (format === "blog_post" && /\bblog\s+post\b/.test(subject)) {
      return true;
    }

    if (task === "review_response" && /\bnegative\s+review\b/.test(subject)) {
      return true;
    }

    return false;
  }

  globalScope.PromptBoostSubjectQualityEngine = {
    isLowQualitySubject,
    score
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

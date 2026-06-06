"use strict";

(function attachPromptBoostSemanticReconstructionEngine(globalScope) {
  const FILLERS = /^(please\s+)?(can you|could you|would you|help me|help with|i need you to|i want|i want to|pls|please)\s+/i;
  const ACTIONS = [
    "compare", "analyze", "research", "explain", "summarize", "write", "create", "generate", "make",
    "draft", "fix", "debug", "optimize", "review", "proofread", "rewrite", "refactor", "build", "plan",
    "brainstorm"
  ];

  function reconstruct(input) {
    const raw = String(input || "").trim();
    const corrected = globalScope.PromptBoostTypoHandler
      ? globalScope.PromptBoostTypoHandler.correctText(raw)
      : raw;
    const normalized = semanticCleanupPipeline(normalize(corrected));
    const lower = normalized.toLowerCase();
    const domain = globalScope.PromptBoostDomainRouter.detect(lower);
    const action = detectAction(lower);
    const entities = extractEntities(normalized, lower);
    const base = {
      raw,
      text: normalized,
      lower,
      tokens: lower.replace(/[^a-z0-9+#./\s-]/g, " ").split(/\s+/).filter(Boolean),
      action,
      entities,
      platform: domain.platform,
      domain: domain.domain,
      language: domain.language,
      languageLabel: domain.languageLabel,
      framework: domain.framework,
      format: detectFormat(lower, domain.platform),
      tone: detectTone(lower),
      taskType: "",
      context: "",
      subject: ""
    };

    const taskType = inferTaskType(base);
    base.taskType = taskType.taskType;
    base.context = taskType.context;
    base.subject = extractSubject(base);
    base.subjectQuality = globalScope.PromptBoostSubjectQualityEngine.score(base.subject, base);

    return base;
  }

  function normalize(text) {
    return String(text || "")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\bc\s*\+\s*\+/gi, "c++")
      .replace(/\s+/g, " ")
      .trim();
  }

  function semanticCleanupPipeline(text) {
    let cleaned = String(text || "")
      .replace(/\b(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan)\s+\1\b/gi, "$1")
      .replace(/\b(for|about|to)\s+\1\b/gi, "$1")
      .replace(/\bemail\s+(a|an|the)\s+cold\s+to\b/gi, "cold email to")
      .replace(/\bemail\s+(a|an|the)\s+to\b/gi, "email to")
      .replace(/\b(blog\s+post|post|caption|email)\s+about\s+for\b/gi, "$1")
      .replace(/\b(caption|post|content)\s+for\s+(a|an|the)\s*$/gi, "$1")
      .replace(/\babout\s+for\s+(my\s+)?blog\b/gi, "for blog")
      .replace(/\bfor\s+(a|an|the)\s*$/gi, "")
      .replace(/\babout\s+(a|an|the)\s*$/gi, "")
      .replace(/\b(post|caption|blog post|article|email|ad copy|ad|content)\s+about\s+(a\s+)?\1\b/gi, "$1")
      .replace(/\s+/g, " ")
      .trim();

    cleaned = cleaned
      .replace(/\b(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan)\s+\1\b/gi, "$1")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned;
  }

  function detectAction(lower) {
    const cleaned = lower.replace(FILLERS, "");
    return ACTIONS.find((action) => new RegExp(`\\b${action}\\b`).test(cleaned)) || "";
  }

  function detectFormat(lower, platform) {
    if (platform === "linkedin" || /\blinkedin\s+post\b/.test(lower)) return "linkedin_post";
    if (platform === "instagram" || /\bcaption\b/.test(lower)) return "instagram_caption";
    if (platform === "blog" || /\bblog\s+post|article\b/.test(lower)) return "blog_post";
    if (platform === "email" || /\bemail\b/.test(lower)) return "email";
    return "";
  }

  function detectTone(lower) {
    if (/\bformal\b/.test(lower) && /\b(casual|natural|friendly|conversational)\b/.test(lower)) {
      return "professional but natural";
    }
    if (/\bprofessional\b/.test(lower)) return "professional";
    if (/\bcasual|friendly|conversational|natural\b/.test(lower)) return "natural";
    if (/\bpersuasive\b/.test(lower)) return "persuasive";
    return "";
  }

  function inferTaskType(semantic) {
    const lower = semantic.lower;

    if (/\bnegative\s+review|bad\s+review|complaint|angry customer|respond to .*review\b/.test(lower)) {
      return { taskType: "review_response", context: "writing" };
    }
    if (/\b(compare|vs|versus|which is better|pros and cons|tradeoffs?)\b/.test(lower)) {
      return { taskType: "comparison", context: "research" };
    }
    if (semantic.format === "linkedin_post") return { taskType: "linkedin_post", context: "writing" };
    if (semantic.format === "instagram_caption") return { taskType: "instagram_caption", context: "marketing" };
    if (semantic.format === "blog_post") return { taskType: "blog_post", context: "writing" };
    if (/\b(product\s+launch|launch)\b.*\bpost\b/.test(lower)) return { taskType: "business_content", context: "marketing" };
    if (/\bcontent\s+for\s+(my\s+)?business\b|\bbusiness\s+content\b/.test(lower)) return { taskType: "business_content", context: "marketing" };
    if (/\b(proofread|grammar|spelling|punctuation)\b/.test(lower)) return { taskType: "proofreading", context: "writing" };
    if (semantic.format === "email") return { taskType: "email", context: "writing" };
    if (/\b(fix|debug|bug|error|not working|issue)\b/.test(lower)) return { taskType: "debugging", context: "coding" };
    if (/\bcode review|review .*code|review .*component\b/.test(lower)) return { taskType: "code_review", context: "coding" };
    if (/\b(optimize|performance|faster|efficient|complexity)\b/.test(lower) && /\b(code|query|api|function|sql|website|app)\b/.test(lower)) {
      return { taskType: "optimization", context: "coding" };
    }
    if (/\b(interview|coding interview|technical interview)\b/.test(lower)) return { taskType: "interview_prep", context: "study" };
    if (/\b(exam|test prep|marks|common questions)\b/.test(lower)) return { taskType: "exam_prep", context: "study" };
    if (/\b(summary|summarize|revision|recap)\b/.test(lower)) return { taskType: "quick_revision", context: "study" };
    if (/\b(explain|what is|teach|concept|explanation)\b/.test(lower)) {
      return { taskType: /\b(deeply|in depth|advanced|detailed)\b/.test(lower) ? "deep_learning" : "beginner_learning", context: "study" };
    }
    if (/\b(rewrite|rephrase)\b/.test(lower)) return { taskType: "rewriting", context: "writing" };
    if (/\b(plan|roadmap|schedule)\b/.test(lower)) return { taskType: "planning", context: "general" };
    if (/\b(ideas|brainstorm|names)\b/.test(lower)) return { taskType: "brainstorming", context: "general" };
    if (/\b(ad|ad copy|sales copy|hook|cta|campaign)\b/.test(lower)) return { taskType: "ad_copy", context: "marketing" };
    if (/\b(research|market|trends|analysis|analyze)\b/.test(lower)) return { taskType: "analysis", context: "research" };

    return { taskType: "unknown", context: "general" };
  }

  function extractEntities(text, lower) {
    const entities = [];
    const comparison = lower.match(/\bcompare\s+(.+?)\s+(and|with|vs|versus)\s+(.+?)(\s+for\b|$)/);
    const vs = lower.match(/\b([a-z0-9+#.]+)\s+(vs|versus)\s+([a-z0-9+#.]+)\b/);

    if (comparison) {
      entities.push(titleEntity(comparison[1]), titleEntity(comparison[3]));
    } else if (vs) {
      entities.push(titleEntity(vs[1]), titleEntity(vs[3]));
    }

    return entities.filter(Boolean);
  }

  function titleEntity(value) {
    const cleaned = String(value || "").replace(/\b(my|the|a|an)\b/g, "").trim();
    const labels = { react: "React", vue: "Vue", mongodb: "MongoDB", python: "Python", javascript: "JavaScript" };
    return labels[cleaned.toLowerCase()] || cleaned;
  }

  function extractSubject(semantic) {
    let subject = semantic.text
      .replace(FILLERS, "")
      .replace(new RegExp(`^(${ACTIONS.join("|")})\\s+`, "i"), "")
      .replace(/\b(help with|help me|please)\b/gi, "")
      .replace(/\b(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan)\s+\1\b/gi, "$1")
      .replace(/\b(for|on)\s+(linkedin|instagram|twitter|x|youtube|tiktok|blog)\b/gi, "")
      .replace(/\b(linkedin|instagram|twitter|youtube|tiktok)\b/gi, "")
      .replace(/\b(post|caption|blog post|article|email|ad copy|ad|content)\s+about\s+(a\s+)?\1\b/gi, "$1")
      .replace(/\babout\s+about\b/gi, "about")
      .replace(/\bfor\s+for\b/gi, "for")
      .replace(/\bto\s+to\b/gi, "to")
      .replace(/\bemail\s+(a|an|the)\s+cold\s+to\b/gi, "cold email to")
      .replace(/\bemail\s+(a|an|the)\s+to\b/gi, "email to")
      .replace(/\b(blog\s+post|post|caption|email)\s+about\s+for\b/gi, "$1")
      .replace(/\bfor\s+about\b/gi, "about")
      .replace(/\bfor\s+(a|an|the)\s*$/gi, "")
      .replace(/\babout\s+(a|an|the)\s*$/gi, "")
      .replace(/\b(deeply|in detail|detailed|quickly|quick|briefly|for beginners|beginner|beginners|formal|casual)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (semantic.taskType === "comparison" && semantic.entities.length >= 2) {
      subject = `${semantic.entities[0]} and ${semantic.entities[1]}`;
      if (/\bfor my project\b/.test(semantic.lower)) {
        subject += " for my project";
      }
      return subject;
    }

    if (semantic.taskType === "review_response") {
      return subject
        .replace(/\b(respond|reply)\s+to\s+(a\s+)?/i, "")
        .replace(/\b(ad|ad copy|campaign)\s+for\s+/i, "")
        .replace(/^negative\s+review$/i, "")
        .trim() || "a negative review";
    }

    if (semantic.taskType === "linkedin_post") {
      return subject
        .replace(/\b(linkedin\s+)?post\s+(about\s+)?/i, "")
        .replace(/\bpost\b/gi, "")
        .trim();
    }

    if (semantic.taskType === "instagram_caption") {
      return subject
        .replace(/\b(instagram\s+)?caption\b/gi, "")
        .replace(/\bthing|something|content\b/gi, "")
        .replace(/^for\s+/i, "")
        .replace(/\b(a|an|the)\b$/i, "")
        .trim();
    }

    if (semantic.taskType === "blog_post") {
      return subject
        .replace(/\b(something|thing|content)\b/gi, "")
        .replace(/\bblog\s+(post|content)?\b/gi, "")
        .replace(/^about\s+/i, "")
        .trim();
    }

    if (semantic.taskType === "email") {
      return subject
        .replace(/\b(formal|casual|professional|natural)\b/gi, "")
        .replace(/\bemail\b/gi, "")
        .replace(/\b(a|an|the)\s+cold\s+to\b/gi, "cold email to")
        .replace(/\b(a|an|the)\s+to\b/gi, "to")
        .replace(/^to\s+/i, "to ")
        .trim();
    }

    return subject.replace(/^about\s+/i, "").trim();
  }

  globalScope.PromptBoostSemanticReconstructionEngine = {
    reconstruct
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

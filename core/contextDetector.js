"use strict";

(function attachPromptBoostContextDetector(globalScope) {
  const MIN_CONFIDENCE = 34;
  const CONTEXTS = ["coding", "study", "marketing", "writing", "research", "general"];

  const RULES = {
    coding: {
      keywords: { code: 4, program: 4, bug: 5, error: 5, api: 4, algorithm: 5, function: 4, python: 6, javascript: 6, react: 5, backend: 4, sql: 5, optimize: 5, performance: 5, c: 3 },
      phrases: { "heap sort": 8, "binary search": 7, "fix code": 7, "give program": 7, "in c": 5, "c++": 6 },
      patterns: [{ regex: /\b(fix|debug|build|create|optimize|review|refactor)\b.{0,30}\b(code|program|api|function|bug|error|feature|query|performance)\b/, score: 8 }]
    },
    study: {
      keywords: { explain: 5, explanation: 5, concept: 4, notes: 4, exam: 6, summary: 4, summarize: 4, recursion: 3, science: 3, math: 3 },
      phrases: { "what is": 5, "for exam": 8, "water cycle": 6, "explain like": 7 },
      patterns: [{ regex: /\b(explain|teach|summarize)\b.{0,30}\b(topic|concept|exam|chapter|lesson|cycle)\b/, score: 7 }]
    },
    writing: {
      keywords: { linkedin: 7, email: 7, story: 5, rewrite: 5, grammar: 6, proofread: 6, article: 5, blog: 5 },
      phrases: { "linkedin post": 10, "write an email": 8, "fix grammar": 8 },
      patterns: [{ regex: /\b(write|draft|rewrite|proofread|fix)\b.{0,30}\b(linkedin|email|story|grammar|article|blog)\b/, score: 8 }]
    },
    marketing: {
      keywords: { ad: 7, caption: 6, instagram: 7, hook: 6, cta: 6, product: 4, description: 5, sales: 5, brand: 4 },
      phrases: { "instagram caption": 10, "ad copy": 9, "product description": 9, "call to action": 9 },
      patterns: [{ regex: /\b(write|create|generate|make)\b.{0,30}\b(ad|caption|hook|cta|product description)\b/, score: 8 }]
    },
    research: {
      keywords: { compare: 6, analyze: 6, research: 6, market: 5, strategy: 5, trends: 5, pros: 4, cons: 4 },
      phrases: { "pros and cons": 10, "market research": 9, "competitive analysis": 9 },
      patterns: [{ regex: /\b(compare|analyze|research)\b.{0,35}\b(market|strategy|trend|brand|option|industry)\b/, score: 8 }]
    },
    general: {
      keywords: { plan: 4, checklist: 4, ideas: 4, brainstorm: 5, organize: 3 },
      phrases: { "make this better": 4 },
      patterns: []
    }
  };

  function detectContext(normalized) {
    return analyzeContext(normalized).context;
  }

  function analyzeContext(normalized) {
    const scores = Object.fromEntries(CONTEXTS.map((context) => [context, 0]));

    for (const context of CONTEXTS) {
      scoreRuleSet(normalized, RULES[context], scores, context);
    }

    const sorted = CONTEXTS
      .map((context) => ({ context, score: scores[context] }))
      .sort((a, b) => b.score - a.score);

    const top = sorted[0];
    const runnerUp = sorted[1];
    const confidence = confidenceFrom(top.score, runnerUp.score);
    const context = top.score > 0 && confidence >= MIN_CONFIDENCE ? top.context : "general";

    return { context, confidence, scores: roundScores(scores) };
  }

  function scoreRuleSet(normalized, rules, scores, key) {
    for (const [keyword, weight] of Object.entries(rules.keywords)) {
      if (normalized.tokens.includes(keyword) || normalized.tokens.some((token) => globalScope.PromptBoostTypoHandler.isTypoMatch(token, keyword))) {
        scores[key] += weight;
      }
    }

    for (const [phrase, weight] of Object.entries(rules.phrases)) {
      if (normalized.lower.includes(phrase)) {
        scores[key] += weight;
      }
    }

    for (const pattern of rules.patterns) {
      if (pattern.regex.test(normalized.lower)) {
        scores[key] += pattern.score;
      }
    }

    if (key === "writing" && /\b(negative review|bad review|complaint|respond to .*review)\b/.test(normalized.lower)) {
      scores[key] += 14;
    }

    if (key === "marketing" && /\b(negative review|bad review|complaint)\b/.test(normalized.lower)) {
      scores[key] -= 10;
    }

    if (scores[key] >= 10) {
      scores[key] += 3;
    }
  }

  function confidenceFrom(topScore, runnerUpScore) {
    if (topScore <= 0) {
      return 0;
    }

    return Math.min(99, Math.round(22 + topScore * 5 + Math.max(topScore - runnerUpScore, 0) * 4));
  }

  function roundScores(scores) {
    return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.round(value)]));
  }

  globalScope.PromptBoostContextDetector = {
    analyzeContext,
    detectContext
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

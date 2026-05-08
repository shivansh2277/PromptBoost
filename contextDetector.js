"use strict";

(function attachPromptBoostContext(globalScope) {
  const MIN_CONFIDENCE = 34;
  const CONTEXTS = ["coding", "study", "marketing", "writing", "research"];

  const CONTEXT_RULES = {
    coding: {
      keywords: {
        code: 3,
        program: 3,
        programming: 3,
        bug: 4,
        error: 4,
        debug: 4,
        algorithm: 5,
        function: 4,
        api: 4,
        backend: 4,
        frontend: 3,
        react: 5,
        javascript: 6,
        python: 6,
        java: 4,
        sql: 5,
        html: 3,
        css: 3,
        c: 3
      },
      phrases: {
        "heap sort": 8,
        "binary search": 7,
        "stack trace": 7,
        "fix code": 7,
        "write code": 6,
        "give program": 7,
        "in c": 5,
        "c++": 6,
        "data structure": 6
      },
      patterns: [
        { regex: /\b(fix|debug|solve|optimize|write|create)\b.{0,24}\b(code|program|function|api|algorithm)\b/, score: 7 },
        { regex: /\b(error|bug|exception|stack trace)\b/, score: 5 }
      ]
    },
    study: {
      keywords: {
        explain: 5,
        explanation: 5,
        teach: 5,
        notes: 4,
        summary: 4,
        concept: 4,
        history: 4,
        science: 4,
        math: 4,
        physics: 4,
        chemistry: 4,
        biology: 4,
        recap: 3,
        learn: 3
      },
      phrases: {
        "what is": 5,
        "water cycle": 6,
        "how does": 5,
        "study notes": 6,
        "explain like": 6,
        "step by step": 5
      },
      patterns: [
        { regex: /\b(explain|teach|summarize)\b.{0,36}\b(concept|topic|chapter|lesson|cycle|process)\b/, score: 6 },
        { regex: /\b(i want|give me|make)\b.{0,24}\b(explanation|notes|summary)\b/, score: 5 }
      ]
    },
    marketing: {
      keywords: {
        caption: 5,
        instagram: 6,
        youtube: 5,
        tiktok: 5,
        ad: 6,
        copy: 5,
        sales: 5,
        brand: 5,
        campaign: 5,
        hook: 5,
        cta: 4,
        hashtags: 4,
        offer: 4,
        launch: 3
      },
      phrases: {
        "social media": 6,
        "landing page": 6,
        "sales page": 6,
        "instagram caption": 9,
        "youtube script": 6,
        "ad copy": 8
      },
      patterns: [
        { regex: /\b(write|create|make|give)\b.{0,24}\b(caption|ad|hook|copy|campaign)\b/, score: 6 },
        { regex: /\b(instagram|youtube|tiktok)\b.{0,24}\b(caption|hook|script|post)\b/, score: 7 }
      ]
    },
    writing: {
      keywords: {
        blog: 5,
        article: 5,
        email: 5,
        script: 4,
        story: 5,
        rewrite: 5,
        grammar: 5,
        essay: 4,
        letter: 4,
        paragraph: 4,
        proofread: 5,
        tone: 3
      },
      phrases: {
        "fix grammar": 7,
        "rewrite this": 7,
        "write an email": 7,
        "make it professional": 6,
        "improve writing": 6
      },
      patterns: [
        { regex: /\b(rewrite|proofread|edit|improve)\b.{0,24}\b(email|article|blog|essay|paragraph|grammar|writing)\b/, score: 7 }
      ]
    },
    research: {
      keywords: {
        compare: 5,
        analyze: 5,
        research: 6,
        market: 4,
        strategy: 5,
        trends: 5,
        evaluate: 4,
        recommendation: 4,
        competitor: 5,
        industry: 4,
        report: 3
      },
      phrases: {
        "pros and cons": 8,
        "market research": 8,
        "competitive analysis": 8,
        "trend analysis": 7,
        "swot analysis": 7
      },
      patterns: [
        { regex: /\b(compare|analyze|research|evaluate)\b.{0,36}\b(market|strategy|trend|competitor|option|industry)\b/, score: 7 }
      ]
    }
  };

  function detectPromptContext(input) {
    return analyzePromptContext(input).context;
  }

  function detectIntent(input) {
    return detectPromptContext(input);
  }

  function analyzePromptContext(input) {
    const normalized = normalizeInput(input);

    if (!normalized.text) {
      return buildResult("general", 0, buildEmptyScores());
    }

    const scores = buildEmptyScores();

    for (const context of CONTEXTS) {
      const rules = CONTEXT_RULES[context];
      scorePhrases(normalized.text, normalized.tokens, rules.phrases, scores, context);
      scoreKeywords(normalized.tokens, rules.keywords, scores, context);
      scorePatterns(normalized.text, rules.patterns, scores, context);
      applyMultiKeywordBoost(scores, context);
    }

    applyCrossContextPriority(normalized.text, scores);

    const sorted = CONTEXTS
      .map((context) => ({ context, score: scores[context] }))
      .sort((a, b) => b.score - a.score);

    const top = sorted[0];
    const runnerUp = sorted[1];
    const confidence = calculateConfidence(top.score, runnerUp.score);
    const context = top.score > 0 && confidence >= MIN_CONFIDENCE ? top.context : "general";

    return buildResult(context, confidence, scores);
  }

  function normalizeInput(input) {
    const text = String(input || "")
      .toLowerCase()
      .replace(/\bc\s*\+\s*\+/g, "c++")
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      text,
      tokens: text.split(" ").filter(Boolean)
    };
  }

  function scorePhrases(text, tokens, phrases, scores, context) {
    for (const [phrase, weight] of Object.entries(phrases)) {
      if (text.includes(phrase)) {
        scores[context] += weight;
        continue;
      }

      if (isFuzzyPhraseMatch(tokens, phrase)) {
        scores[context] += Math.max(2, weight - 2);
      }
    }
  }

  function scoreKeywords(tokens, keywords, scores, context) {
    const matched = new Set();

    for (const token of tokens) {
      for (const [keyword, weight] of Object.entries(keywords)) {
        if (matched.has(keyword)) {
          continue;
        }

        if (token === keyword) {
          scores[context] += weight;
          matched.add(keyword);
          continue;
        }

        if (isTypoMatch(token, keyword)) {
          scores[context] += Math.max(2, weight - 1);
          matched.add(keyword);
        }
      }
    }
  }

  function scorePatterns(text, patterns, scores, context) {
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        scores[context] += pattern.score;
      }
    }
  }

  function applyMultiKeywordBoost(scores, context) {
    if (scores[context] >= 10) {
      scores[context] += 3;
    } else if (scores[context] >= 6) {
      scores[context] += 1.5;
    }
  }

  function applyCrossContextPriority(text, scores) {
    if (/\b(program|code|algorithm|api|bug|error|python|javascript|react|heap sort|in c|c\+\+)\b/.test(text)) {
      scores.coding += 2.5;
    }

    if (/\b(explain|explanation|what is|teach|notes|concept|water cycle)\b/.test(text)) {
      scores.study += 2;
    }

    if (/\b(instagram|caption|ad|sales|brand|campaign|hook)\b/.test(text)) {
      scores.marketing += 2;
    }

    if (/\b(compare|analyze|research|pros and cons|strategy|trends)\b/.test(text)) {
      scores.research += 2;
    }
  }

  function isFuzzyPhraseMatch(tokens, phrase) {
    const phraseTokens = phrase.split(" ");

    if (phraseTokens.length < 2 || tokens.length < phraseTokens.length) {
      return false;
    }

    for (let i = 0; i <= tokens.length - phraseTokens.length; i += 1) {
      const windowTokens = tokens.slice(i, i + phraseTokens.length);

      if (windowTokens.every((token, index) => token === phraseTokens[index] || isTypoMatch(token, phraseTokens[index]))) {
        return true;
      }
    }

    return false;
  }

  function isTypoMatch(input, keyword) {
    if (keyword.length < 4 || input.length < 4 || Math.abs(input.length - keyword.length) > 2) {
      return false;
    }

    if (input[0] !== keyword[0]) {
      return false;
    }

    const distance = damerauLevenshtein(input, keyword);
    const maxDistance = keyword.length <= 6 ? 1 : 2;
    return distance <= maxDistance;
  }

  function damerauLevenshtein(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
      matrix[i][0] = i;
    }

    for (let j = 0; j < cols; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );

        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }

    return matrix[a.length][b.length];
  }

  function calculateConfidence(topScore, runnerUpScore) {
    if (topScore <= 0) {
      return 0;
    }

    const separation = Math.max(topScore - runnerUpScore, 0);
    return Math.min(99, Math.round(22 + topScore * 5 + separation * 4));
  }

  function buildEmptyScores() {
    return {
      coding: 0,
      study: 0,
      marketing: 0,
      writing: 0,
      research: 0
    };
  }

  function buildResult(context, confidence, scores) {
    return {
      context,
      confidence,
      scores: {
        coding: Math.round(scores.coding),
        study: Math.round(scores.study),
        marketing: Math.round(scores.marketing),
        writing: Math.round(scores.writing),
        research: Math.round(scores.research)
      }
    };
  }

  globalScope.PromptBoostContext = {
    analyzePromptContext,
    detectIntent,
    detectPromptContext,
    minConfidence: MIN_CONFIDENCE
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

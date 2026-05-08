"use strict";

importScripts("contextDetector.js");

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "general"
};

const VALID_MODES = new Set(["general", "coding", "study"]);
const CONTEXT_LABELS = {
  coding: "Coding",
  study: "Study",
  marketing: "Marketing",
  writing: "Writing",
  research: "Research",
  general: "General"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
    chrome.storage.local.set({
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : DEFAULT_SETTINGS.enabled,
      mode: normalizeMode(stored.mode)
    }, () => {
      chrome.storage.local.remove("lastImprovedPrompt");
    });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "PROMPTBOOST_IMPROVE") {
    const originalPrompt = String(message.prompt || "").trim();

    if (!originalPrompt) {
      sendResponse({
        ok: false,
        error: "Enter a prompt before improving it."
      });
      return false;
    }

    const improvedPrompt = improvePrompt(originalPrompt, message.mode);
    const contextAnalysis = PromptBoostContext.analyzePromptContext(originalPrompt);
    const effectiveContext = resolveEffectiveContext(message.mode, contextAnalysis.context);

    sendResponse({
      ok: true,
      improvedPrompt
    });

    return false;
  }

  if (message.type === "PROMPTBOOST_GET_SETTINGS") {
    chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
      sendResponse({
        ok: true,
        settings: {
          enabled: settings.enabled !== false,
          mode: normalizeMode(settings.mode)
        }
      });
    });

    return true;
  }

  if (message.type === "PROMPTBOOST_SET_ENABLED") {
    const enabled = Boolean(message.enabled);

    chrome.storage.local.set({ enabled }, () => {
      sendResponse({
        ok: true,
        enabled
      });
    });

    return true;
  }

  if (message.type === "PROMPTBOOST_SET_MODE") {
    const mode = normalizeMode(message.mode);

    chrome.storage.local.set({ mode }, () => {
      sendResponse({
        ok: true,
        mode
      });
    });

    return true;
  }

  return false;
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "improve-prompt") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.id || !isChatGptUrl(activeTab.url || "")) {
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { type: "PROMPTBOOST_COMMAND_IMPROVE" });
  });
});

function isChatGptUrl(url) {
  return /^https:\/\/(chat\.openai\.com|chatgpt\.com)\//i.test(url);
}

function improvePrompt(input, mode = "general") {
  const normalized = normalizePrompt(input);
  const selectedMode = normalizeMode(mode);
  const contextAnalysis = PromptBoostContext.analyzePromptContext(normalized);
  const effectiveContext = resolveEffectiveContext(selectedMode, contextAnalysis.context);

  if (looksAlreadyStructured(normalized)) {
    return refineStructuredPrompt(normalized, effectiveContext);
  }

  return buildEnhancedPrompt(normalized, effectiveContext);
}

function resolveEffectiveContext(mode, detectedContext) {
  const selectedMode = normalizeMode(mode);

  if (selectedMode === "coding" || selectedMode === "study") {
    return selectedMode;
  }

  return CONTEXT_LABELS[detectedContext] ? detectedContext : "general";
}

function buildEnhancedPrompt(input, context) {
  if (context === "coding") {
    return buildCodingPrompt(input);
  }

  if (context === "study") {
    return buildStudyPrompt(input);
  }

  if (context === "marketing") {
    return buildMarketingPrompt(input);
  }

  if (context === "writing") {
    return buildWritingPrompt(input);
  }

  if (context === "research") {
    return buildResearchPrompt(input);
  }

  return buildGeneralPrompt(input);
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : DEFAULT_SETTINGS.mode;
}

function buildGeneralPrompt(normalized) {
  return [
    `Improve this request into a clear, useful prompt: "${normalized}".`,
    "",
    "Make it specific, structured, and easy to answer. Add helpful assumptions only when details are missing.",
    "",
    "Return:",
    "- Improved prompt",
    "- Suggested output format"
  ].join("\n");
}

function buildCodingPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    `Solve this programming problem: "${cleaned}".`,
    "",
    "Include clean optimized code when relevant, explain the logic, handle edge cases, and follow best practices.",
    "",
    "Return:",
    "- Approach",
    "- Code",
    "- Explanation",
    "- Edge cases",
    "- Tests"
  ].join("\n");
}

function buildStudyPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    `Explain this simply: "${cleaned}".`,
    "",
    "Use a beginner-friendly explanation, step-by-step breakdown, examples or analogies, and a short recap.",
    "",
    "Return:",
    "- Short answer",
    "- Explanation",
    "- Examples",
    "- Recap"
  ].join("\n");
}

function buildMarketingPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    `Create marketing copy for this request: "${cleaned}".`,
    "",
    "Make it audience-aware, benefit-led, punchy, and optimized for engagement. Include variations when useful.",
    "",
    "Return:",
    "- Hooks",
    "- Copy options",
    "- CTA",
    "- Hashtags or channel notes"
  ].join("\n");
}

function buildWritingPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    `Improve or write this clearly: "${cleaned}".`,
    "",
    "Make it polished, natural, well-structured, and matched to the likely audience and tone.",
    "",
    "Return:",
    "- Polished version",
    "- Tone notes",
    "- Optional alternatives"
  ].join("\n");
}

function buildResearchPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    `Analyze this with a practical, evidence-aware approach: "${cleaned}".`,
    "",
    "Compare the key options or viewpoints, separate assumptions from facts, and end with a useful recommendation.",
    "",
    "Return:",
    "- Executive summary",
    "- Key findings",
    "- Tradeoffs",
    "- Recommendation"
  ].join("\n");
}

function normalizePrompt(input) {
  return input
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();
}

function looksAlreadyStructured(prompt) {
  const lower = prompt.toLowerCase();
  const markers = ["act as", "role:", "task:", "constraints:", "output format:", "context:"];
  return markers.filter((marker) => lower.includes(marker)).length >= 2;
}

function refineStructuredPrompt(prompt, mode = "general") {
  const modeInstruction = {
    general: "Before answering, improve clarity by identifying assumptions, resolving ambiguity where possible, and using a concise, well-organized structure.",
    coding: "Before answering, treat this as a coding task: provide clean code when relevant, explain the approach, include edge cases, and mention testing.",
    study: "Before answering, treat this as a study task: explain simply, use examples, and break the answer down step by step.",
    marketing: "Before answering, treat this as a marketing task: optimize for audience, hook, benefits, CTA, and engagement.",
    writing: "Before answering, treat this as a writing task: improve clarity, tone, grammar, structure, and flow.",
    research: "Before answering, treat this as a research task: compare evidence, assumptions, risks, and practical recommendations."
  };

  return [
    prompt,
    "",
    modeInstruction[normalizePromptContext(mode)]
  ].join("\n");
}

function normalizePromptContext(context) {
  return CONTEXT_LABELS[context] ? context : "general";
}

function inferIntent(prompt) {
  const lower = prompt.toLowerCase();

  const intentRules = [
    ["code", ["code", "program", "script", "debug", "bug", "function", "api", "react", "python", "javascript", "sql", "html", "css"]],
    ["copywriting", ["ad", "advertisement", "landing page", "sales", "copy", "cta", "headline", "email campaign"]],
    ["writing", ["write", "rewrite", "blog", "article", "essay", "story", "post", "caption", "thread"]],
    ["analysis", ["analyze", "compare", "evaluate", "research", "summarize", "explain", "pros and cons"]],
    ["planning", ["plan", "strategy", "roadmap", "schedule", "steps", "checklist"]],
    ["learning", ["teach", "learn", "lesson", "tutorial", "course", "study"]]
  ];

  for (const [intent, keywords] of intentRules) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return intent;
    }
  }

  return "general";
}

function inferRole(_prompt, intent) {
  const roles = {
    code: "Act as a senior software engineer and technical reviewer.",
    copywriting: "Act as a professional direct-response copywriter.",
    writing: "Act as an expert editor and content strategist.",
    analysis: "Act as a rigorous analyst with strong critical thinking.",
    planning: "Act as an experienced strategist and execution planner.",
    learning: "Act as an expert teacher who explains concepts clearly.",
    general: "Act as an expert assistant."
  };

  return roles[intent] || roles.general;
}

function buildTask(prompt, intent) {
  const cleaned = stripWeakLeadIn(prompt);
  const taskStarters = {
    code: "Help with the following technical request",
    copywriting: "Create a persuasive, high-quality response for the following marketing request",
    writing: "Produce a polished written response for the following request",
    analysis: "Analyze the following request and provide a clear, evidence-informed response",
    planning: "Create a practical plan for the following request",
    learning: "Teach or explain the following topic in a clear, structured way",
    general: "Complete the following request with a structured, high-quality answer"
  };

  return `${taskStarters[intent] || taskStarters.general}: "${cleaned}".`;
}

function stripWeakLeadIn(prompt) {
  return prompt
    .replace(/^(please\s+)?(can you|could you|help me|i need you to)\s+/i, "")
    .trim();
}

function buildConstraints(prompt, intent) {
  const constraints = [
    "Be specific, practical, and avoid vague generalities.",
    "Ask clarifying questions only if the request cannot be completed responsibly without more information.",
    "Keep the response aligned with the user's goal and likely audience."
  ];

  if (intent === "copywriting") {
    constraints.push("Include a clear hook, concrete benefits, proof or credibility cues, and a strong call to action.");
    constraints.push("Use placeholders in square brackets for missing product, audience, offer, or brand details.");
  }

  if (intent === "code") {
    constraints.push("Include working code or precise implementation steps when relevant.");
    constraints.push("Call out assumptions, edge cases, and testing steps.");
  }

  if (intent === "analysis") {
    constraints.push("Separate facts, assumptions, and recommendations.");
  }

  if (intent === "planning") {
    constraints.push("Prioritize actions by impact and sequence them logically.");
  }

  if (prompt.length < 40) {
    constraints.push("Expand underspecified details with reasonable assumptions and mark them as assumptions.");
  }

  return constraints;
}

function buildOutputFormat(intent) {
  const base = [
    "Start with the final answer or recommendation.",
    "Use headings and bullets where they improve readability.",
    "End with next steps or a concise checklist when useful."
  ];

  if (intent === "copywriting") {
    return [
      "Hook",
      "Main message or body copy",
      "Benefits",
      "Call to action",
      "Optional variants"
    ];
  }

  if (intent === "code") {
    return [
      "Brief diagnosis or approach",
      "Implementation",
      "Important edge cases",
      "How to test"
    ];
  }

  return base;
}

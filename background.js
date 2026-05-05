"use strict";

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "general"
};

const VALID_MODES = new Set(["general", "coding", "study"]);

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

  if (looksAlreadyStructured(normalized)) {
    return refineStructuredPrompt(normalized, selectedMode);
  }

  if (selectedMode === "coding") {
    return buildCodingPrompt(normalized);
  }

  if (selectedMode === "study") {
    return buildStudyPrompt(normalized);
  }

  return buildGeneralPrompt(normalized);
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : DEFAULT_SETTINGS.mode;
}

function buildGeneralPrompt(normalized) {
  const intent = inferIntent(normalized);
  const role = inferRole(normalized, intent);
  const task = buildTask(normalized, intent);
  const constraints = buildConstraints(normalized, intent);
  const outputFormat = buildOutputFormat(intent);

  return [
    role,
    "",
    `Task: ${task}`,
    "",
    "Context:",
    "- Use the information in my request as the starting point.",
    "- If a required detail is missing, make a reasonable assumption and clearly label it.",
    "",
    "Constraints:",
    ...constraints.map((constraint) => `- ${constraint}`),
    "",
    "Output format:",
    ...outputFormat.map((line) => `- ${line}`)
  ].join("\n");
}

function buildCodingPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    "Act as a senior software engineer.",
    "",
    `Task: Solve the following technical problem clearly and correctly: "${cleaned}".`,
    "",
    "Requirements:",
    "- Provide clean, optimized, production-quality code when code is appropriate.",
    "- Explain the approach and why it solves the problem.",
    "- Follow modern best practices for readability, maintainability, and security.",
    "- Call out assumptions and any missing details.",
    "",
    "Edge cases:",
    "- Identify important edge cases and failure modes.",
    "- Explain how to test the solution.",
    "",
    "Output format:",
    "- Approach",
    "- Code or implementation steps",
    "- Explanation",
    "- Edge cases",
    "- Testing notes"
  ].join("\n");
}

function buildStudyPrompt(normalized) {
  const cleaned = stripWeakLeadIn(normalized);

  return [
    "Act as a patient teacher.",
    "",
    `Task: Explain the following concept in a simple and structured way: "${cleaned}".`,
    "",
    "Teaching requirements:",
    "- Start with a plain-language explanation.",
    "- Break the concept down step by step.",
    "- Include clear examples or analogies where useful.",
    "- Define important terms before using them deeply.",
    "- Keep the explanation beginner-friendly without being shallow.",
    "",
    "Output format:",
    "- Short answer",
    "- Step-by-step explanation",
    "- Examples",
    "- Common mistakes or misconceptions",
    "- Quick recap"
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
    study: "Before answering, treat this as a study task: explain simply, use examples, and break the answer down step by step."
  };

  return [
    prompt,
    "",
    modeInstruction[normalizeMode(mode)]
  ].join("\n");
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

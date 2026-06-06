"use strict";

importScripts(
  "core/typoHandler.js",
  "core/subjectQualityEngine.js",
  "core/domainRouter.js",
  "core/semanticReconstructionEngine.js",
  "core/hinglishNormalizer.js",
  "core/taskChainDetector.js",
  "core/emotionDetector.js",
  "core/metaTaskDetector.js",
  "core/semanticSubjectExtractor.js",
  "core/intentGraph.js",
  "core/promptConstructor.js",
  "core/inputUnderstandingEngine.js",
  "core/conflictResolver.js",
  "core/comparisonBuilder.js",
  "core/fallbackRegistry.js",
  "core/roleRegistry.js",
  "core/naturalizationLayer.js",
  "core/semanticValidator.js",
  "core/routingEngine.js"
);

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

    sendResponse({
      ok: true,
      improvedPrompt: improvePrompt(originalPrompt, message.mode)
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

  if (message.type === "PROMPTBOOST_REGISTER_TAB") {
    sendResponse({
      ok: true,
      tabId: _sender && _sender.tab && Number.isInteger(_sender.tab.id) ? String(_sender.tab.id) : ""
    });

    return false;
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

function improvePrompt(input, mode = "general") {
  return PromptBoostRoutingEngine.improvePrompt(input, normalizeMode(mode));
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : DEFAULT_SETTINGS.mode;
}

function isChatGptUrl(url) {
  return /^https:\/\/(chat\.openai\.com|chatgpt\.com)\//i.test(url);
}

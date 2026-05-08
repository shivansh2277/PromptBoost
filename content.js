"use strict";

const PROMPTBOOST_ID = "promptboost-controls";
const PROMPTBOOST_BUTTON_ID = "promptboost-improve-button";
const PROMPTBOOST_TOGGLE_ID = "promptboost-toggle-button";
const PROMPTBOOST_MODE_ID = "promptboost-mode-toggle";
const PROMPTBOOST_TAB_GENERATED_KEY = "promptboost.generatedInThisTab";
const COMPOSER_SCAN_INTERVAL_MS = 3000;
const COMPOSER_SCAN_DEBOUNCE_MS = 500;
const PROMPTBOOST_MODES = [
  { id: "general", label: "General", icon: "General" },
  { id: "coding", label: "Coding", icon: "Code" },
  { id: "study", label: "Study", icon: "Study" }
];

let currentComposer = null;
let controls = null;
let enabled = true;
let selectedMode = "general";
let isImproving = false;
let scanTimer = null;
let scheduledScan = null;
let observer = null;
let staleGeneratedDraftCleanupDone = false;

initPromptBoost();

function initPromptBoost() {
  chrome.runtime.sendMessage({ type: "PROMPTBOOST_GET_SETTINGS" }, (response) => {
    if (!chrome.runtime.lastError && response && response.ok) {
      enabled = response.settings.enabled !== false;
      selectedMode = normalizeMode(response.settings.mode);
    }

    mountWhenReady();
    bindRuntimeMessages();
    bindKeyboardShortcut();
    bindStorageUpdates();
  });
}

function mountWhenReady() {
  refreshComposer();

  observer = new MutationObserver((mutations) => {
    if (mutations.every(isPromptBoostMutation)) {
      return;
    }

    scheduleComposerRefresh();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  scanTimer = window.setInterval(refreshComposer, COMPOSER_SCAN_INTERVAL_MS);
  window.addEventListener("beforeunload", cleanup);
}

function refreshComposer() {
  scheduledScan = null;

  const composer = findComposer();

  if (!composer) {
    return;
  }

  if (composer === currentComposer) {
    clearStaleGeneratedDraft(composer);
    return;
  }

  if (currentComposer) {
    currentComposer.removeEventListener("input", updateControlsState);
  }

  currentComposer = composer;
  currentComposer.addEventListener("input", updateControlsState);
  mountControls(composer);
  clearStaleGeneratedDraft(composer);
}

function findComposer() {
  const selectors = [
    "#prompt-textarea",
    "textarea[data-testid*='composer']",
    "textarea[placeholder*='Message']",
    "textarea[placeholder*='Ask']",
    "[contenteditable][data-testid*='composer']",
    "[contenteditable].ProseMirror",
    "form textarea",
    "form [contenteditable]"
  ];

  const candidates = uniqueElements(
    selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
  ).filter(isUsableInput);

  if (!candidates.length) {
    return null;
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return candidates
    .map((element) => ({
      element,
      rect: element.getBoundingClientRect(),
      textLength: getComposerText(element).length
    }))
    .filter(({ rect }) => rect.width > 120 && rect.height > 20)
    .sort((a, b) => {
      const aBottomScore = Math.abs(viewportHeight - a.rect.bottom);
      const bBottomScore = Math.abs(viewportHeight - b.rect.bottom);
      return aBottomScore - bBottomScore || b.textLength - a.textLength;
    })[0].element;
}

function isUsableInput(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();
  const placeholder = (element.getAttribute("placeholder") || "").toLowerCase();
  const dataTestId = (element.getAttribute("data-testid") || "").toLowerCase();

  if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) {
    return false;
  }

  if (element.matches("textarea")) {
    return true;
  }

  if (element.isContentEditable) {
    return (
      element.closest("form") ||
      ariaLabel.includes("message") ||
      ariaLabel.includes("prompt") ||
      placeholder.includes("message") ||
      placeholder.includes("prompt") ||
      dataTestId.includes("composer") ||
      element.classList.contains("ProseMirror")
    );
  }

  return false;
}

function mountControls(composer) {
  if (!controls) {
    controls = createControls();
  }

  const host = findComposerHost(composer);

  if (!host || host.contains(controls)) {
    updateControlsState();
    return;
  }

  host.classList.add("promptboost-host");
  host.appendChild(controls);
  updateControlsState();
}

function scheduleComposerRefresh() {
  if (scheduledScan) {
    return;
  }

  scheduledScan = window.setTimeout(refreshComposer, COMPOSER_SCAN_DEBOUNCE_MS);
}

function isPromptBoostMutation(mutation) {
  const target = mutation.target;

  if (target instanceof HTMLElement && target.closest(`#${PROMPTBOOST_ID}, .promptboost-toast`)) {
    return true;
  }

  return [...mutation.addedNodes, ...mutation.removedNodes].every((node) => {
    return (
      node instanceof HTMLElement &&
      (node.id === PROMPTBOOST_ID ||
        node.classList.contains("promptboost-toast") ||
        Boolean(node.closest(`#${PROMPTBOOST_ID}, .promptboost-toast`)))
    );
  });
}

function uniqueElements(elements) {
  return [...new Set(elements)];
}

function findComposerHost(composer) {
  return (
    composer.closest("form") ||
    composer.closest("[data-testid*='composer']") ||
    composer.parentElement ||
    document.body
  );
}

function createControls() {
  const wrapper = document.createElement("div");
  wrapper.id = PROMPTBOOST_ID;
  wrapper.className = "promptboost-controls";

  const improveButton = document.createElement("button");
  improveButton.id = PROMPTBOOST_BUTTON_ID;
  improveButton.className = "promptboost-button";
  improveButton.type = "button";
  improveButton.title = "Improve your prompt";
  improveButton.setAttribute("aria-label", "Improve your prompt");
  improveButton.textContent = "Improve Prompt";
  improveButton.addEventListener("click", () => {
    improveCurrentPrompt();
  });

  const modeToggle = createModeToggle();

  const toggleButton = document.createElement("button");
  toggleButton.id = PROMPTBOOST_TOGGLE_ID;
  toggleButton.className = "promptboost-toggle";
  toggleButton.type = "button";
  toggleButton.title = "Turn PromptBoost on or off";
  toggleButton.setAttribute("aria-label", "Turn PromptBoost on or off");
  toggleButton.addEventListener("click", () => {
    setEnabled(!enabled);
  });

  wrapper.append(modeToggle, improveButton, toggleButton);
  return wrapper;
}

function createModeToggle() {
  const modeToggle = document.createElement("div");
  modeToggle.id = PROMPTBOOST_MODE_ID;
  modeToggle.className = "promptboost-mode-toggle";
  modeToggle.setAttribute("role", "radiogroup");
  modeToggle.setAttribute("aria-label", "Prompt improvement mode");

  for (const mode of PROMPTBOOST_MODES) {
    const button = document.createElement("button");
    button.className = "promptboost-mode-option";
    button.type = "button";
    button.dataset.mode = mode.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-label", `${mode.label} mode`);
    button.title = `${mode.label} mode`;
    button.textContent = mode.icon;
    button.addEventListener("click", () => {
      setMode(mode.id);
    });

    modeToggle.appendChild(button);
  }

  return modeToggle;
}

function updateControlsState() {
  if (!controls) {
    return;
  }

  const improveButton = controls.querySelector(`#${PROMPTBOOST_BUTTON_ID}`);
  const toggleButton = controls.querySelector(`#${PROMPTBOOST_TOGGLE_ID}`);
  const modeButtons = controls.querySelectorAll(".promptboost-mode-option");
  const hasText = currentComposer ? getComposerText(currentComposer).trim().length > 0 : false;

  controls.classList.toggle("promptboost-disabled", !enabled);

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === selectedMode;
    button.classList.toggle("promptboost-mode-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
    button.disabled = isImproving;
  });

  if (improveButton) {
    improveButton.disabled = !enabled || isImproving || !hasText;
    improveButton.textContent = isImproving ? "Improving..." : "Improve Prompt";
  }

  if (toggleButton) {
    toggleButton.textContent = enabled ? "On" : "Off";
    toggleButton.setAttribute("aria-pressed", String(enabled));
  }
}

function bindRuntimeMessages() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "PROMPTBOOST_COMMAND_IMPROVE") {
      improveCurrentPrompt();
    }
  });
}

function bindKeyboardShortcut() {
  document.addEventListener(
    "keydown",
    (event) => {
      if (!isImproveShortcut(event)) {
        return;
      }

      const active = document.activeElement;

      if (!currentComposer || (active !== currentComposer && !currentComposer.contains(active))) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      improveCurrentPrompt();
    },
    true
  );
}

function isImproveShortcut(event) {
  return event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === "Enter";
}

function bindStorageUpdates() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.enabled) {
      enabled = changes.enabled.newValue !== false;
    }

    if (changes.mode) {
      selectedMode = normalizeMode(changes.mode.newValue);
    }

    updateControlsState();
  });
}

function setEnabled(nextEnabled) {
  enabled = nextEnabled;
  updateControlsState();

  chrome.runtime.sendMessage({
    type: "PROMPTBOOST_SET_ENABLED",
    enabled: nextEnabled
  });
}

function setMode(mode) {
  selectedMode = normalizeMode(mode);
  updateControlsState();

  chrome.runtime.sendMessage({
    type: "PROMPTBOOST_SET_MODE",
    mode: selectedMode
  });
}

function normalizeMode(mode) {
  return PROMPTBOOST_MODES.some((item) => item.id === mode) ? mode : "general";
}

function improveCurrentPrompt() {
  if (!enabled || isImproving) {
    return;
  }

  refreshComposer();

  if (!currentComposer) {
    showToast("ChatGPT input was not found.");
    return;
  }

  const prompt = getComposerText(currentComposer).trim();

  if (!prompt) {
    showToast("Enter a prompt first.");
    updateControlsState();
    return;
  }

  isImproving = true;
  updateControlsState();

  chrome.runtime.sendMessage(
    {
      type: "PROMPTBOOST_IMPROVE",
      prompt,
      mode: selectedMode
    },
    (response) => {
      isImproving = false;

      if (chrome.runtime.lastError) {
        showToast("PromptBoost could not connect. Reload ChatGPT and try again.");
        updateControlsState();
        return;
      }

      if (!response || !response.ok) {
        showToast((response && response.error) || "PromptBoost could not improve this prompt.");
        updateControlsState();
        return;
      }

      markPromptGeneratedInThisTab();
      setComposerText(currentComposer, response.improvedPrompt);
      showToast("Prompt improved.");
      updateControlsState();
    }
  );
}

function clearStaleGeneratedDraft(composer) {
  if (staleGeneratedDraftCleanupDone || wasPromptGeneratedInThisTab()) {
    return;
  }

  const currentText = getComposerText(composer).trim();

  if (!isPromptBoostGeneratedPrompt(currentText)) {
    return;
  }

  staleGeneratedDraftCleanupDone = true;
  setComposerText(composer, "", { focus: false });
  updateControlsState();
}

function isPromptBoostGeneratedPrompt(text) {
  if (!text) {
    return false;
  }

  const knownRolePrefixes = [
    "Act as a senior software engineer and technical reviewer.",
    "Act as a professional direct-response copywriter.",
    "Act as an expert editor and content strategist.",
    "Act as a rigorous analyst with strong critical thinking.",
    "Act as an experienced strategist and execution planner.",
    "Act as an expert teacher who explains concepts clearly.",
    "Act as an expert assistant.",
    "Act as a senior software engineer.",
    "Act as a patient teacher.",
    "Act as an expert social media copywriter and growth marketer.",
    "Act as an expert writer and editor.",
    "Act as a rigorous research analyst.",
    "Improve this request into a clear, useful prompt:",
    "Solve this programming problem:",
    "Explain this simply:",
    "Create marketing copy for this request:",
    "Improve or write this clearly:",
    "Analyze this with a practical, evidence-aware approach:"
  ];

  return (
    knownRolePrefixes.some((prefix) => text.startsWith(prefix)) &&
    (text.includes("\n\nTask:") || text.includes("\n\nReturn:"))
  );
}

function markPromptGeneratedInThisTab() {
  try {
    window.sessionStorage.setItem(PROMPTBOOST_TAB_GENERATED_KEY, "1");
  } catch (_error) {
    // Session storage can be unavailable in hardened browser modes.
  }
}

function wasPromptGeneratedInThisTab() {
  try {
    return window.sessionStorage.getItem(PROMPTBOOST_TAB_GENERATED_KEY) === "1";
  } catch (_error) {
    return false;
  }
}

function getComposerText(composer) {
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    return composer.value || "";
  }

  return (composer.innerText || composer.textContent || "").trim();
}

function setComposerText(composer, text, options = {}) {
  const shouldFocus = options.focus !== false;

  if (shouldFocus) {
    composer.focus();
  }

  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(composer), "value").set;
    nativeSetter.call(composer, text);
    composer.dispatchEvent(new Event("input", { bubbles: true }));
    composer.dispatchEvent(new Event("change", { bubbles: true }));
    resizeTextarea(composer);
    return;
  }

  if (!shouldFocus) {
    composer.textContent = text;
    composer.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: text ? "insertText" : "deleteContentBackward",
      data: text
    }));
    composer.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  replaceContentEditableText(composer, text);
}

function replaceContentEditableText(element, text) {
  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);

  const inserted = document.execCommand("insertText", false, text);

  if (!inserted) {
    element.textContent = text;
  }

  element.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: text
  }));

  element.dispatchEvent(new Event("change", { bubbles: true }));
  placeCaretAtEnd(element);
}

function placeCaretAtEnd(element) {
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function resizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function showToast(message) {
  const existingToast = document.querySelector(".promptboost-toast");

  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "promptboost-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("promptboost-toast-hide");
  }, 2200);

  window.setTimeout(() => {
    toast.remove();
  }, 2800);
}

function cleanup() {
  if (observer) {
    observer.disconnect();
  }

  if (scanTimer) {
    window.clearInterval(scanTimer);
  }

  if (scheduledScan) {
    window.clearTimeout(scheduledScan);
  }

}

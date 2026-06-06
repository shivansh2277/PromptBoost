"use strict";

(function attachPromptBoostHinglishNormalizer(globalScope) {
  const WORDS = {
    mera: "my",
    meri: "my",
    mere: "my",
    apne: "my",
    apna: "my",
    karo: "do",
    karna: "do",
    likhna: "write",
    likho: "write",
    banana: "create",
    banao: "create",
    mein: "in",
    me: "in",
    par: "on",
    liye: "for",
    ke: "for"
  };

  function normalize(input) {
    let text = String(input || "").toLowerCase();
    let hasHinglish = false;

    for (const word of Object.keys(WORDS)) {
      if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
        hasHinglish = true;
      }
    }

    if (!hasHinglish) {
      return {
        hasHinglish: false,
        normalizedText: String(input || ""),
        taskHint: "",
        subjectHint: ""
      };
    }

    text = text
      .replace(/\bke\s+liye\b/g, "for")
      .replace(/\bpython\s+mein\b/g, "in python")
      .replace(/\bcode\s+fix\s+karo\b/g, "fix code")
      .replace(/\blinkedin\s+post\s+likhna\s+hai\b/g, "write linkedin post")
      .replace(/\bstartup\s+ke\s+liye\b/g, "for startup");

    const translated = text
      .split(/\s+/)
      .map((token) => WORDS[token] || token)
      .join(" ")
      .replace(/\bmy\s+code\s+fix\s+do\b/g, "fix my code")
      .replace(/\bfix\s+do\b/g, "fix")
      .replace(/\bwrite\s+hai\b/g, "write")
      .replace(/\s+/g, " ")
      .trim();

    return {
      hasHinglish,
      normalizedText: translated,
      taskHint: detectTask(translated),
      subjectHint: extractSubject(translated)
    };
  }

  function detectTask(text) {
    if (/\bfix|debug\b/.test(text) && /\bcode|python|javascript|api\b/.test(text)) {
      return "debugging";
    }

    if (/\blinkedin\b/.test(text)) {
      return "linkedin_post";
    }

    if (/\binstagram|caption\b/.test(text)) {
      return "instagram_caption";
    }

    if (/\bwrite\b/.test(text)) {
      return "writing";
    }

    return "";
  }

  function extractSubject(text) {
    if (/\bpython\b/.test(text) && /\bcode\b/.test(text)) {
      return "python code";
    }

    if (/\bstartup\b/.test(text)) {
      return "startup";
    }

    return "";
  }

  globalScope.PromptBoostHinglishNormalizer = {
    normalize
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

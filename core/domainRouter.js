"use strict";

(function attachPromptBoostDomainRouter(globalScope) {
  function detect(text) {
    const lower = String(text || "").toLowerCase();
    const platform = detectPlatform(lower);
    const domain = detectDomain(lower);
    const language = detectLanguage(lower);
    const framework = detectFramework(lower);

    return {
      platform,
      domain,
      language,
      languageLabel: labelLanguage(language),
      framework
    };
  }

  function detectPlatform(text) {
    if (/\blinkedin\b/.test(text)) return "linkedin";
    if (/\binstagram|insta\b/.test(text)) return "instagram";
    if (/\btwitter\b|\bx\b/.test(text)) return "x";
    if (/\byoutube\b/.test(text)) return "youtube";
    if (/\btiktok\b/.test(text)) return "tiktok";
    if (/\bblog\b/.test(text)) return "blog";
    if (/\bemail\b/.test(text)) return "email";
    return "";
  }

  function detectDomain(text) {
    if (/\bbackend|api|server|database|mongodb|sql\b/.test(text)) return "backend/api";
    if (/\bfrontend|ui|react|vue|css|html\b/.test(text)) return "frontend";
    if (/\bgym|fitness|workout|protein\b/.test(text)) return "fitness";
    if (/\bproject|portfolio|startup|app\b/.test(text)) return "project";
    if (/\bexam|interview|revision|chapter|notes\b/.test(text)) return "education";
    return "";
  }

  function detectLanguage(text) {
    if (/\bpython\b/.test(text)) return "python";
    if (/\bjavascript|js\b/.test(text)) return "javascript";
    if (/(^|[^a-z0-9+#])c\+\+($|[^a-z0-9+#])|\bcpp\b/.test(text)) return "c++";
    if (/\bc\b/.test(text)) return "c";
    if (/\bjava\b/.test(text)) return "java";
    if (/\bsql\b/.test(text)) return "sql";
    return "";
  }

  function detectFramework(text) {
    if (/\breact\b/.test(text)) return "react";
    if (/\bvue\b/.test(text)) return "vue";
    if (/\bnode\b/.test(text)) return "node";
    if (/\bexpress\b/.test(text)) return "express";
    if (/\bmongodb\b/.test(text)) return "mongodb";
    return "";
  }

  function labelLanguage(language) {
    const labels = {
      python: "Python",
      javascript: "JavaScript",
      "c++": "C++",
      c: "C",
      java: "Java",
      sql: "SQL"
    };

    return labels[language] || "";
  }

  globalScope.PromptBoostDomainRouter = {
    detect
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

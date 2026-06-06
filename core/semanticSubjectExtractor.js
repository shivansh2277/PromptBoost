"use strict";

(function attachPromptBoostSemanticSubjectExtractor(globalScope) {
  function extract(input, hints = {}) {
    let subject = String(input || "")
      .replace(/\bemail\s+(a|an|the)\s+cold\s+to\b/gi, "cold email to")
      .replace(/\b(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan)\s+\1\b/gi, "$1")
      .replace(/^(help with|help me|please|can you|could you)\s+/i, "")
      .replace(/^(explain|write|create|generate|make|fix|debug|review|proofread|rewrite|compare|analyze|summarize|plan|improve|optimize)\s+/i, "")
      .replace(/\b(prompt|instruction|request)\b$/i, "")
      .replace(/\blinkedin\s+post\b/gi, "")
      .replace(/\binstagram\s+caption\b/gi, "")
      .replace(/\bemail\s+(a|an|the)\s+to\b/gi, "cold email to")
      .replace(/^email\s+/i, "")
      .replace(/\bfor\s+(a|an|the)\s*$/gi, "")
      .replace(/\babout\s+(a|an|the)\s*$/gi, "")
      .replace(/\b(for|about|to)\s+\1\b/gi, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (hints.subjectHint) {
      subject = hints.subjectHint;
    }

    return subject;
  }

  globalScope.PromptBoostSemanticSubjectExtractor = {
    extract
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

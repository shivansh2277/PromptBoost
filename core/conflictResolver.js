"use strict";

(function attachPromptBoostConflictResolver(globalScope) {
  function resolve(semantic) {
    const text = semantic.lower;
    const conflicts = [];
    const resolved = Object.assign({}, semantic, {
      depthInstruction: "",
      toneInstruction: semantic.tone || "",
      lengthInstruction: ""
    });

    if (/\b(deeply|in depth|deep dive|advanced|detailed)\b/.test(text) && /\b(beginner|beginners|simple|basics|eli5)\b/.test(text)) {
      conflicts.push("deep_beginner");
      resolved.depth = "deep_beginner";
      resolved.depthInstruction = "thorough but beginner-friendly";
    } else if (/\b(deeply|in depth|deep dive|advanced|detailed)\b/.test(text)) {
      resolved.depth = "deep";
      resolved.depthInstruction = "detailed and conceptually clear";
    } else if (/\b(beginner|beginners|simple|basics|eli5)\b/.test(text)) {
      resolved.depth = "beginner";
      resolved.depthInstruction = "simple and beginner-friendly";
    }

    if (/\b(quickly|quick|brief|short|concise)\b/.test(text) && /\b(in detail|detailed|deeply|comprehensive)\b/.test(text)) {
      conflicts.push("quick_detailed");
      resolved.lengthInstruction = "concise but complete";
      if (!resolved.depthInstruction) {
        resolved.depthInstruction = "focused and well structured";
      }
    } else if (/\b(quickly|quick|brief|short|concise)\b/.test(text)) {
      resolved.lengthInstruction = "concise";
    }

    if (/\bformal\b/.test(text) && /\b(casual|friendly|conversational|natural)\b/.test(text)) {
      conflicts.push("formal_casual");
      resolved.toneInstruction = "professional but natural";
    }

    if (/\bnegative\s+review|bad\s+review|complaint\b/.test(text) && /\b(ad|ad copy|sales|campaign)\b/.test(text)) {
      conflicts.push("negative_review_marketing");
      resolved.taskType = "review_response";
      resolved.context = "writing";
    }

    resolved.conflicts = conflicts;
    return resolved;
  }

  globalScope.PromptBoostConflictResolver = {
    resolve
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

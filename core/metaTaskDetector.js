"use strict";

(function attachPromptBoostMetaTaskDetector(globalScope) {
  function detect(input) {
    const text = String(input || "").toLowerCase();
    const isMetaTask = /\b(improve|optimize|rewrite|make better|make this better|enhance)\b.{0,20}\b(prompt|instruction|request)\b/.test(text) ||
      /\b(improve this prompt|rewrite this instruction|optimize this prompt|make this better)\b/.test(text);

    return {
      isMetaTask,
      taskType: isMetaTask ? "prompt_improvement" : ""
    };
  }

  globalScope.PromptBoostMetaTaskDetector = {
    detect
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

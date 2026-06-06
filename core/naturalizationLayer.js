"use strict";

(function attachPromptBoostNaturalizationLayer(globalScope) {
  function apply(prompt) {
    return String(prompt || "")
      .replace(/\bAct as an expert\b\.?\s*/gi, "")
      .replace(/\bYou are a professional\b\.?\s*/gi, "")
      .replace(/\b(strengths,\s*weaknesses,\s*)strengths,\s*weaknesses\b/gi, "$1")
      .replace(/\bprofessional but natural professional but natural\b/gi, "professional but natural")
      .replace(/\bclear and clear\b/gi, "clear")
      .replace(/\bInclude:\s*Include:/gi, "Include:")
      .replace(/\s+\./g, ".")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  globalScope.PromptBoostNaturalizationLayer = {
    apply
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

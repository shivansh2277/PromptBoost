"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const files = [
  "core/typoHandler.js",
  "core/subjectQualityEngine.js",
  "core/domainRouter.js",
  "core/semanticReconstructionEngine.js",
  "core/conflictResolver.js",
  "core/comparisonBuilder.js",
  "core/fallbackRegistry.js",
  "core/roleRegistry.js",
  "core/naturalizationLayer.js",
  "core/semanticValidator.js",
  "core/routingEngine.js"
];

const sandbox = { console, globalThis: {} };
sandbox.self = sandbox.globalThis;
vm.createContext(sandbox);

for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}

const engine = sandbox.globalThis.PromptBoostRoutingEngine;
const tests = [
  ["thing", /topic is missing|Structure the response/i],
  ["something", /topic is missing|Structure the response/i],
  ["help", /topic is missing|Structure the response/i],
  ["post", /topic is missing|Structure the response/i],
  ["caption for a", /Instagram caption|engaging caption|topic is missing/i],
  ["create a thing for instagram", /social media strategist|Instagram caption|hashtags/i],
  ["content for my business", /business content|email campaign|blog article|promotional copy/i],
  ["explain explain machine learning", /Explain machine learning/i],
  ["email a to my client", /professional but natural email to my client/i],
  ["blog post about for my blog", /structured blog post|blog post/i],
  ["react vs vue", /Compare React and Vue|practical research analyst/i],
  ["pros and cons remote work", /Compare|tradeoffs|recommendation/i],
  ["fix python api bug", /senior Python engineer|root cause/i],
  ["write ad for negative review", /customer experience lead|negative review|solution-oriented/i],
  ["explain recursion for interview", /technical interviewer|complexity|edge cases/i]
];

const forbidden = /post about a post|email about an email|explain explain|email a to|blog post about for|caption for a\b|for for|about about|deeply beginner-friendly|formal casual|ad copy for negative review/i;
let failed = 0;

for (const [input, expected] of tests) {
  const output = engine.improvePrompt(input, "general");
  const ok = expected.test(output) && !forbidden.test(output);

  if (!ok) {
    failed += 1;
    console.error(`FAIL: ${input}\n${output}\n`);
  }
}

if (failed > 0) {
  console.error(`PromptBoost v10 quality tests failed: ${tests.length - failed}/${tests.length} passed`);
  process.exit(1);
}

console.log(`PromptBoost v10 quality tests passed: ${tests.length}/${tests.length}`);

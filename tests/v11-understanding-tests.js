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
];

const sandbox = { console, globalThis: {} };
sandbox.self = sandbox.globalThis;
vm.createContext(sandbox);

for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}

const engine = sandbox.globalThis.PromptBoostRoutingEngine;
const tests = [
  ["mera code fix karo python mein", /senior Python engineer|Debug and fix|python code/i],
  ["linkedin post likhna hai apne startup ke liye", /LinkedIn content strategist|LinkedIn post about startup/i],
  ["Summarize this article then write a LinkedIn post", /Step 1: Summarize|Step 2: Create a LinkedIn post/i],
  ["My client is furious", /customer success manager|furious client|solution-oriented/i],
  ["improve this prompt", /prompt engineer|LLM-ready|expected output format/i],
  ["rewrite this instruction", /prompt engineer|Preserve the original goal|ambiguity/i],
  ["Explain explain machine learning", /Explain machine learning/i],
  ["email a cold to YC founder", /cold email to yc founder|email cold to yc founder/i],
  ["blog post explaining react debugging for beginners", /blog post|debugging|beginner-friendly/i],
  ["product launch post", /business content|social media post|promotional copy/i]
];

const forbidden = /explain explain|email a to|post about a post|about about|for for|generic fallback/i;
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
  console.error(`PromptBoost v11 understanding tests failed: ${tests.length - failed}/${tests.length} passed`);
  process.exit(1);
}

console.log(`PromptBoost v11 understanding tests passed: ${tests.length}/${tests.length}`);

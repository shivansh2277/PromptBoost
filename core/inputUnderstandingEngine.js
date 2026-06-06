"use strict";

(function attachPromptBoostInputUnderstandingEngine(globalScope) {
  function understand(input) {
    const raw = String(input || "").trim();
    const hinglish = globalScope.PromptBoostHinglishNormalizer.normalize(raw);
    const understoodText = hinglish.hasHinglish ? hinglish.normalizedText : raw;
    const chain = globalScope.PromptBoostTaskChainDetector.detect(understoodText);
    const emotion = globalScope.PromptBoostEmotionDetector.detect(understoodText);
    const meta = globalScope.PromptBoostMetaTaskDetector.detect(understoodText);
    const baseSemantic = globalScope.PromptBoostSemanticReconstructionEngine.reconstruct(understoodText);
    const subject = globalScope.PromptBoostSemanticSubjectExtractor.extract(understoodText, hinglish) || baseSemantic.subject;

    const primaryIntent = choosePrimaryIntent({ chain, emotion, meta, baseSemantic, hinglish });
    const graph = globalScope.PromptBoostIntentGraph.create({
      primaryIntent,
      secondaryIntents: collectSecondaryIntents(chain, emotion, meta, baseSemantic),
      subject,
      platform: baseSemantic.platform,
      emotionalSignals: emotion.signals,
      languageSignals: hinglish.hasHinglish ? ["hinglish"] : [],
      styleSignals: baseSemantic.tone ? [baseSemantic.tone] : [],
      metaTask: meta.taskType,
      chain,
      route: emotion.route || meta.taskType || primaryIntent,
      confidence: confidenceFor({ chain, emotion, meta, hinglish, baseSemantic })
    });

    return {
      raw,
      understoodText,
      graph,
      semantic: enrichSemantic(baseSemantic, graph, hinglish, subject),
      shouldConstructDirectly: shouldConstructDirectly(graph)
    };
  }

  function choosePrimaryIntent({ chain, emotion, meta, baseSemantic, hinglish }) {
    if (chain.hasChain) return "chained_task";
    if (meta.isMetaTask) return "prompt_improvement";
    if (emotion.route) return emotion.route;
    if (hinglish.taskHint) return hinglish.taskHint;
    return baseSemantic.taskType || "unknown";
  }

  function collectSecondaryIntents(chain, emotion, meta, baseSemantic) {
    const intents = [];
    const lower = baseSemantic.lower || "";
    if (chain.hasChain) intents.push(...chain.steps.map((step) => step.taskType));
    if (emotion.hasEmotion) intents.push("emotion_aware");
    if (meta.isMetaTask) intents.push("meta_prompt");
    if (baseSemantic.platform) intents.push(baseSemantic.platform);
    if (/\bexplain|explaining|teach|beginner|beginners\b/.test(lower)) intents.push("education");
    if (/\bdebug|debugging|bug|error|fix\b/.test(lower)) intents.push("debugging");
    if (/\bbeginner|beginners|simple\b/.test(lower)) intents.push("beginner");
    return [...new Set(intents)];
  }

  function confidenceFor({ chain, emotion, meta, hinglish, baseSemantic }) {
    if (chain.hasChain || emotion.route || meta.isMetaTask || hinglish.hasHinglish) return 92;
    if (baseSemantic.subjectQuality && baseSemantic.subjectQuality.usable) return 82;
    return 55;
  }

  function shouldConstructDirectly(graph) {
    return graph.chain.hasChain || graph.metaTask === "prompt_improvement" || graph.route === "de_escalation_response";
  }

  function enrichSemantic(semantic, graph, hinglish, subject) {
    const enriched = Object.assign({}, semantic, {
      inputGraph: graph,
      subject: subject || semantic.subject,
      languageSignals: graph.languageSignals,
      emotionalSignals: graph.emotionalSignals
    });

    if (hinglish.taskHint === "debugging") {
      enriched.taskType = "debugging";
      enriched.context = "coding";
      enriched.subject = hinglish.subjectHint || "code";
      enriched.language = /python/i.test(hinglish.normalizedText) ? "python" : enriched.language;
      enriched.languageLabel = enriched.language === "python" ? "Python" : enriched.languageLabel;
    }

    if (hinglish.taskHint === "linkedin_post") {
      enriched.taskType = "linkedin_post";
      enriched.context = "writing";
      enriched.platform = "linkedin";
      enriched.format = "linkedin_post";
      enriched.subject = hinglish.subjectHint || enriched.subject || "startup";
    }

    enriched.subjectQuality = globalScope.PromptBoostSubjectQualityEngine.score(enriched.subject, enriched);
    return enriched;
  }

  globalScope.PromptBoostInputUnderstandingEngine = {
    understand
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

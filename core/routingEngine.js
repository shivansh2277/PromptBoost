"use strict";

(function attachPromptBoostRoutingEngine(globalScope) {
  const HIGH_PRIORITY_TASKS = new Set([
    "comparison",
    "review_response",
    "linkedin_post",
    "instagram_caption",
    "blog_post",
    "debugging",
    "code_review",
    "exam_prep",
    "interview_prep"
  ]);

  function improvePrompt(input, mode = "general") {
    const understanding = globalScope.PromptBoostInputUnderstandingEngine
      ? globalScope.PromptBoostInputUnderstandingEngine.understand(input)
      : null;

    if (understanding && understanding.shouldConstructDirectly) {
      return globalScope.PromptBoostSemanticValidator.validateAndRepair(
        globalScope.PromptBoostNaturalizationLayer.apply(globalScope.PromptBoostPromptConstructor.build(understanding.graph)),
        understanding.semantic
      );
    }

    let semantic = understanding
      ? understanding.semantic
      : globalScope.PromptBoostSemanticReconstructionEngine.reconstruct(input);
    semantic = applyManualMode(semantic, mode);
    semantic = globalScope.PromptBoostConflictResolver.resolve(semantic);

    const route = routeTask(semantic);
    const prompt = route.useFallback
      ? globalScope.PromptBoostFallbackRegistry.build(route, semantic)
      : buildSpecialized(route, semantic);
    const rolePrompt = globalScope.PromptBoostRoleRegistry
      ? globalScope.PromptBoostRoleRegistry.applyRole(prompt, semantic)
      : prompt;

    return globalScope.PromptBoostSemanticValidator.validateAndRepair(
      globalScope.PromptBoostNaturalizationLayer.apply(rolePrompt),
      semantic
    );
  }

  function applyManualMode(semantic, mode) {
    if (mode === "coding" && !["debugging", "code_review", "optimization"].includes(semantic.taskType)) {
      return Object.assign({}, semantic, {
        context: "coding",
        taskType: /\b(review)\b/.test(semantic.lower) ? "code_review" : semantic.taskType === "unknown" ? "debugging" : semantic.taskType
      });
    }

    if (mode === "study" && !["exam_prep", "interview_prep", "deep_learning", "beginner_learning", "quick_revision"].includes(semantic.taskType)) {
      return Object.assign({}, semantic, {
        context: "study",
        taskType: /\binterview\b/.test(semantic.lower) ? "interview_prep" : /\bexam\b/.test(semantic.lower) ? "exam_prep" : "beginner_learning"
      });
    }

    return semantic;
  }

  function routeTask(semantic) {
    const priority = HIGH_PRIORITY_TASKS.has(semantic.taskType) ? "high" : "normal";
    const subjectScore = semantic.subjectQuality.score;
    const hasStrongSignal = priority === "high" || subjectScore >= 45 || semantic.entities.length >= 2;
    const useFallback = !hasStrongSignal || (!semantic.subjectQuality.usable && !HIGH_PRIORITY_TASKS.has(semantic.taskType));

    if (HIGH_PRIORITY_TASKS.has(semantic.taskType)) {
      return {
        taskType: semantic.taskType,
        context: semantic.context,
        priority,
        useFallback: needsDomainFallback(semantic)
      };
    }

    return {
      taskType: semantic.taskType,
      context: semantic.context,
      priority,
      useFallback
    };
  }

  function needsDomainFallback(semantic) {
    if (semantic.taskType === "comparison") {
      return semantic.entities.length < 2 && !semantic.subjectQuality.usable;
    }

    if (["linkedin_post", "instagram_caption", "blog_post"].includes(semantic.taskType)) {
      return !semantic.subjectQuality.usable;
    }

    return false;
  }

  function buildSpecialized(route, semantic) {
    const builders = {
      comparison: () => globalScope.PromptBoostComparisonBuilder.build(semantic),
      review_response: buildReviewResponse,
      linkedin_post: buildLinkedinPost,
      instagram_caption: buildInstagramCaption,
      blog_post: buildBlogPost,
      email: buildEmail,
      debugging: buildDebugging,
      code_review: buildCodeReview,
      optimization: buildOptimization,
      beginner_learning: buildBeginnerLearning,
      deep_learning: buildDeepLearning,
      exam_prep: buildExamPrep,
      interview_prep: buildInterviewPrep,
      quick_revision: buildQuickRevision,
      proofreading: buildProofreading,
      rewriting: buildRewriting,
      business_content: buildBusinessContent,
      ad_copy: buildAdCopy,
      analysis: buildAnalysis,
      planning: buildPlanning,
      brainstorming: buildBrainstorming
    };

    return (builders[route.taskType] || (() => globalScope.PromptBoostFallbackRegistry.build(route, semantic)))(semantic);
  }

  function subjectOrFallback(semantic, fallback) {
    return semantic.subjectQuality.usable ? semantic.subjectQuality.subject : fallback;
  }

  function buildReviewResponse(semantic) {
    const subject = subjectOrFallback(semantic, "a negative review");
    return `Write a calm, professional response to ${subject}. Acknowledge the concern, show empathy, avoid defensiveness, offer a helpful next step, and keep the tone solution-oriented.`;
  }

  function buildLinkedinPost(semantic) {
    const subject = subjectOrFallback(semantic, "the topic");
    return `Write a professional but conversational LinkedIn post about ${subject}. Include:
- strong opening hook
- core insight or problem
- key lesson or takeaway
- practical detail
- engaging closing CTA

Tone: thoughtful, authentic, and clear.`;
  }

  function buildInstagramCaption(semantic) {
    const subject = subjectOrFallback(semantic, "the topic");
    return `Write a short, engaging Instagram caption for ${subject}. Include:
- punchy hook
- concise message
- CTA
- relevant hashtags
- 3 caption variations`;
  }

  function buildBlogPost(semantic) {
    const subject = subjectOrFallback(semantic, "the topic");
    const graph = semantic.inputGraph || { secondaryIntents: [] };
    const extras = [];

    if (graph.secondaryIntents.includes("education")) {
      extras.push("explain the concept clearly for readers");
    }

    if (graph.secondaryIntents.includes("debugging")) {
      extras.push("include practical debugging context and examples");
    }

    if (graph.secondaryIntents.includes("beginner")) {
      extras.push("keep the explanation beginner-friendly");
    }

    const extraSentence = extras.length ? ` Also ${extras.join(", ")}.` : "";
    return `Write a structured blog post about ${subject}. Include a compelling title, engaging introduction, clear sections, practical examples, and a useful conclusion.${extraSentence}`;
  }

  function buildEmail(semantic) {
    const target = semantic.subjectQuality.usable ? semantic.subjectQuality.subject : (/\bclient\b/.test(semantic.lower) ? "to a client" : "for the situation");
    const tone = semantic.toneInstruction || semantic.tone || "professional but natural";
    const emailPhrase = /\bemail\b/i.test(target) ? target : `email ${target}`;
    return `Write a ${tone} ${emailPhrase}. Include a clear subject line, concise context, polite wording, and a specific next step.`;
  }

  function buildDebugging(semantic) {
    const label = semantic.languageLabel ? `${semantic.languageLabel} ` : "";
    const subject = subjectOrFallback(semantic, `${label}code`);
    return `Debug and fix the ${subject}. Identify the root cause, explain why it happens, provide the corrected ${label || ""}solution, and mention important edge cases or best practices.`;
  }

  function buildCodeReview(semantic) {
    const subject = subjectOrFallback(semantic, "code");
    return `Review the ${subject} for correctness, readability, maintainability, security, and best practices. List the most important issues first and suggest concrete improvements.`;
  }

  function buildOptimization(semantic) {
    const subject = subjectOrFallback(semantic, "code or system");
    return `Optimize the ${subject}. Identify bottlenecks, propose a cleaner or faster approach, explain tradeoffs, and mention performance impact or complexity where relevant.`;
  }

  function buildBeginnerLearning(semantic) {
    const subject = subjectOrFallback(semantic, "topic");
    const depth = semantic.depthInstruction || "beginner-friendly";
    return `Explain ${subject} in a ${depth} way. Use simple language, intuition, examples, common misconceptions, and a short recap.`;
  }

  function buildDeepLearning(semantic) {
    const subject = subjectOrFallback(semantic, "topic");
    const depth = semantic.depthInstruction || "detailed and conceptually clear";
    return `Explain ${subject} in a ${depth} way. Cover the core theory, technical details, examples, edge cases, and how the ideas connect.`;
  }

  function buildExamPrep(semantic) {
    const subject = subjectOrFallback(semantic, "topic");
    return `Prepare exam-focused notes on ${subject}. Include:
- key definitions
- core concepts
- step-by-step example
- common exam questions
- tricky mistakes
- quick recap`;
  }

  function buildInterviewPrep(semantic) {
    const subject = subjectOrFallback(semantic, "topic");
    return `Prepare interview notes on ${subject}. Include:
- definitions
- implementation approach
- complexity
- tradeoffs
- use cases
- edge cases
- common interview questions`;
  }

  function buildQuickRevision(semantic) {
    const subject = subjectOrFallback(semantic, "topic");
    return `Summarize ${subject} for quick revision. Include the main ideas, key terms, important examples, and a compact recap.`;
  }

  function buildProofreading(semantic) {
    const subject = subjectOrFallback(semantic, "the text");
    return `Proofread ${subject}. Fix grammar, spelling, punctuation, clarity, and awkward phrasing without changing the original meaning.`;
  }

  function buildRewriting(semantic) {
    const subject = subjectOrFallback(semantic, "the text");
    return `Rewrite ${subject} to make it clearer, smoother, and more natural while preserving the original meaning.`;
  }

  function buildAdCopy(semantic) {
    const subject = subjectOrFallback(semantic, "a product or service");
    return `Write persuasive ad copy for ${subject}. Include:
- strong hook
- clear benefit
- audience-aware angle
- concise CTA
- 3 variations`;
  }

  function buildBusinessContent() {
    return `Create business content. Provide guidance for:
- social media post
- email campaign
- blog article
- promotional copy

Include tone recommendations, structure, and practical examples.`;
  }

  function buildAnalysis(semantic) {
    const subject = subjectOrFallback(semantic, "the topic");
    return `Analyze ${subject} with a clear, practical structure. Cover key factors, tradeoffs, risks, assumptions, and a concise recommendation.`;
  }

  function buildPlanning(semantic) {
    const subject = subjectOrFallback(semantic, "the goal");
    return `Create a practical plan for ${subject}. Break it into clear steps, priorities, dependencies, and next actions.`;
  }

  function buildBrainstorming(semantic) {
    const subject = subjectOrFallback(semantic, "the goal");
    return `Generate useful ideas for ${subject}. Group them by angle, explain the strongest options briefly, and keep them practical.`;
  }

  globalScope.PromptBoostRoutingEngine = {
    improvePrompt,
    routeTask
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

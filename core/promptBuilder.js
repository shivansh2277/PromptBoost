"use strict";

(function attachPromptBoostPromptBuilder(globalScope) {
  function buildPrompt({ normalized, context, taskType, metadata }) {
    const subject = metadata.topic;
    const role = globalScope.PromptBoostRoleEngine.getRolePhrase(context, taskType, metadata);
    const body = buildByContext(context, taskType, subject, metadata);
    return role ? `${role}\n\n${body}` : body;
  }

  function refineStructuredPrompt({ normalized, context, taskType, metadata }) {
    const role = globalScope.PromptBoostRoleEngine.getRolePhrase(context, taskType, metadata);
    const guidance = {
      coding: "Keep the request implementation-focused. Ask for readable code when relevant, a brief explanation, edge cases, and test notes.",
      study: "Keep the request learner-friendly. Ask for simple explanation, examples, step-by-step breakdown, and a short recap.",
      writing: "Keep the request polished and natural. Preserve the meaning while improving tone, structure, and clarity.",
      marketing: "Keep the request audience-aware. Ask for a stronger hook, clear benefits, concise CTA, and platform fit.",
      research: "Keep the request analytical. Ask for balanced comparison, assumptions, tradeoffs, and practical recommendations.",
      general: "Clarify the goal, add only useful constraints, and ask for a practical output format."
    };

    return `${normalized.text}\n\n${role ? `${role}\n` : ""}${guidance[context] || guidance.general}`;
  }

  function buildByContext(context, taskType, subject, metadata) {
    const builders = {
      coding: buildCoding,
      study: buildStudy,
      writing: buildWriting,
      marketing: buildMarketing,
      research: buildResearch,
      general: buildGeneral
    };

    return (builders[context] || buildGeneral)(taskType, subject, metadata);
  }

  function buildCoding(taskType, subject, metadata) {
    const label = metadata.languageLabel ? `${metadata.languageLabel} ` : "";
    const builders = {
      debugging: () => `Debug and fix the ${subject}. Identify the root cause, explain why it happens, provide the corrected ${label}solution, and mention important edge cases or best practices.`,
      explanation: () => `Explain ${subject} clearly. Define the key concepts, walk through the logic step by step, and include a small example if useful.`,
      feature_build: () => `Build ${subject}. Include an implementation plan, core architecture, important security or data-handling considerations, and a practical testing checklist.`,
      optimization: () => `Optimize ${subject}. Identify the bottleneck, propose a faster or cleaner approach, explain tradeoffs, and mention complexity or performance impact where relevant.`,
      review: () => `Review ${subject} for correctness, readability, maintainability, security, and best practices. Point out issues and suggest concrete improvements.`,
      refactor: () => `Refactor ${subject} for clarity, maintainability, and performance without changing behavior. Explain the main improvements and show the revised structure or code.`,
      default: () => `Solve ${subject} with efficient, readable code. Include the implementation, brief explanation, edge cases, and test notes.`
    };

    return (builders[taskType] || builders.default)();
  }

  function buildStudy(taskType, subject) {
    const builders = {
      exam_prep: () => `Explain ${subject} for exam preparation. Cover:\n- key definitions\n- core idea\n- step-by-step example\n- common exam questions\n- tricky edge cases or misconceptions\n- quick recap`,
      interview_prep: () => `Prepare for interview questions on ${subject}. Cover:\n- key definitions\n- implementation approach\n- complexity\n- tradeoffs\n- use cases\n- common interview questions\n- edge cases`,
      beginner_learning: () => `Explain ${subject} in a beginner-friendly way. Use simple examples, an analogy or memory aid, a step-by-step breakdown, common misconceptions, and a short recap.`,
      quick_summary: () => `Summarize ${subject} clearly for quick revision. Include the main points, important terms, and a compact recap.`,
      conceptual_breakdown: () => `Break down ${subject} conceptually. Explain the intuition, why it works, examples, edge cases, and how to remember it.`
    };

    return (builders[taskType] || builders.beginner_learning)();
  }

  function buildWriting(taskType, subject, metadata) {
    const tone = metadata.tone || "natural";
    const builders = {
      linkedin_post: () => `Write a professional but conversational LinkedIn post about ${subject}. Include:\n- strong opening hook\n- problem solved\n- what was built\n- key learnings or features\n- engaging closing CTA\n\nTone:\nthoughtful, authentic, builder-focused.`,
      email: () => `Write a clear ${tone} email about ${subject}. Include a useful subject line, concise body, polite context, and a clear next step.`,
      review_response: () => `Write a professional and thoughtful response to a negative review about ${subject}. Keep the tone calm, empathetic, and solution-oriented. Acknowledge the concern, offer a helpful next step, and avoid sounding defensive.`,
      storytelling: () => `Write ${subject} as an engaging story. Include a clear setup, character motivation, conflict, vivid details, and a satisfying ending or next beat.`,
      rewriting: () => `Rewrite ${subject} to make it clearer, smoother, and more natural while preserving the original meaning.`,
      proofreading: () => `Proofread and correct ${subject}. Fix grammar, spelling, punctuation, and awkward phrasing without changing the meaning.`
    };

    return (builders[taskType] || builders.rewriting)();
  }

  function buildMarketing(taskType, subject, metadata) {
    const platformName = metadata.platform ? formatPlatform(metadata.platform) : "social media";
    const builders = {
      social_caption: () => `Write a short, high-engagement ${platformName} caption for ${subject}. Make it engaging, concise, and audience-relevant. Include 3 caption variations and relevant hashtags.`,
      ad_copy: () => `Write persuasive ad copy for ${subject || "a product or service"}. Include:\n- strong opening hook\n- clear benefits\n- concise CTA\n- audience-aware tone\n\nProvide 3 variations.`,
      hook_generation: () => `Generate strong hooks for ${subject}. Make them concise, curiosity-driven, and tailored to the target audience. Provide multiple angles.`,
      CTA_generation: () => `Create concise call-to-action options for ${subject}. Make them clear, action-oriented, and aligned with the likely user intent.`,
      product_description: () => `Write a compelling product description for ${subject}. Highlight the target customer, key benefits, differentiators, and a clear buying reason.`,
      general_marketing: () => `Create concise, audience-aware marketing content for ${subject}. Include a strong hook, clear benefit, practical CTA, and 2-3 useful variations.`
    };

    return (builders[taskType] || builders.general_marketing)();
  }

  function formatPlatform(platform) {
    const labels = {
      instagram: "Instagram",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      youtube: "YouTube",
      twitter: "Twitter",
      x: "X"
    };

    return labels[platform] || platform;
  }

  function buildResearch(taskType, subject) {
    const builders = {
      comparison: () => `Compare ${subject} using clear criteria. Cover strengths, weaknesses, pricing or tradeoffs where relevant, best use cases, and a practical recommendation.`,
      analysis: () => `Analyze ${subject} with a balanced, evidence-aware structure. Cover key factors, assumptions, risks, tradeoffs, and practical conclusions.`,
      market_research: () => `Research ${subject} from a market perspective. Cover major players, trends, pricing, opportunities, risks, and future growth potential.`,
      pros_cons: () => `Analyze the pros and cons of ${subject}. Present a balanced view, explain tradeoffs, and end with a practical recommendation.`
    };

    return (builders[taskType] || builders.analysis)();
  }

  function buildGeneral(taskType, subject) {
    const builders = {
      planning: () => `Create a practical plan for ${subject}. Break it into clear steps, priorities, and next actions.`,
      checklist: () => `Create a concise checklist for ${subject}. Organize it into clear, actionable items.`,
      brainstorming: () => `Generate useful ideas for ${subject}. Group them by angle, explain the strongest options briefly, and keep them practical.`,
      general: () => `Help with ${subject}. Clarify the goal, make the response practical, and use a clear structure.`
    };

    return (builders[taskType] || builders.general)();
  }

  globalScope.PromptBoostPromptBuilder = {
    buildPrompt,
    refineStructuredPrompt
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

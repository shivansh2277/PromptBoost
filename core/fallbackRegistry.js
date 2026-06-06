"use strict";

(function attachPromptBoostFallbackRegistry(globalScope) {
  function build(route, semantic) {
    const builders = {
      linkedin_post: linkedinFallback,
      instagram_caption: instagramFallback,
      blog_post: blogFallback,
      comparison: comparisonFallback,
      debugging: debuggingFallback,
      code_review: codeReviewFallback,
      email: emailFallback,
      beginner_learning: educationFallback,
      deep_learning: deepFallback,
      exam_prep: examFallback,
      interview_prep: interviewFallback,
      business_content: businessContentFallback,
      ad_copy: marketingFallback,
      unknown: unknownFallback
    };

    return (builders[route.taskType] || builders[semantic.taskType] || builders.unknown)(semantic);
  }

  function linkedinFallback() {
    return `Write a professional LinkedIn post with:
- strong opening hook
- core insight or problem
- key takeaway
- authentic, conversational tone
- engaging closing CTA`;
  }

  function instagramFallback() {
    return `Write an engaging Instagram caption.
Include:
- strong hook
- concise caption
- CTA
- relevant hashtags
- 3 tone variations`;
  }

  function blogFallback() {
    return `Write a structured blog post once the topic is clear. Include:
- compelling title
- engaging introduction
- organized sections
- practical examples
- useful conclusion`;
  }

  function comparisonFallback() {
    return `Compare the options using:
- strengths
- weaknesses
- tradeoffs
- best use cases
- practical recommendation`;
  }

  function debuggingFallback(semantic) {
    const label = semantic.languageLabel ? `${semantic.languageLabel} ` : "";
    return `Debug the ${label}issue using the provided code or error details. Identify the root cause, explain the fix briefly, provide the corrected code, and mention important edge cases.`;
  }

  function codeReviewFallback() {
    return "Review the code for correctness, readability, maintainability, security, and best practices. List concrete issues first, then suggest focused improvements.";
  }

  function emailFallback(semantic) {
    const audience = /\bclient\b/i.test(semantic.lower) ? " to a client" : "";
    return `Write a professional but natural email${audience}. Include a clear subject line, concise context, polite wording, and a specific next step.`;
  }

  function educationFallback() {
    return "Explain the topic clearly with simple language, examples, step-by-step structure, common misconceptions, and a short recap.";
  }

  function deepFallback() {
    return "Explain the topic with conceptual depth. Cover the core theory, technical details, examples, edge cases, and how the ideas connect.";
  }

  function examFallback() {
    return `Prepare exam-focused notes for the topic. Include:
- key definitions
- core concepts
- worked examples
- common exam questions
- mistakes to avoid
- quick recap`;
  }

  function interviewFallback() {
    return `Prepare interview notes for the topic. Include:
- definitions
- implementation approach
- complexity
- tradeoffs
- edge cases
- common interview questions`;
  }

  function marketingFallback() {
    return `Write persuasive marketing copy with:
- strong hook
- clear value proposition
- key benefits
- concise CTA
- 3 variations`;
  }

  function businessContentFallback() {
    return `Create business content. Provide guidance for:
- social media post
- email campaign
- blog article
- promotional copy

Include tone recommendations, structure, and practical examples.`;
  }

  function unknownFallback() {
    return "It looks like the topic is missing. Structure the response clearly, provide practical guidance, and organize the answer logically.";
  }

  globalScope.PromptBoostFallbackRegistry = {
    build
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

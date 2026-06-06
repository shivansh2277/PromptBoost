"use strict";

(function attachPromptBoostComparisonBuilder(globalScope) {
  function build(semantic) {
    const subject = semantic.subjectQuality.usable ? semantic.subject : "the two options";
    const projectContext = /\bfor my project\b/i.test(semantic.lower) ? " for my project" : "";

    return `Compare ${subject}${projectContext && !subject.includes("for my project") ? projectContext : ""} using a practical decision-making structure. Include:
- strengths
- weaknesses
- performance considerations
- scalability
- learning curve
- ecosystem and tooling
- best use cases
- tradeoffs
- final recommendation based on the project needs`;
  }

  globalScope.PromptBoostComparisonBuilder = {
    build
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

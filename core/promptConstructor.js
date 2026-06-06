"use strict";

(function attachPromptBoostPromptConstructor(globalScope) {
  function build(graph) {
    if (graph.chain && graph.chain.hasChain) {
      return buildChain(graph);
    }

    if (graph.metaTask === "prompt_improvement") {
      return "Write as a prompt engineer.\n\nImprove the prompt or instruction so it is clear, specific, and LLM-ready. Preserve the original goal, remove ambiguity, add useful constraints, and specify the expected output format without adding unnecessary complexity.";
    }

    if (graph.route === "de_escalation_response") {
      return "Respond like a customer success manager.\n\nWrite a calm, empathetic response for a frustrated or furious client. Acknowledge the concern, take responsibility where appropriate, avoid defensiveness, offer a concrete next step, and keep the tone professional and solution-oriented.";
    }

    return "";
  }

  function buildChain(graph) {
    const steps = graph.chain.steps.map((step) => {
      if (step.taskType === "summary") {
        return `Step ${step.index}: Summarize ${step.subject}. Capture the key points, important details, and main takeaway.`;
      }

      if (step.taskType === "linkedin_post") {
        return `Step ${step.index}: Create a LinkedIn post from the previous summary. Include a strong hook, useful insight, concise body, and engaging CTA.`;
      }

      if (step.taskType === "instagram_caption") {
        return `Step ${step.index}: Create an Instagram caption from the previous result. Include a hook, concise message, CTA, and hashtags.`;
      }

      return `Step ${step.index}: Complete ${step.subject} clearly and practically.`;
    });

    return `Complete this as a chained task. Preserve each step and use the output of earlier steps to improve later steps.\n\n${steps.join("\n\n")}`;
  }

  globalScope.PromptBoostPromptConstructor = {
    build
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

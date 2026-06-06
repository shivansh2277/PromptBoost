"use strict";

(function attachPromptBoostTaskDetector(globalScope) {
  const TASKS = {
    coding: {
      debugging: [/(\bfix\b|\bdebug\b|\bbug\b|\berror\b|\bissue\b|\bnot working\b)/, 9],
      explanation: [/(\bexplain\b|\bwalkthrough\b|\bunderstand\b).{0,25}(\bcode\b|\balgorithm\b|\blogic\b|\bfunction\b)/, 8],
      feature_build: [/(\bbuild\b|\bcreate\b|\badd\b|\bimplement\b).{0,30}(\bfeature\b|\bapp\b|\bapi\b|\bcomponent\b|\bfunction\b)/, 8],
      implementation: [/(\bgive program\b|\bprogram\b|\bheap sort\b|\bbinary search\b|\balgorithm\b|\bin c\b|\bin python\b|\bin javascript\b)/, 8],
      optimization: [/(\boptimize\b|\bperformance\b|\bfaster\b|\befficient\b|\bcomplexity\b)/, 8],
      review: [/(\breview\b|\bcode review\b|\bbest practices\b)/, 8],
      refactor: [/(\brefactor\b|\bclean up\b|\bmaintainability\b)/, 8]
    },
    study: {
      exam_prep: [/(\bfor exam\b|\bexam\b|\btest prep\b|\bcommon questions\b)/, 9],
      interview_prep: [/(\binterview\b|\bcoding interview\b|\btechnical interview\b|\binterview prep\b)/, 10],
      beginner_learning: [/(\bbeginner\b|\bsimple\b|\bbasics\b|\bexplain\b|\bexplanation\b|\bwhat is\b|\bwater cycle\b)/, 7],
      quick_summary: [/(\bsummarize\b|\bsummary\b|\bquick recap\b|\bshort notes\b)/, 8],
      conceptual_breakdown: [/(\bconcept\b|\bdeep\b|\bintuition\b|\bwhy\b|\bmechanism\b)/, 7]
    },
    writing: {
      linkedin_post: [/(\blinkedin\b|\blinkedin post\b)/, 10],
      email: [/(\bemail\b|\breply\b|\bsubject line\b)/, 9],
      review_response: [/(\bnegative review\b|\bbad review\b|\bcomplaint\b|\bangry customer\b|\brespond\b.{0,20}\breview\b)/, 12],
      storytelling: [/(\bstory\b|\bnarrative\b|\bplot\b|\bscene\b)/, 8],
      rewriting: [/(\brewrite\b|\brephrase\b|\bmake it professional\b|\btone\b)/, 8],
      proofreading: [/(\bgrammar\b|\bproofread\b|\bspelling\b|\bpunctuation\b)/, 12]
    },
    marketing: {
      social_caption: [/(\bcaption\b|\binstagram\b|\btiktok\b|\bhashtags\b)/, 9],
      ad_copy: [/(\bad\b|\bad copy\b|\badvertisement\b|\bsales copy\b)/, 9],
      hook_generation: [/(\bhook\b|\bhooks\b|\bopener\b)/, 9],
      CTA_generation: [/(\bcta\b|\bcall to action\b)/, 10],
      product_description: [/(\bproduct description\b|\bproduct listing\b|\becommerce\b)/, 9]
    },
    research: {
      comparison: [/(\bcompare\b|\bvs\b|\bversus\b|\bdifference\b)/, 8],
      analysis: [/(\banalyze\b|\banalysis\b|\bevaluate\b)/, 7],
      market_research: [/(\bmarket\b|\bcompetitor\b|\bindustry\b|\bbrands\b|\bpricing\b)/, 8],
      pros_cons: [/(\bpros and cons\b|\badvantages\b|\bdisadvantages\b)/, 9]
    },
    general: {
      planning: [/(\bplan\b|\broadmap\b|\bschedule\b)/, 7],
      checklist: [/(\bchecklist\b|\bsteps\b)/, 7],
      brainstorming: [/(\bideas\b|\bbrainstorm\b|\bnames\b)/, 7],
      general: [/.*/, 1]
    }
  };

  const DEFAULT_TASK = {
    coding: "implementation",
    study: "beginner_learning",
    writing: "rewriting",
      marketing: "general_marketing",
    research: "analysis",
    general: "general"
  };

  function detectTaskType(normalized, context) {
    return analyzeTaskType(normalized, context).taskType;
  }

  function analyzeTaskType(normalized, context) {
    const taskRules = TASKS[context] || TASKS.general;
    const scores = {};

    for (const [taskType, [regex, weight]] of Object.entries(taskRules)) {
      scores[taskType] = regex.test(normalized.lower) ? weight : 0;
    }

    const sorted = Object.entries(scores)
      .map(([taskType, score]) => ({ taskType, score }))
      .sort((a, b) => b.score - a.score);

    const top = sorted[0] || { taskType: DEFAULT_TASK[context] || "general", score: 0 };
    const runnerUp = sorted[1] || { taskType: "", score: 0 };
    const taskType = top.score > 0 ? top.taskType : DEFAULT_TASK[context] || "general";

    return {
      taskType,
      topScore: top.score,
      runnerUpScore: runnerUp.score,
      scores
    };
  }

  globalScope.PromptBoostTaskDetector = {
    analyzeTaskType,
    detectTaskType
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

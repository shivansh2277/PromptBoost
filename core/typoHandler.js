"use strict";

(function attachPromptBoostTypoHandler(globalScope) {
  const KNOWN_CORRECTIONS = {
    pyhton: "python",
    pythn: "python",
    javscript: "javascript",
    javasript: "javascript",
    progarm: "program",
    progrm: "program",
    explanaation: "explanation",
    explanaton: "explanation",
    instgram: "instagram",
    linkdin: "linkedin",
    grammer: "grammar",
    captin: "caption"
  };

  const DOMAIN_WORDS = [
    "python",
    "javascript",
    "program",
    "explanation",
    "instagram",
    "linkedin",
    "grammar",
    "caption",
    "algorithm",
    "function",
    "debug",
    "recursion",
    "marketing",
    "research"
  ];

  function correctText(input) {
    return String(input || "")
      .split(/(\s+)/)
      .map((part) => {
        if (/^\s+$/.test(part)) {
          return part;
        }

        const cleaned = part.toLowerCase().replace(/[^a-z0-9+#]/g, "");
        const corrected = correctToken(cleaned);
        return corrected && cleaned !== corrected ? part.replace(cleaned, corrected) : part;
      })
      .join("");
  }

  function correctToken(token) {
    if (!token || token.length < 4) {
      return token;
    }

    if (KNOWN_CORRECTIONS[token]) {
      return KNOWN_CORRECTIONS[token];
    }

    for (const word of DOMAIN_WORDS) {
      if (isTypoMatch(token, word)) {
        return word;
      }
    }

    return token;
  }

  function isTypoMatch(input, keyword) {
    if (!input || !keyword || input[0] !== keyword[0] || Math.abs(input.length - keyword.length) > 2) {
      return false;
    }

    const distance = damerauLevenshtein(input, keyword);
    const maxDistance = keyword.length <= 6 ? 1 : 2;
    return distance <= maxDistance;
  }

  function damerauLevenshtein(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
      matrix[i][0] = i;
    }

    for (let j = 0; j < cols; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );

        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }

    return matrix[a.length][b.length];
  }

  globalScope.PromptBoostTypoHandler = {
    correctText,
    correctToken,
    isTypoMatch
  };
})(typeof globalThis !== "undefined" ? globalThis : self);

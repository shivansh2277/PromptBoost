# PromptBoost

PromptBoost is a Chrome extension that improves prompts directly inside ChatGPT.

Instead of manually writing detailed prompts, users can write naturally and let PromptBoost transform their input into a clearer, more structured prompt designed to produce better AI responses.

## Features

### Intelligent Prompt Enhancement

Converts vague prompts into structured, high-quality instructions.

Example:

**Input**

```text
write instagram caption for gym
```

**Enhanced Prompt**

```text
Write a short, engaging Instagram caption for a gym-related post. Include a strong hook, motivational tone, call to action, and relevant hashtags. Provide 3 caption variations.
```

### Context-Aware Prompt Generation

PromptBoost analyzes the user's input and adapts prompt structure based on intent.

Supported contexts include:

* Coding
* Study
* Writing
* Marketing
* Research
* General Productivity

### Smart Mode Selection

Users can choose from:

* General
* Coding
* Study

General mode automatically adapts to the detected intent whenever possible.

### Task-Specific Optimization

PromptBoost differentiates between different types of requests.

Examples:

**Coding**

* Debugging
* Code explanation
* Feature implementation
* Optimization
* Code review

**Study**

* Beginner explanations
* Exam preparation
* Quick summaries
* Concept breakdowns

**Writing**

* Emails
* LinkedIn posts
* Articles
* Rewriting
* Proofreading

### Local Processing

PromptBoost runs entirely in the browser.

* No backend
* No API calls
* No account required
* No prompt storage

### Privacy Focused

PromptBoost does not:

* Store prompts
* Send prompts to external servers
* Track user activity

All processing is performed locally.

## Installation

### Option 1: Download ZIP

1. Download this repository.
2. Extract the ZIP file.
3. Open Chrome.
4. Navigate to:

```text
chrome://extensions
```

5. Enable **Developer Mode**.
6. Click **Load unpacked**.
7. Select the extracted PromptBoost folder.

The extension is now installed.

### Option 2: Clone Repository

```bash
git clone https://github.com/shivansh2277/PromptBoost.git
```

Then load the folder through Chrome Extensions using Developer Mode.

## How to Use

1. Open ChatGPT.
2. Type your prompt normally.
3. Select a mode:

   * General
   * Coding
   * Study
4. Click **Improve Prompt**.
5. Review the enhanced prompt.
6. Submit it to ChatGPT.

## Examples

### Study

**Input**

```text
explain photosynthesis
```

**Output**

```text
Explain photosynthesis in a simple, beginner-friendly way. Break the process down step by step, include examples, and finish with a short recap.
```

### Coding

**Input**

```text
fix python api bug
```

**Output**

```text
Debug and fix the Python API issue. Identify the root cause, explain why it occurs, provide the corrected solution, and mention important edge cases.
```

### Writing

**Input**

```text
write linkedin post about my project
```

**Output**

```text
Write a professional but conversational LinkedIn post about a project. Include a strong opening hook, key insights, lessons learned, and a clear closing call to action.
```

## Project Goals

PromptBoost aims to:

* Improve AI output quality
* Reduce prompt engineering complexity
* Help users communicate intent more clearly
* Make AI tools easier to use for everyone

## Technology

Built using:

* JavaScript
* HTML
* CSS
* Chrome Extension APIs
* Manifest V3

## Roadmap

Planned improvements include:

* Better intent understanding
* Improved multi-step task handling
* Enhanced multilingual support
* More specialized prompt generation
* Additional productivity features

## Contributing

Contributions, suggestions, and feedback are welcome.

If you find a bug or have an idea for improvement, feel free to open an issue or submit a pull request.

## License

MIT License

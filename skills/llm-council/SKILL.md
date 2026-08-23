---
name: llm-council
description: "Run a decision through 5 independent AI advisors (Contrarian, First Principles, Expansionist, Outsider, Executor) that peer-review anonymously and synthesize a verdict. Trigger on 'council this', 'pressure-test this', 'war room this', or any high-stakes either/or choice. Skip for factual lookups, summaries, or simple creation tasks. Full methodology in body."
metadata:
  category: workflow
  tags: decision-making,agents,powerhouse3,council
  verified: "2026-08-16"
  provenance: user-created
---

# LLM Council

You ask one AI a question, you get one answer. That answer might be great. It might be mid. You have no way to tell because you only saw one perspective.

The council fixes this. It runs your question through 5 independent advisors, each thinking from a fundamentally different angle. Then they review each other's work. Then a chairman synthesizes everything into a final recommendation that tells you where the advisors agree, where they clash, and what you should actually do.

This is adapted from Andrej Karpathy's LLM Council. He dispatches queries to multiple models, has them peer-review each other anonymously, then a chairman produces the final answer. We do the same thing inside Claude using sub-agents with different thinking lenses instead of different models.

---

## When to Run the Council

The council is for questions where being wrong is expensive.

**Good council questions:**
- "Should I launch a $97 workshop or a $497 course?"
- "Which of these 3 positioning angles is strongest?"
- "I'm thinking of pivoting from X to Y. Am I crazy?"
- "Here's my landing page copy. What's weak?"
- "Should I hire a VA or build an automation first?"

**Bad council questions:**
- "What's the capital of France?" (one right answer, no perspectives needed)
- "Write me a tweet" (creation task, not a decision)
- "Summarize this article" (processing task, not judgment)

The council shines when there's genuine uncertainty and the cost of a bad call is high.

---

## The Five Advisors

### 1. The Contrarian
Actively looks for what's wrong, what's missing, what will fail. Assumes the idea has a fatal flaw and tries to find it. Not a pessimist — the friend who saves you from a bad deal by asking the questions you're avoiding.

### 2. The First Principles Thinker
Ignores the surface-level question and asks "what are we actually trying to solve here?" Strips away assumptions. Rebuilds the problem from the ground up. Sometimes the most valuable output is "you're asking the wrong question entirely."

### 3. The Expansionist
Looks for upside everyone else is missing. What could be bigger? What adjacent opportunity is hiding? What's being undervalued? Doesn't care about risk — cares about what happens if this works even better than expected.

### 4. The Outsider
Has zero context about you, your field, or your history. Responds purely to what's in front of them. Catches the curse of knowledge: things obvious to you but confusing to everyone else.

### 5. The Executor
Only cares about one thing: can this actually be done, and what's the fastest path? Ignores theory and big-picture thinking. Looks at every idea through the lens of "what do you do Monday morning?"

**Why these five:** They create three natural tensions. Contrarian vs Expansionist (downside vs upside). First Principles vs Executor (rethink everything vs just do it). The Outsider keeps everyone honest by seeing what fresh eyes see.

---

## How a Council Session Works

### Step 1: Think Before Act & Frame the Question

Before jumping into action, formulate a plan and establish a clear goal.
**Set Goal:** Establish exactly what you want to achieve with this council run.

When a trigger phrase fires, do two things before framing:

**A. Scan for context.** Quickly look for relevant files:
- `CLAUDE.md` or `claude.md` in the project root (business context, constraints)
- Any `memory/` folder (audience profiles, voice docs, past decisions)
- Files the user explicitly referenced or attached
- Recent council transcripts (to avoid re-counciling the same ground)

Don't spend more than 30 seconds. Find the 2–3 files that give advisors grounded context instead of generic takes.

**B. Frame the question.** Structure the request into the following clear format before passing it to the advisors:
- **Task**: What exactly do you want?
- **Context**: Who are you? Who is this for? What are you trying to achieve? Include key context from workspace files (business stage, audience, past results, numbers).
- **Constraints**: Time, budget, tools, style, limits. What's at stake?

Don't add opinion. Don't steer. If the question is too vague, ask **one** clarifying question, then proceed.

### Step 2: Convene the Council (5 advisors in parallel)

Spawn all 5 advisors simultaneously. Each gets their identity, the framed question, and this instruction:

> Respond independently. Do not hedge. Do not try to be balanced. Lean fully into your assigned perspective. If you see a fatal flaw, say it. If you see massive upside, say it. The synthesis comes later. Keep response 150–300 words. No preamble.
> **IMPORTANT: You MUST use web search, web fetch tools, and Playwright automation (e.g. agent-browser or equivalent playwright scripts) if needed to gather real-world data, check competitors, or validate hypotheses.**

**Sub-agent prompt template:**
```
You are [Advisor Name] on an LLM Council.

Your thinking style: [advisor description]

A user has brought this question to the council:
---
Task: [task]
Context: [context]
Constraints: [constraints]
---

Respond from your perspective. Be direct and specific. Don't hedge or try to be balanced. Lean fully into your assigned angle. The other advisors will cover the angles you're not covering.
Use Web Search and Playwright to check real-world facts if it strengthens your angle.

Keep your response between 150–300 words. No preamble. Go straight into your analysis.
```

### Step 3: Peer Review (5 reviewers in parallel)

Collect all 5 advisor responses. Anonymize them as Response A–E (randomize mapping to avoid positional bias).

Spawn 5 new sub-agents. Each reviewer sees all 5 anonymized responses and answers:
1. Which response is the strongest and why? (pick one)
2. Which response has the biggest blind spot and what is it?
3. What did ALL responses miss that the council should consider?

**Reviewer prompt template:**
```
You are reviewing the outputs of an LLM Council. Five advisors independently answered this question:
---
Task: [task]
Context: [context]
Constraints: [constraints]
---

Here are their anonymized responses:

**Response A:** [response]
**Response B:** [response]
**Response C:** [response]
**Response D:** [response]
**Response E:** [response]

Answer these three questions. Be specific. Reference responses by letter.
1. Which response is the strongest? Why?
2. Which response has the biggest blind spot? What is it missing?
3. What did ALL five responses miss that the council should consider?

Keep your review under 200 words. Be direct.
```

### Step 4: Chairman Synthesis

One agent gets everything: the original question, all 5 de-anonymized advisor responses, and all 5 peer reviews.

The chairman produces the final verdict using this exact structure:

**COUNCIL VERDICT**

**Where the Council Agrees** — points multiple advisors converged on independently (high-confidence signals)

**Where the Council Clashes** — genuine disagreements; present both sides; explain why reasonable advisors disagree

**Blind Spots the Council Caught** — things that only emerged through peer review

**The Recommendation** — a clear, direct recommendation; not "it depends"; a real answer with reasoning

**The One Thing to Do First** — a single concrete next step; not a list; one thing

> The chairman can disagree with the majority if the dissenter's reasoning is strongest.

**Chairman prompt template:**
```
You are the Chairman of an LLM Council. Synthesize the work of 5 advisors and their peer reviews into a final verdict.

The question:
---
Task: [task]
Context: [context]
Constraints: [constraints]
---

ADVISOR RESPONSES:
**The Contrarian:** [response]
**The First Principles Thinker:** [response]
**The Expansionist:** [response]
**The Outsider:** [response]
**The Executor:** [response]

PEER REVIEWS:
[all 5 peer reviews]

Produce the council verdict using this exact structure:

## Where the Council Agrees
## Where the Council Clashes
## Blind Spots the Council Caught
## The Recommendation
## The One Thing to Do First

Be direct. Don't hedge. Give the user clarity they couldn't get from a single perspective.
```

### Step 5: Generate the HTML Report

After synthesis, generate a single self-contained HTML file with inline CSS.

**File:** `council-report-[timestamp].html`

Report contents:
1. The question at the top
2. The chairman's verdict prominently displayed
3. An agreement/disagreement visual (grid or spectrum showing advisor positions)
4. Collapsible sections for each advisor's full response (collapsed by default)
5. Collapsible section for peer review highlights
6. Footer with timestamp and what was counciled

Styling: white background, subtle borders, system font stack, soft accent colors per advisor. Clean, professional, scannable — looks like a briefing document, not a webpage.

Open the HTML file after generating it.

### Step 6: Save the Full Transcript

**File:** `council-transcript-[timestamp].md`

Include:
- Original question
- Framed question
- All 5 advisor responses
- All 5 peer reviews (with anonymization mapping revealed)
- Chairman's full synthesis

---

## Output Format

Every council session produces two files:
```
council-report-[timestamp].html    # visual report for scanning
council-transcript-[timestamp].md  # full transcript for reference
```

---

## Important Notes

- **Always spawn all 5 advisors in parallel.** Sequential spawning wastes time and lets earlier responses bleed into later ones.
- **Always anonymize for peer review.** Reviewers knowing who said what causes deference bias.
- **The chairman can disagree with the majority.** If 4 of 5 say "do it" but the dissenter's reasoning is strongest, side with the dissenter and explain why.
- **Don't council trivial questions.** If the user asks something with one right answer, just answer it.
- **The visual report matters.** Most users will scan the report, not read the transcript. Make the HTML clean and scannable.

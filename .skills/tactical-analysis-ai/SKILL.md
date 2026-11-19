---
name: tactical-analysis-ai
description: Procedures for developing reliable AI agent workflows, prompt templates, structured outputs, and football tactical grounding in PressLens.
---

# Tactical AI Engineering Skill

This skill defines the technical workflow for building, refactoring, and verifying AI-powered football tactical analysis features in PressLens.

---

## 1. Core Architecture Principles

1. **Deterministic Separation:**
   - Put numerical math (PPDA - Passes Per Defensive Action, defensive line height meters, pitch zone grid coordinates, speed metrics) into pure Python functions.
   - Do not prompt the LLM to calculate statistical aggregates.
   - Pass pre-calculated deterministic metrics to the LLM as contextual inputs.

2. **Structured I/O:**
   - Define Pydantic models for tactical outputs (e.g., `TacticalPhaseAnalysis`, `PressingTrap`, `TransitionVulnerability`).
   - Request structured JSON output from LLM endpoints and validate against the Pydantic schema immediately upon receipt.

---

## 2. Tactical Knowledge Grounding

PressLens produces credible tactical insights for analysts and coaches.

- **Grounding Checklist:**
  - Anchor observations in verified football tactical concepts:
    - High Press, Mid Block, Low Block, Counter-Press (Gegenpress).
    - Half-spaces, Zone 14, Flanks, Central corridors.
    - Pressing triggers (heavy touch, back-pass, ball facing sideline, isolated fullback).
    - Rest-defense structures (e.g., 3-2 rest defense, 2-3 rest defense).
  - Never present assumptions or hallucinations as established facts.
  - If event data is insufficient to establish a pattern, return a confidence score or explicitly flag data limitations.

---

## 3. Resilience and Provider Error Handling

When interacting with external LLM APIs (e.g., Groq, Gemini, Anthropic):

```python
# Standard Pattern: Explicit timeout, retry with backoff, structured validation
import time
from fastapi import HTTPException
from pydantic import ValidationError

async def run_tactical_analysis(payload: MatchContext) -> TacticalReport:
    max_retries = 3
    base_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            # 1. Invoke model with timeout
            raw_response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=build_tactical_prompt(payload),
                response_format={"type": "json_object"},
                timeout=20.0
            )
            # 2. Parse and validate structured output
            content = raw_response.choices[0].message.content
            return TacticalReport.model_validate_json(content)
        except ValidationError as val_err:
            # Malformed JSON or schema mismatch
            if attempt == max_retries - 1:
                raise HTTPException(status_code=502, detail="Model returned invalid tactical schema")
        except RateLimitError:
            time.sleep(base_delay * (2 ** attempt))
        except APITimeoutError:
            if attempt == max_retries - 1:
                raise HTTPException(status_code=504, detail="Tactical analysis request timed out")
```

---

## 4. Prompt Management

- Store prompts in dedicated modular template files (e.g., `backend/app/prompts/tactical_analysis.py`).
- Separate system instructions (tactical expertise, constraints, schema rules) from dynamic match facts.
- Include concrete examples (few-shot) for complex tactical concepts like pressing trap identification.
- Version prompt templates to enable regression testing against predefined match scenarios.


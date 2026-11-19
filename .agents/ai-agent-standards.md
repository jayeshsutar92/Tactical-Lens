# FDE and AI Agent Engineering Standards for PressLens

PressLens is an AI-powered tactical football analysis application. Because AI systems introduce non-determinism, latency, and failure modes distinct from traditional software, all AI agent workflows, prompt engineering, and LLM integrations must follow these foundational engineering principles.

---

## 1. Focused Workflows Over Unnecessary Multi-Agent Architectures
- Prefer reliable, deterministic, and focused single-agent or linear workflows over convoluted multi-agent graphs unless multiple autonomous actors with distinct specialized roles are genuinely required.
- Multi-agent systems add compound latency, compounding token costs, and compounding error rates. Every additional agent in a chain must have a clear, measurable justification.

## 2. Separate Deterministic Logic from LLM Reasoning
- Clearly decouple deterministic application logic (data transformation, routing, math, pitch coordinates calculation, tactical rule verification) from LLM-based reasoning.
- Do not ask the LLM to calculate match timestamps, aggregate numerical scores, or parse raw data if deterministic Python code can do it faster, cheaper, and with 100% precision.
- Use the LLM for domain synthesis, natural language tactical explanations, and contextual qualitative insights.

## 3. Structured Inputs and Structured Outputs
- Always use structured schemas for agent inputs and outputs:
  - On the backend, enforce structured output schemas using Pydantic models, JSON Schema, or function/tool calling.
  - On the frontend, validate and parse LLM-generated payloads before rendering them in tactical boards, charts, or summaries.
- Never rely on free-form text when structured data (tactical formations, player roles, pressing triggers, pitch zone coordinates) is needed downstream.

## 4. Rigorous Tool and Argument Validation
- Validate all tool arguments strictly before executing any tool or sidecar function.
- Validate tool return payloads before feeding them back into the agent context or returning them to the client.
- Fail early on invalid tool parameters with descriptive error messages rather than passing malformed data into database queries or external APIs.

## 5. Graceful Failure & Resilience Handling
- Treat LLM failures as normal runtime events, not edge cases:
  - **Timeouts:** Configure explicit timeout thresholds on external API requests (e.g., Groq API calls).
  - **Rate Limits (429):** Implement exponential backoff with jitter for transient rate limit errors.
  - **Malformed JSON/Outputs:** Catch schema parsing errors and provide a repair mechanism or a safe fallback response.
  - **Service Outages:** If the AI provider is unavailable, gracefully inform the user or degrade functionality without crashing the server.

## 6. Ground Tactical Explanations in Knowledge Base
- Ground all tactical explanations in verified domain knowledge (football tactical theory, pressing systems like Gegenpressing, mid-block, high-press triggers, zone 14 dynamics, half-space overloads).
- Never present speculative model assumptions as established tactical facts.
- Distinguish between observed match data (e.g., actual passing network, defensive line height) and inferred tactical intentions.

## 7. Prevent Hallucination & Communicate Uncertainty
- Never generate fabricated player statistics, match events, or tactical metrics.
- When match footage, event context, or data is missing or ambiguous, explicitly prompt the model to state its uncertainty (e.g., *"Insufficient event data to confirm press trigger; likely pressing trap based on shape"*).
- Include confidence indicators or caveats where inferences are speculative.

## 8. Modular, Versionable, and Maintainable Prompts
- Do not scatter raw prompt strings inside business logic functions.
- Centralize prompt templates into dedicated modules or files with versioning and documentation of purpose.
- Maintain a strict separation between system instructions (agent persona, safety rules, output format) and user context (match data, query, constraints).

## 9. Scenario-Based Evaluation Over Superficial Checks
- Do not assume an agent works merely because an API returns HTTP 200.
- Evaluate agent behavior against predefined tactical test scenarios (e.g., analyzing a 4-3-3 high press vs. a 3-5-2 low block; identifying counter-pressing triggers; handling malformed tactical queries).
- Verify that agent outputs meet tactical accuracy, formatting constraints, and safety guidelines.

## 10. Observability and Privacy-Conscious Logging
- Log meaningful agent execution metrics for debugging:
  - Model name and version used.
  - Token consumption (prompt tokens, completion tokens, total).
  - Latency breakdown (tool execution time, LLM inference time).
  - Step trace of tool invocations.
- **Privacy:** Sanitize logs to never expose user credentials, raw authentication tokens, or personally identifiable information.

## 11. Latency, Cost, and Token Efficiency
- Design agent workflows with strict token and latency budgets:
  - Prune conversation history and avoid sending redundant data back and forth.
  - Select the optimal model size for each task (e.g., fast, lightweight models for classification/routing, larger models for nuanced tactical analysis).
  - Cache static tactical reference data rather than re-prompting the model with large context windows on every call.


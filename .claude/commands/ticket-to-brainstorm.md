Seed the brainstorming skill from a /to-ticket output or GitHub issue. The ticket defines *what*; brainstorming decides *how*. Do not write code or design docs in this command — hand off to brainstorming.

**Arguments:** optional ticket source — pasted /to-ticket output, issue number, issue URL, or path to ticket markdown. With no argument, use the most recent `/to-ticket` output in the conversation.

Apply the `ticket-to-brainstorm` skill (`~/.claude/skills/ticket-to-brainstorm/SKILL.md`), then enter the **brainstorming** skill.

## Steps

1. **Locate the ticket.** Use the argument if provided; otherwise find the latest `/to-ticket` output in the thread. If an issue reference was passed, fetch with `gh issue view`. If nothing found, ask the user to paste ticket output or give an issue number — then stop.

2. **Parse ticket fields.** Extract summary, problem, acceptance criteria, edge cases, out of scope, and technical context. If summary, problem, or acceptance criteria are missing, ask one focused question and stop.

3. **Confirm handoff.** Tell the user which ticket you're designing from (title + count of AC). One short paragraph — do not dump the full brief.

4. **Enter brainstorming** with ticket overrides from the skill:
   - Acceptance criteria = fixed constraints
   - Edge cases = design inputs
   - Out of scope = hard boundaries
   - Clarifying questions = design decisions only, never re-ask what's in the ticket

5. **Ticket drift.** If brainstorming reveals the ticket needs changes, stop and offer to update via `/to-ticket` or the GitHub issue before continuing.

6. **Hard rules:**
   - Do not write code, implementation plans, or design specs in this command — brainstorming owns those steps
   - Do not re-run `/to-ticket` unless the ticket is missing or the user asks to revise it
   - Follow brainstorming's HARD-GATE: no implementation until design is approved and spec is written

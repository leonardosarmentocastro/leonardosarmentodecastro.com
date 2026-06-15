Turn an informal problem description into a GitHub-issue-ready ticket. Do not implement, write design docs, or publish unless asked — produce the ticket text only, ready to paste (or pass to `gh issue create`).

**Arguments:** optional source — pasted description, issue number/URL, or path to notes. With no argument, synthesize from the current conversation.

Apply the `to-ticket` skill (`~/.claude/skills/to-ticket/SKILL.md`).

## Steps

1. **Gather input.** Use the argument if provided; otherwise the user's latest message and conversation context. If an issue reference was passed, fetch it with `gh issue view` — treat as source material, not something to overwrite unless asked.

2. **Gap check.** If you cannot write testable acceptance criteria, ask **one** focused question and stop. Do not run a full brainstorming session.

3. **Explore the repo (when applicable).** Read enough to fill **Technical context** — domain vocabulary, related features, obvious behavioral contracts. No file paths in the output.

4. **Draft** using the template in the skill's `examples.md`. Also propose a **title**: `type(scope): imperative subject` (under 72 chars).

5. **Self-review** per the skill: no TBDs, no contradictions, scope fits one issue, criteria are what-not-how.

6. **Output format:**

   ```
   **Title:** type(scope): subject

   <markdown body — template sections only, no title inside the body>
   ```

   Wrap the body in a single fenced markdown block for copy-paste.

   If the user asked to publish:

   ```bash
   gh issue create --title "type(scope): subject" --body "$(cat <<'EOF'
   <body>
   EOF
   )" --label "needs-triage" --label "<bug|enhancement>"
   ```

7. **Hard rules:**
   - Acceptance criteria describe **observable outcomes**, not implementation steps
   - No file paths or line numbers in the ticket body
   - Do not write code, specs in `docs/superpowers/specs/`, or implementation plans
   - Do not publish with `gh` unless explicitly requested
   - Return only the title + markdown block(s)

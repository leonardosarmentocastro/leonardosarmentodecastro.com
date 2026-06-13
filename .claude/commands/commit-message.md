Draft conventional-commit messages for unstaged + untracked changes. Do not stage, commit, or push — produce the message text only, ready to paste.

**Arguments:** optional path filter(s). With no argument, considers everything in `git status` (unstaged + untracked + staged). With paths, scopes to those files only.

## Steps

1. **Discovery — read before writing.** Required context:
   - `git status` — what is staged, unstaged, untracked. If paths were given, restrict to those.
   - `git diff` for unstaged tracked files. `git diff --cached` for staged.
   - Read each untracked file directly (no diff to inspect).
   - `git log --oneline -10` — match the project's existing subject style (type, scope, voice).

2. **Coherence check.** Apply the `committing-when-coherent` skill:
   - Name the theme of each changed or created file in one short phrase.
   - Group files by theme.
   - **If more than one theme:** present a split plan as a numbered list (file group → suggested subject line), then ask whether to draft all of them, draft one, or bundle everything as a single commit anyway. Default to drafting each as a separate message when no answer is given.
   - **If one theme:** proceed to step 3.

3. **Draft using the project's conventional-commit style.** Match what `git log --oneline -10` shows. Typical shape:

   ```
   type(scope): imperative subject under 72 chars

   Optional body explaining *why* this change exists. Skip the body
   entirely if the subject is self-explanatory. Wrap at ~72 chars.
   Use bullets for multi-point bodies; keep them tight.
   ```

   Types in use here: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`. Scopes are domain names (e.g. `analytics`, `test`, `claude`). Leave the scope off only when the change genuinely spans no single domain.

4. **Output as a copy-paste HEREDOC** per commit:

   ````
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): subject

   Optional body.
   EOF
   )"
   ```
   ````

   When drafting multiple commits, output them in suggested apply order with a `git add <paths>` line above each so the user can apply them one at a time without re-running discovery.

5. **Hard rules — do not violate:**
   - Subject in **imperative mood**: "add", "drop", "fix" — not "added", "adds", "adding".
   - Subject under **72 chars**. Aim for 50 when possible.
   - No filler adjectives: "various", "minor", "small", "comprehensive", "robust".
   - One `and` in the subject is acceptable when the two parts describe the *same* atomic change. Multiple `and`s, sections, or bullets-in-subject mean the commit should be split — go back to step 2.
   - Body explains **why**, not what. The diff already shows what.
   - **Do not** add `Co-Authored-By:` or `🤖 Generated with Claude Code` trailers unless the user explicitly asks.
   - **Do not** stage, commit, push, or run `git add`. Output the message text only.

6. **Return only the message block(s).** If there is nothing in `git status` matching the filter, say so and stop.

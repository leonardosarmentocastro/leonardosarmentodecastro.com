Draft a pull request description for the current branch. Do not commit, push, or open the PR — produce the description text only, ready to paste into `gh pr create` or the GitHub UI.

**Argument:** optional base branch name. Defaults to `main`.

## Steps

1. **Determine the base.** Use the argument if provided; otherwise `main`. Verify with `git rev-parse --verify <base>`. If it does not exist, stop and ask the user which base to use.

2. **Discovery — read before writing.** Required context:
   - `git log <base>..HEAD --oneline` — full commit history on this branch.
   - `git diff <base>...HEAD --stat` — file-level scope.
   - `git status` — anything in the working tree intentionally NOT in this PR.
   - If the branch matches a `docs/superpowers/specs/*` or `docs/superpowers/plans/*` file by name or topic, read it for the original problem framing.
   - Read 1–2 key test files in the diff so the Testing section reflects what is actually asserted, not what was probably asserted.

3. **Scope sanity check.** If the branch is on the larger side (>15 files or >1000 lines) or includes work that is borderline-related to the branch name, surface this **before** drafting and ask whether to (a) draft as-is and frame the borderline work honestly, or (b) split the branch first. Default to (a) if no answer — and frame the borderline work honestly. Never hide it.

4. **Draft a PR title.** Before the description body, propose one title line:
   - Match conventional-commit style from `git log` on this branch (e.g. `feat(cv): …`, `fix(analytics): …`).
   - Imperative mood; under **72 characters**; no filler adjectives.
   - Name the **primary user-visible outcome**, not implementation details — the title is what reviewers scan in the PR list.
   - If the branch mixes unrelated themes, prefer the dominant theme or say the title needs a split first.

5. **Draft the description using this template.** Output as a single fenced markdown block ready to copy.

   ```markdown
   ## Problem
   The user-visible or operational gap, and why it mattered. Constraints that shaped the solution.

   ## Approach
   Chosen solution in one short paragraph, plus a bulleted list of the **non-obvious** choices and the reasoning for each. Skip project defaults.

   ## How the pieces fit together
   Numbered, layer-by-layer narrative end-to-end. Reference files only when a file *is* the layer (e.g. `next.config.ts` for the proxy).

   ## Testing
   ### Automated — `pnpm test:run`
   - One bullet per test file with the scenarios it covers (one-liner each).
   ### Manual verification (post-merge, against production where applicable)
   - Numbered steps a reviewer can run, each with the **expected observable**.

   ## Follow-ups
   - Each item explicit. If genuinely none, write `_(none)_`.
   - **Always** call out env vars that must be set in Vercel / CI before the deploy is functional.
   - **Always** call out anything in the working tree intentionally not in this PR, by path.
   ```

6. **Hard rules — do not violate:**
   - No commit-by-commit recap. The diff already lists commits.
   - No file-by-file walkthrough. Group by layer or concern.
   - No marketing tone. Cause-and-effect only; no adjectives like "robust", "seamless", "modern".
   - The Follow-ups section is mandatory. Before defaulting to `_(none)_`, explicitly check (a) Vercel/CI env vars the deploy needs, and (b) untracked files in the working tree.
   - If the branch contains commits that arguably belong in a separate PR, say so in the description rather than hiding them.

7. **Return the title and description.** Do not run `gh pr create`, do not push, do not commit. Format:

   ````
   **Suggested title:** `type(scope): subject line`

   ```bash
   gh pr create --title "type(scope): subject line" --body "$(cat <<'EOF'
   …description markdown…
   EOF
   )"
   ```

   Or paste the title into the GitHub UI and copy only the description block from the fenced markdown.
   ````

If the branch has zero commits ahead of base, say so and stop — there is nothing to describe.

---
name: committing-when-coherent
description: Use when an edit session is about to shift scope (the user says "now also", "let's also", "while we're here", "next, update", "I'll just clean up", or asks to touch files unrelated to the current diff), before writing to a file when the working tree is already dirty with a different concern, and before any commit on a feature branch.
---

# Committing when coherent

## Core principle

**A commit is one coherent unit of change.** The right moment to commit is when the working tree stops being one thing — not when the user asks, not when the session ends. AI-assisted editing removed the friction that used to cap commit size; this skill puts a deliberate pause back in.

**Violating the letter is violating the spirit.** "These are all docs" or "the diff is still small" do not make two themes one theme.

## When to use

Fire on any of these:

- **Topic-shift phrases:** "now also", "let's also", "while we're here", "next, let's", "now update", "now create", "I'll just clean up".
- **A new file scope** that doesn't share a theme with files already in the working tree (code → unrelated code, code → docs about a different domain, source → config).
- **About to write** to a file when the working tree is dirty *and* the new write belongs to a different concern.
- **Before any commit** — final coherence check on what's staged.

Do **not** fire when:

- The new edit is the test for production code already in the diff (TDD pair = one commit).
- The new edit is the doc update required for changes already in the diff in the same domain (per `CLAUDE.md`'s "docs travel with the change" rule).
- No files have been modified yet.
- The new request continues the existing theme.

## The check

When triggered, pause **before** the next edit:

1. Name the theme(s) of the current working tree in one short phrase each. Run `git status` if needed.
2. Name the theme of the incoming request in one short phrase.
3. Same theme (or necessary collateral)? Proceed silently.
4. Different theme? Surface the three options below and wait.

## The pause (verbatim shape)

> Current working tree is about **X**. The next change would add **Y**, a different concern. Three options:
>
> **(a)** Commit X now, then continue with Y on a clean tree.
> **(b)** Confirm Y is part of the same atomic unit (test, required doc, necessary collateral) and proceed.
> **(c)** Y is a separate concern — branch off and pick it up after the X commit lands.

Do not edit until the user picks.

## Red flags — STOP and run the check

| Thought | Reality |
| --- | --- |
| "Just one more small file." | One more file is how a five-theme commit starts. Check. |
| "I'll squash it later." | Later never happens. Check now. |
| "These are all docs, so it's one commit." | "Docs" isn't a theme. *What* the docs are about is the theme. |
| "The user is on a roll, don't interrupt." | The pause is the value. Interrupting beats untangling. |
| "I already started writing the file." | Stop. Run the check. Resume or pivot from the answer. |
| "The diff is still small." | Coherence, not size, is the test. |
| "It's faster to bundle and move on." | Faster this session, slower for the reviewer and for `git bisect`. |
| "The subject line just needs an 'and'." | That's the project's tell that you've already failed. Split. |

## What does NOT change

- TDD pair (test + production code for the same behavior) = one commit.
- A code change + its required same-domain doc update = one commit (`CLAUDE.md`).
- A refactor whose AC is "rename X everywhere" or "split file Y" stays one commit.
- A bug fix spanning regression test + fix + related test updates = one commit.

The rule is *thematic coherence*, not file count.

# Documentation map

Where everything lives, and which file is the source of truth for what.

| File | What it is | Read it when |
|---|---|---|
| [`../README.md`](../README.md) | The project itself: what it does, architecture, how to run it | Start here |
| [`../CHANGELOG.md`](../CHANGELOG.md) | What changed, per release | You want the history in one page |
| [`design/DESIGN.md`](design/DESIGN.md) | **Source of truth for the interface**: the "Kertas & Kapur" direction, colour and type tokens with measured contrast, motion, voice, per-screen intent, and the anti-slop bans | Before touching CSS, a component, or any user-facing copy |
| [`design/audit.md`](design/audit.md) | The 25 findings of the pre-redesign visual audit, each mapped to the prompt that closed it | You wonder why a screen is built the way it is |
| [`design/arah-visual.html`](design/arah-visual.html) | The three visual directions that were compared before picking one. Open it in a browser | You want the reasoning behind the chosen direction |
| [`design/shots/`](design/shots/) | Every screen photographed before and after the redesign, at 390 and 1280 px | You want the visual diff |
| [`feynman_challenge_master.md`](feynman_challenge_master.md) | The original product and technical specification | You need the intended behaviour of a feature |
| [`../prompts/improvement-plan.md`](../prompts/improvement-plan.md) | **The plan of record.** Every phase, every prompt, the decisions behind them, and a status table | You want to know what is done and what is next |
| [`../prompts/execution-plan.md`](../prompts/execution-plan.md) | The original build plan, kept for history | Archaeology |

## How the work is organised

Development runs as numbered prompts inside `prompts/improvement-plan.md`, executed in order. Each one ends with the same verification suite (type check, lint, format, design rules, unit tests, production build), one feature commit, and one docs commit that ticks its row in the status table.

Phases so far: **1–3** stabilise, complete, and differentiate (released as v1.0.0) · **V** the visual redesign · **5** the gates before a public launch · **4** maturity work that follows it.

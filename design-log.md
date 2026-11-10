# Design log: Moss Builder

Design loop from `PROMPT.md` Section 8. Each iteration screenshots `moss-builder.html` in one fixed state, blinds it among the 4 references, and asks a fresh-context critic (model: `fable`) to score, rank and list gaps.

## Method notes

- **Fixed state** (`tests/screenshot.cjs`): 1440×900, light mode. The first example prompt ("A seaside pousada in Trancoso…") is built on Home. The canvas is scrolled so the Features section starts 430px from the top: the pinned iso scene, the chat panel, the end of the hero, all of Features and the top of Testimonials are in view.
- **References**: `/references` holds 4 animated GIFs, not still screenshots. Each run uses the same frame (the middle one), upscaled to 1440px wide so all five images are a similar size.
- **Critic prompt**: `Critic prompt.md` is saved as RTF. The critic gets its plain text (converted with pandoc, otherwise unchanged), and the same text every run.
- **Blinding**: a new random A–E order every run (`random.SystemRandom`). The letter key stays in the session scratchpad and is only written here after the critique.
- **Caveat on the reference set**: two of the four references (a 3D render, a set of illustrated faces) have no type or UI, and the critic said so. Ranking against them says less about UI polish than ranking against real interfaces would.
- **Gap lists**: the critic prompt only asks for gaps on designs ranked 3rd or lower. When ours ranks 1st or 2nd, there is no gap list for our letter. Fixes then come from our lowest-scoring criteria, plus gaps the critic named for other designs that also apply to ours (these are marked).

---

## Iteration 1

| | |
|---|---|
| Screenshot | `screenshots/iter-1.png` |
| Our letter | D |
| Our rank | **1 / 5** (D > E > A > B > C) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 4 · Components 4 · Originality 3 |
| Our total | **22 / 30** |
| Others | E 21 · A 20 · B 17 · C 15 |

**Top gaps.** None were listed for D (ranked 1st). Lowest criteria: Composition & hierarchy (3), Originality & restraint (3). Gaps the critic gave other designs that also apply to ours:
- (to B) An equal-weight card grid reads as the default SaaS template.
- (to B) The accent is spread thinly across icons, badges and nodes, so nothing reads as primary.
- (to B) Body copy is too small and light to read.

**Changes made**
1. **Features**: replaced the 4-up card grid with an editorial split. The heading and lede sit on the left (5/12); the right (7/12) is a numbered list with hairline rules, a serif title per item, and line icons pushed to the right edge. *(Originality, Composition)*
2. **Accent restraint in the iso scene**: the cyan glow now shows only on the newest (active) module instead of all seven, and only the newest connector carries the travelling pulse. *(Color, Originality)*
3. **Vertical rhythm**: closed the dead gap between the hero's logo row and Features (hero bottom padding 56 to 24px; the first section after the hero gets 72px instead of 88px), and set one section rhythm of 96px. *(Spacing, Composition)*
4. **Legibility in the scaled preview**: body copy on the generated site is 1 to 2px larger (hero sub 19px, section ledes 17px, plan features 15px), and secondary ink is darkened from `#4a4d56` to `#43464e`. *(Typography, Color)*

Functional tests after changes: **33/33 pass**.

---

## Iteration 2

| | |
|---|---|
| Screenshot | `screenshots/iter-2.png` (taken after the iteration 1 changes) |
| Our letter | E |
| Our rank | **2 / 5** (B > E > D > A > C) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 4 · Components 4 · Originality 3 |
| Our total | **22 / 30** (no change from iteration 1) |
| Others | B 23 · D 21 · A 20 · C 17 |

The top-ranked design (B) is the reference with an isometric agent and integrations diagram. The critic noted that ours (E) was the only sharp, full-UI capture and that A–D were soft and low-resolution, so its fine-detail scores for the references are less certain.

**Top gaps.** None were listed for E (ranked 2nd). Lowest criteria again: Composition & hierarchy (3), Originality & restraint (3). Gaps the critic gave other designs that also apply to ours:
- (to D) Equal tiles with no focal point: every item competes. Our seven identical scene modules have the same problem.
- (to A) A micro-caption around 11px in light grey is illegible. Our eyebrow labels render at about 7px once the preview is scaled.
- (to A) A white card with a soft shadow floating on the background reads as a pasted sticker. Our tilted agent panel does the same.

**Changes made**
1. **One focal point in the scene**: the active (newest) module keeps its cyan glow and gets a full-ink label; the other modules step back to 82% opacity. *(Composition)*
2. **Agent panel anchored, not pasted**: flatter tilt (−9° instead of −16°), a light shadow instead of the deep one, and a dotted leader line from the active module to the panel, so it reads as part of the system diagram. The module row is shifted left so the panel no longer covers the last module. *(Originality, Composition)*
3. **Legible micro-labels**: eyebrows on the generated site go from 10.5px to 13px (about 8.5px on screen in the scaled preview), the logo-row label from 10.5px to 12.5px, and the scene module labels from 9px to 10px. *(Typography, Color/contrast)*

Functional tests after changes: **33/33 pass**.

---

## Phase 1 summary (stopped for approval)

| Iteration | Our letter | Rank | Total |
|---|---|---|---|
| 1 | D | 1 / 5 | 22 |
| 2 | E | 2 / 5 | 22 |

The rank held in the top two both times, but the total did not improve (22 → 22). The iteration 2 changes have not been scored yet; the next critic run will be the first to see them. If iteration 3 also fails to beat 22, the stall guard stops the loop.

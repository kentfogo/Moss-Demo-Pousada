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

## Phase 1 summary (stopped for approval; superseded below)

| Iteration | Our letter | Rank | Total |
|---|---|---|---|
| 1 | D | 1 / 5 | 22 |
| 2 | E | 2 / 5 | 22 |

The rank held in the top two both times, but the total did not improve (22 → 22). The iteration 2 changes have not been scored yet; the next critic run will be the first to see them. If iteration 3 also fails to beat 22, the stall guard stops the loop.

---

## Reference set 2 (from iteration 3)

After Phase 1 the user added five sharp PNG screenshots of real interfaces to `/references`. Adding them counted as approval for Phase 2. The critic still takes exactly 5 images (ours plus 4), so iteration 3 onward uses these four:

- `Screenshot 2026-11-09 at 11.03.01 PM.png`: reading-app dashboard
- `Screenshot 2026-11-09 at 11.18.49 PM.png`: photographic portfolio
- `Screenshot 2026-11-09 at 11.19.19 PM.png`: biologics hero (serif, glass sphere)
- `Screenshot 2026-11-09 at 11.20.26 PM.png`: software studio site

Left out: the 4 GIFs (blurry captures; two have no UI) and `11.19.48 PM.png` (bookshop page; its lower half is a cut-off product page, the weakest of the new five). The references are no longer upscaled when they're 1440px or wider.

**Re-baseline.** Scores against a different reference set aren't comparable with iterations 1–2. From iteration 3, the stopping rules count only runs against set 2: rank #1 or #2 twice in a row, or the stall guard. The 6-iteration hard cap still counts all runs, so iterations 3–6 remain.

---

## Iteration 3 (reference set 2 baseline)

| | |
|---|---|
| Screenshot | `screenshots/iter-3.png` |
| Our letter | C |
| Our rank | **5 / 5** (D > B > E > A > C) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 3 · Components 4 · Originality 3 |
| Our total | **21 / 30** |
| Others | D 26 · B 25 · E 25 · A 23 |

**Top gaps for C (critic, in order of impact)**
1. Three zones (iso strip, page preview, chat) carry equal weight with no focal point. Make the preview the hero, collapse the module strip into a thin rail, widen the canvas.
2. The iso tiles (3D white tiles, drop shadows, dotted connectors, cyan glow) read as decoration first and as an AI-product trope; the labels are ~9px grey mono at failing contrast.
3. The preview opens mid-hero on two buttons with no headline, then a row of grey placeholder logos: key content off-screen, filler on-screen.
4. Redundant messaging: the floating "Moss · Agent" panel repeats the chat.
5. Too many type voices; teal used for eyebrows, numerals, @mentions, glow and the status dot.

**Changes made.** Where a critic fix conflicts with PROMPT.md, the brief wins: the iso scene, the cyan glow on modules, the floating agent panel, the logo row and teal eyebrows are all required. Those gaps were handled by reducing the element, not removing it.
1. **Preview is the focal point** *(gap 1)*: the iso scene is 35% shorter (236 to 156px) and its modules smaller; the preview gets the space. The module row stays, as the brief requires.
2. **Quieter, legible scene** *(gap 2)*: module shadows lighter (opacity 0.16 to 0.09), labels about 10.5px on screen in `--ink-2` instead of ~7px in `--ink-3`. The glow stays only on the active module.
3. **Headline first, filler moved** *(gap 3)*: the placeholder logo row moved from the hero to the end of Testimonials (social proof). Features rows are now single lines (number · serif title · description · icon), and the section rhythm is 80px, so three sections fit. **Fixed screenshot state changed**: the canvas now scrolls so the hero eyebrow sits 24px below the pinned scene (it previously pinned Features at 430px). The view shows the headline, Features and the top of Testimonials. This was changed now, at the start of reference set 2.
4. **Agent panel trimmed** *(gap 4)*: narrower (216px), 2-line clamp, so it reads as a status echo tied to the active module by the leader line rather than a second chat.
5. **Teal narrowed** *(gap 5)*: the numerals in the Features list are neutral ink now. Teal remains on eyebrows, active states and @mentions, which the brief specifies.

Functional tests after changes: **33/33 pass**.

---

## Iteration 4

| | |
|---|---|
| Screenshot | `screenshots/iter-4.png` (taken after the iteration 3 changes) |
| Our letter | E |
| Our rank | **5 / 5** (B > D > A > C > E) |
| Our scores | Composition 3 · Spacing 3 · Typography 3 · Color 3 · Components 3 · Originality 3 |
| Our total | **18 / 30** (down from 21) |
| Others | B 27 · D 26 · A 25 · C 24 |

Stall guard: 1 run without improvement on reference set 2 (21 → 18). One more triggers a stop.

**Top gaps for E (critic, in order of impact)**
1. The iso strip, agent panel, preview and chat all compete with no dominant surface. Remove the top strip, put section navigation in a slim left rail, let the preview fill the height.
2. The iso tile row (glossy 3D tiles, shadows, dotted connectors, staggered labels) is the most AI-trope element, and "03 TESTIMONIALS" nearly collides with its neighbours. Use a flat stepper on one baseline.
3. The preview type is the least legible thing on screen (body ~10px, feature rows ~9px, card labels ~7px). Render at true scale or crop.
4. The agent panel duplicates the chat and is truncated.
5. Chat details: no spacing around the checklist card, suggestion chips clipped, tiny tracked-mono footer hints.

**What went wrong in iteration 3.** Shrinking the preview to fit three sections cost legibility (gap 3). This iteration fixes the structure instead of scaling down further.

**Changes made**
1. **Iso scene becomes a left rail** *(gaps 1, 2)*: the scene leaves the top of the canvas and becomes a 232px column. Modules stack straight down the iso grid, labels sit on one column ("01 Hero" … in 12px mono, sentence case), so labels can't collide. Drop shadows are removed in the rail; the glow stays only on the active module. It's still the brief's isometric module metaphor (drop, connect, unfold) but it no longer competes with the preview. Mobile keeps the compact top strip.
2. **The preview fills the height at a legible scale** *(gaps 1, 3)*: the site now renders at 1080px virtual width at 0.83 scale (was 1400px at 0.59), and site type is bumped (body 18px, hero sub 20px, card rows 16px, eyebrows 14px). Effective body size went from ~9.5px to ~15px. Features became a heading row plus a full-width single-line list.
3. **Agent panel anchored at the rail foot** *(gap 4)*: the brief requires this panel, so it stays, now at the bottom of the rail where it closes the module column instead of floating off-grid. Up to 6 lines, so it's no longer cut off.
4. **Chat details** *(gap 5)*: 14/16px spacing around the checklist card, suggestion chips wrap instead of clipping, footer hints at 11px with normal tracking.
5. **Fixed screenshot state adjusted** to the new layout: the hero eyebrow sits 20px below the top of the page view. The view shows the headline, Features and the top of Testimonials. The script also waits 1s so the app's own smooth scroll settles first (it had raced the capture).

Functional tests after changes: **33/33 pass**.

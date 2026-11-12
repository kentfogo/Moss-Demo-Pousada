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
2. **The preview fills the height at a legible scale** *(gaps 1, 3)*: the site now renders at 1080px virtual width at ~0.71 scale (was 1400px at ~0.59), and site type is bumped (body 18px, hero sub 20px, card rows 16px, eyebrows 14px). Effective body size went from ~9.5px to ~12.7px. *(Corrected in iteration 5; this line first said 0.83 scale and ~15px.)* Features became a heading row plus a full-width single-line list.
3. **Agent panel anchored at the rail foot** *(gap 4)*: the brief requires this panel, so it stays, now at the bottom of the rail where it closes the module column instead of floating off-grid. Up to 6 lines, so it's no longer cut off.
4. **Chat details** *(gap 5)*: 14/16px spacing around the checklist card, suggestion chips wrap instead of clipping, footer hints at 11px with normal tracking.
5. **Fixed screenshot state adjusted** to the new layout: the hero eyebrow sits 20px below the top of the page view. The view shows the headline, Features and the top of Testimonials. The script also waits 1s so the app's own smooth scroll settles first (it had raced the capture).

Functional tests after changes: **33/33 pass**.

---

## Iteration 5

| | |
|---|---|
| Screenshot | `screenshots/iter-5.png` (taken after the iteration 4 changes) |
| Our letter | C |
| Our rank | **4 / 5** (D > B > A > C > E) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 4 · Components 4 · Originality 3 |
| Our total | **22 / 30** (up from 18; best so far on reference set 2) |
| Others | D 26 · B 25 · A 24 · E 21 |

Stall guard reset (improved). Hard cap: iteration 6 is the last run.

**Top gaps for C (critic, in order of impact)**
1. Rail, preview and chat sit at equal weight. Dim the rail, give the preview a deeper canvas tone with the page lifted on it, narrow the chat to ~320px.
2. Rail: iso tiles, dotted connectors and grid texture are decoration for a 7-item list. Use a plain numbered list and drop the grid.
3. Duplication: the agent card repeats the chat's last message, and "Check availability" appears twice within 300px. Delete the card; the left hero CTA becomes "See the rooms" only.
4. Booking card: the cyan glow border is the only glow on the page, and the ~10px button text looks unfinished. Use a hairline plus a soft 8% shadow, a 44px button with a 14px label.
5. Teal mono eyebrows appear in 7+ places and flatten the hierarchy.
6. Feature-row icons stranded at the far right edge read as leftovers.

**Changes made.** Gap 2 (replace the iso modules with a plain list) and the "delete the agent card" half of gap 3 conflict with PROMPT.md §4, which requires both, so they were reduced rather than removed.
1. **Pane hierarchy** *(gap 1)*: the canvas behind the preview is a step deeper (`--bg-2`), so the page reads as lifted. The rail sits on the base tone, its grid texture drops to 45% opacity, and its "Modules" header is neutral grey instead of teal. Chat narrowed from 384 to 344px.
2. **One primary action in the hero** *(gap 3)*: when the hero has the booking card, the card owns "Check availability"; the left column keeps one outlined "See the rooms →".
3. **Booking card** *(gap 4)*: no glow or blur. 1px hairline, a soft long shadow, opaque card fill. Teal is left only on the "3 nights" tag. Site buttons are 48px tall with 16px labels (~12px on screen).
4. **Feature icons** *(gap 6)*: moved beside the row number at 20px with a 1.5px stroke, in full ink. Feature title column widened so titles don't run into descriptions.
5. **Teal in the chrome** *(gap 5)*: the rail header is neutral. Site eyebrows stay teal because §4 asks for accent-coloured eyebrow labels.
6. Suggestion chips wrap two per row in the narrower chat. The site renders at 1120px virtual width (scale ~0.71), and the fixed state puts the hero eyebrow 16px below the top of the page view, so the Testimonials eyebrow stays in frame.

Functional tests after changes: **33/33 pass**.

---

## Iteration 6 (final, hard cap reached)

| | |
|---|---|
| Screenshot | `screenshots/iter-6.png` (taken after the iteration 5 changes) |
| Our letter | A |
| Our rank | **5 / 5** (D > C > E > B > A) |
| Our scores | Composition 3 · Spacing 4 · Typography 3 · Color 4 · Components 4 · Originality 3 |
| Our total | **21 / 30** (down from 22) |
| Others | D 26 · C 25 · E 24 · B 22 |

**Top gaps for A (critic, in order of impact)**
1. Rail, preview and chat at equal weight; the headline competes with the black chat bubble and the black CTA. Dim the chrome, collapse the rail to a 56px icon strip, put the canvas on a tinted backdrop.
2. The serif headline renders as a Times-like default with loose leading. Use a real display serif at line-height 1.0, −1.5% tracking.
3. Wide-tracked teal mono eyebrows used everywhere are an AI-template tell. Keep mono for the builder chrome; use neutral small-caps sans inside the page.
4. The module rail (iso tiles, zigzag connectors) is filler for a 7-word list, and the agent card duplicates the chat.
5. Booking card: the "3 NIGHTS" badge and the mono footnote are ~9px and orphaned.

**Changes made** (not scored; the cap ends the loop after this iteration)
1. **Booking card** *(gap 5)*: the teal badge became plain "3 nights" in the card header; the price line moved above the button in 16px sans (~11.4px on screen). No mono micro-text left in the card.

**Not acted on.** Gaps 1, 3 and 4 again ask to remove or flatten what PROMPT.md §4 requires: the isometric module scene, the floating agent panel mirroring the chat, and accent-coloured spaced-caps eyebrows. Gap 2 is about font choice; the page uses system fonts only (no external assets), and the user asked not to focus on font families.

Functional tests after changes: **33/33 pass**.

---

## Final summary

| Iteration | Reference set | Our letter | Rank | Total |
|---|---|---|---|---|
| 1 | 1 (GIFs) | D | 1 / 5 | 22 |
| 2 | 1 (GIFs) | E | 2 / 5 | 22 |
| 3 | 2 (PNGs) | C | 5 / 5 | 21 |
| 4 | 2 | E | 5 / 5 | 18 |
| 5 | 2 | C | 4 / 5 | 22 |
| 6 | 2 | A | 5 / 5 | 21 |

**Stopped because the 6-iteration hard cap was reached.** The Phase 2 goal (#1 or #2 in two consecutive runs on the real-UI references) was not met.

**What the critic kept saying.** Across iterations 3–6 the top gaps came back to the same three elements: the isometric module scene, the floating agent panel, and teal mono eyebrows. Each is required by PROMPT.md §4, so the loop could shrink, move and quieten them but not remove them. Reducing them helped (rail: 18 → 22) but couldn't close the gap on the references (24–27). The other recurring gap is type quality, limited by system-only fonts.

**Options for another round**, if wanted:
- Relax §4 for the builder chrome (for example a flat numbered module list, with the isometric scene shown only while a module is being placed, and no mirrored agent panel), then rescore.
- Allow one embedded display serif (base64 in the file, so still no external assets).
- Re-pin the fixed screenshot state to the hero only, if "3 sections visible" can be dropped. That rule is what forces the preview down to ~0.7 scale.

---

## Iteration 7 (extra round, user chose option 2: embed a display serif)

Run after the 6-iteration cap at the user's request, to measure one change: **Instrument Serif** (SIL OFL 1.1) embedded as base64, about 58 KB for the latin regular and italic. The license is in `fonts/OFL-InstrumentSerif.txt`. Display sizes and tracking were retuned for its narrower proportions (hero 76px, section heads 56–60px, tracking −0.5% instead of −2%).

| | |
|---|---|
| Screenshot | `screenshots/iter-7.png` |
| Our letter | B |
| Our rank | **4 / 5** (C > A > D > B > E) |
| Our scores | Composition 3 · Spacing 4 · Typography **4** · Color 3 · Components 4 · Originality 3 |
| Our total | **21 / 30** (same as iteration 6) |
| Others | C 26 · A 25 · D 24 · E 20 |

**Effect of the font.** Typography went from 3 to 4, and the critic no longer calls the headline a default face; it now reads as "condensed display serif". Rank went from 5th to 4th. The total didn't move because Color dropped from 4 to 3, so the font fixed what it targeted but didn't change the overall picture.

**Top gaps for B (critic, in order of impact).** No changes made after this run.
1. The three-pane shell has equal weight: collapse the module rail to a 56px icon strip, narrow the chat to 320px, give the canvas at least 65% of the width.
2. The isometric module rail is decorative filler that clashes with the flat line icons. Use a numbered list with a 2px active bar.
3. Redundant status: the agent card repeats the chat, and the chat's 7-row checklist repeats the rail. Delete the card; collapse the checklist to "7 modules built".
4. Four type voices, with teal mono-caps eyebrows on every section. Keep mono for the builder chrome; use neutral small-caps sans eyebrows in the preview.
5. The hero booking card isn't aligned to the headline's cap height; the 3-line headline is cramped. Align the card top, use a hairline, break the headline in 2 lines.

Gaps 1–4 are the same structural complaints as iterations 3–6, aimed at elements PROMPT.md §4 requires (option 1 in the summary above). Gap 5 is a new, small layout fix.

---

## Iteration 8 (option 1: plain rail, isometric scene only while building)

User-approved change to PROMPT.md §4 for the builder chrome:
- **Module rail** is a plain numbered list (mono index, label, 2px accent bar on the active section); clicking a row jumps to that section.
- **Isometric scene** becomes a compact build stage (bottom-right card, about 560×184) that fades in only while sections are being built: the module drops, the connector draws, the section unfolds, and the stage fades out when the turn ends. Its viewport fits the modules present, so they render near 1:1.
- **Mirrored agent panel removed**; the agent's message lives in the chat only.
- **Chat checklist** collapses to one line ("7 modules built") with an expander.
- **Hero**: the default headline is now "The quiet side of Trancoso." (two lines), and the booking card is top-aligned with the text column.
- **Fixed screenshot state changed**, because the scene is no longer visible at rest: `tests/screenshot.cjs` now captures a real mid-build frame. A test-only `?pauseAfter=3` URL flag freezes the first build after its third section (hero, features, testimonials), with the build stage showing.

| | |
|---|---|
| Screenshot | `screenshots/iter-8.png` |
| Our letter | A |
| Our rank | **4 / 5** (B > E > C > A > D) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 4 · Components 4 · Originality 3 |
| Our total | **22 / 30** (up from 21; ties our best on reference set 2) |
| Others | B 27 · E 26 · C 25 · D 21 |

**Top gaps for A (critic, in order of impact).** No changes made after this run.
1. The "Assembling" stage covers feature rows 03–04 and truncates a title: the worst hierarchy failure. Dock it as a 56px strip at the canvas bottom, or move it into the chat panel under the checklist; never cover the preview.
2. No focal point across the panes: collapse the 200px rail to a 48px icon rail, widen the canvas, add 24px of top padding so the page frame reads as an object.
3. Teal spaced-mono eyebrows used 5 times blur product chrome with page content: mono for chrome only, neutral small-caps sans in the preview, teal for the live-status dot.
4. The booking card sits ~25px above the headline's cap height; "See the rooms" and "Check availability" still compete. Use a hairline instead of the shadow; demote "See the rooms" to a text link.
5. Feature rows sit on four baselines; drop the icons and align the description column with the paragraph above.

**Reading.** The rail and agent-panel complaints from iterations 3–7 are gone. The new #1 gap is caused by where the build stage sits (it covers the preview in the mid-build frame), not by having it.

---

## Iteration 9 (build stage in the chat, icon rail, neutral page eyebrows)

Changes scored in this run (made after iteration 8, at the user's request):
- **Build stage in the chat panel**: the isometric stage opens under the conversation only while sections are being built, with a camera that follows the newest module. It never covers the preview.
- **Rail**: a 56px icon strip (one line icon per section, labels as tooltips, 2px accent bar on the active one).
- **Preview eyebrows**: neutral grey 13px sans caps instead of teal mono (a further, user-approved departure from §4; mono stays in the tool chrome).
- **Hero**: "See the rooms" is a text link; the booking card is aligned to the headline's cap height.
- **Feature rows**: no icons, one baseline, descriptions aligned under the section lede.

| | |
|---|---|
| Screenshot | `screenshots/iter-9.png` |
| Our letter | E |
| Our rank | **4 / 5** (C > B > A > E > D) |
| Our scores | Composition 3 · Spacing 4 · Typography 4 · Color 3 · Components 4 · Originality 3 |
| Our total | **21 / 30** (down from 22) |
| Others | C 26 · B 25 · A 22 · D 20 |

**Top gaps for E (critic, in order of impact).** No changes made after this run.
1. The preview hero has no image or visual anchor. A hospitality page rendered as text plus a booking card reads as a wireframe. Use a full-width photograph or a 60/40 split, with the booking card overlapping its lower edge.
2. Rail, canvas and chat sit at the same near-white value. Put the canvas on a darker neutral well with the page as a raised sheet, and tint the chat one step off-white.
3. The pale cyan accent appears in four small places at low contrast (teal mono labels ~3:1). Commit to one saturated accent ("deep moss green would match the name") and darken the mono labels to 4.5:1.
4. The "Assembling" widget duplicates the checklist above it, its labels collide, and it's "the most generic AI-builder trope on the screen". Delete it and turn the checklist into a 7-step progress row.
5. Feature rows still on three baselines; the description column (x≈628) doesn't line up with the booking card (x≈664).

**Reading.** Moving the stage and slimming the rail removed iteration 8's top gaps (preview occlusion, rail width), but the total held flat (22 → 21, within the critic's ±1 run-to-run noise). Across iterations 5–9 the score has plateaued at 21–22, while the references sit at 24–27. The newly exposed #1 gap, no imagery in the generated hero, is the largest remaining lever, and the only one that doesn't conflict with the brief: an inline SVG or CSS illustration would keep the file self-contained. Gaps 3 and 4 ask to replace the ice-cyan accent and delete the isometric build moment, both core to PROMPT.md §4.

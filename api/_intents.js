// Intent router data: free-form requests that map to an instant builder command (no LLM needed).
// Each intent's "canonical" is a phrase the browser's quickStyle() runs; {section} is filled from the message
// ("{section?}" may be left out). The index name changes whenever this list changes, so a new index is built.

export const INTENTS = [
  // motion
  { canonical: 'Make it lively', examples: ['make it pop', 'more energy please', 'add more movement', 'make it feel alive', 'bouncier please', 'jazz it up with motion', 'more dynamic animations', 'make the page more animated'], avoid: /\b(tone down|less|calm|subtle|gentle|softer|slow|no |stop|remove|kill|disable|without)\b/i },
  { canonical: 'Add some animation', examples: ['a little motion would be nice', 'subtle animations', 'animate the page gently', 'add a bit of movement', 'can things fade in as I scroll', 'make sections slide in', 'calmer animation'], avoid: /\b(more|lively|crank|pop|energ|bounc|jazz|dynamic|no |stop|remove|kill|disable|without|static|still)\b/i },
  { canonical: 'No animations', examples: ['stop everything moving', 'kill the motion', 'keep it static', "I don't want things moving around", 'turn the effects off', 'too much movement, remove it', 'no motion at all'], require: /\b(no|stop|remove|kill|disable|off|static|still|without|less|none|don.?t)\b/i },
  { canonical: 'Replay the animation', examples: ['show me the intro again', 'play the entrance again', 'run the animation one more time', 'replay the intro'], require: /\b(again|replay|re-?run|once more|one more)\b/i },
  // buttons
  { canonical: 'Outline buttons', examples: ['buttons with just a border', 'hollow buttons', 'bordered buttons with no fill', 'make the buttons outlined'], require: /\b(border|outline|hollow|without fill|no fill|unfilled)/i },
  { canonical: 'Soft buttons', examples: ['tinted buttons', 'pastel buttons', 'a subtle background on the buttons'], require: /\b(soft|tint|pastel|subtle|pale|light)/i },
  { canonical: 'Ghost buttons', examples: ['text only buttons', 'link style buttons', 'buttons that look like links'], require: /\b(ghost|link|text[- ]only|plain text)/i },
  { canonical: 'Solid buttons', examples: ['filled buttons', 'make the buttons a solid colour', 'bold filled buttons'], require: /\b(solid|fill|filled|bold)/i, avoid: /\b(without fill|no fill|unfilled|hollow|outline|border)/i },
  { canonical: 'Bigger buttons', examples: ['chunkier buttons', 'make the buttons larger', 'huge call to action buttons', 'the buttons are too small'], require: /\b(big|bigger|large|larger|huge|chunk|enlarg|grow|too small)/i, avoid: /\b(smaller|tiny|shrink|less big|too big)\b/i },
  { canonical: 'Smaller buttons', examples: ['tiny buttons', 'make the buttons less big', 'the buttons are too big'], require: /\b(small|smaller|tiny|shrink|less big|too big|reduce)/i, avoid: /\b(bigger|larger|huge|enlarg|chunk|too small)\b/i },
  { canonical: 'Glow on hover', examples: ['buttons should glow when I hover', 'a glowing hover effect', 'a halo around buttons on hover'], require: /\bglow|halo/i },
  { canonical: 'Lift on hover', examples: ['buttons float up on hover', 'raise the buttons when hovered'], require: /\b(lift|rise|raise|float up)/i },
  { canonical: 'Fill on hover', examples: ['buttons fill with colour on hover', 'colour the buttons in when you hover'], require: /\bfill|colou?r (the buttons )?in\b/i },
  { canonical: 'Underline on hover', examples: ['underline the buttons when hovering', 'hover should underline the buttons'], require: /underline/i },
  // nav
  { canonical: 'Floating nav', examples: ['a pill shaped menu', 'a floating header bar', 'rounded navigation that floats'], require: /\b(float|pill)/i },
  { canonical: 'Minimal nav', examples: ['strip down the menu', 'simpler navigation', 'hide the menu links'], require: /\b(minimal|simpl|strip|hide|clean|bare)/i, avoid: /\b(stick|sticky|pin|fixed)\b/i },
  { canonical: 'Centered nav', examples: ['put the logo in the middle of the header', 'centre the menu', 'a center aligned header'], require: /\b(cent(er|re)|middle)/i, avoid: /\b(stick|sticky|pin|fixed|top when|follow)\b/i },
  { canonical: 'Bar nav', examples: ['a normal top bar', 'classic navigation bar', 'a regular header again'], require: /\b(bar|normal|regular|classic|standard|default)/i },
  { canonical: 'Sticky nav', examples: ['keep the menu at the top when scrolling', 'pin the header', 'fixed navigation', 'the menu should follow me down the page'], require: /\b(stick|sticky|pin|fixed|follow|stay|visible|keep|top)/i, avoid: /\b(unstick|unpin|scroll (away|off)|not sticky|stop)\b/i },
  { canonical: 'Unstick the nav', examples: ['let the menu scroll away', 'unpin the header', 'stop the menu following me'], require: /\b(unstick|unpin|scroll (away|off)|not sticky|stop)/i },
  // one section's look
  { canonical: 'Dark background on the {section}', examples: ['make the faq dark', 'a black background behind the pricing', 'invert the testimonials', 'put the call to action on dark'], require: /\b(dark|black|invert|night)/i },
  { canonical: 'Accent background on the {section}', examples: ['brand colour behind the pricing', 'make the faq colourful', 'colour block the cta section'], require: /\b(accent|brand|colou?r(ed|ful)?|bright)/i, avoid: /\b(remove|reset|white|plain|no colou?r)\b/i },
  { canonical: 'Plain background on the {section}', examples: ['a white background for the faq', 'remove the colour from the pricing', 'reset the background of the features'], require: /\b(white|plain|light|reset|default|remove the colou?r|no colou?r)/i, avoid: /\b(dark|black|brand|accent)\b/i },
  { canonical: 'More space around the {section}', examples: ['give the faq room to breathe', 'more padding on the pricing', 'spread out the features section'], require: /\b(space|spacing|padding|room|breath|spread|whitespace|airy)/i, avoid: /\b(less|tight|reduce|compress)/i },
  { canonical: 'Less space around the {section}', examples: ['tighten up the faq', 'less padding on the hero', 'compress the pricing section'], require: /\b(tight|less|reduce|compress|trim)/i, avoid: /\b(more|extra|breath)\b/i },
  { canonical: 'Round the {section} corners', examples: ['rounded corners on the pricing', 'soften the edges of the faq section'], require: /\b(round|soft)/i, avoid: /\b(square|sharp)\b/i },
  { canonical: 'Square the {section} corners', examples: ['sharp corners on the cta', 'no rounding on the features'], require: /\b(square|sharp|no round)/i },
  { canonical: 'Center the {section}', examples: ['center align the features', 'put the faq text in the middle'], require: /\b(cent(er|re)|middle)/i },
  // photos
  { canonical: 'Add a photo to the {section?}', examples: ['upload a picture to the hero', 'use my own image', 'put a photo of my shop in there', 'I want to add my own picture'], require: /\b(photo|picture|image|pic|img)/i, avoid: /\b(gallery|page)\b/i },
  // undo and views
  { canonical: 'Undo', examples: ['go back', 'revert that', 'I preferred it before', 'put it back how it was', 'that was better before'], require: /\b(undo|revert|go back|back how|before|previous|put it back)/i, avoid: /\b(page|site preview|website)\b/i },
  { canonical: 'Show the map', examples: ['show me the flow chart', 'open the canvas view', 'zoom out to the map'], require: /\b(map|flow|canvas|chart)/i, avoid: /\b(checkout|booking|sign ?up|journey|funnel|process)\b/i },
  { canonical: 'Back to the page', examples: ['show me the website again', 'return to the page', 'go back to the site preview'], require: /\b(page|site|website|preview)/i },
];

/** Keyword guards: a command is only eligible when the message passes its require/avoid patterns. */
export function eligible(canonical, message) {
  const it = INTENTS.find((x) => x.canonical === canonical); if (!it) return false;
  const m = String(message || '').toLowerCase();
  return (!it.require || it.require.test(m)) && (!it.avoid || !it.avoid.test(m));
}

/** One document per example (and per canonical phrase). */
export function intentDocs() {
  const docs = [];
  INTENTS.forEach((it, i) => {
    [it.canonical.replace(/\{section\??\}/g, 'section'), ...it.examples].forEach((text, j) => docs.push({ id: `i${i}-${j}`, text, metadata: { canonical: it.canonical } }));
  });
  return docs;
}

// The index name carries a short hash of the data, so editing the list builds a fresh index automatically.
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
export const INTENT_INDEX = `builder-intents-${hash(JSON.stringify(INTENTS.map((x) => [x.canonical, x.examples])))}`; // guards don't change the index

// Intent router data: free-form requests that map to an instant builder command (no LLM needed).
// Each intent's "canonical" is a phrase the browser's quickStyle() runs; {section} is filled from the message
// ("{section?}" may be left out). The index name changes whenever this list changes, so a new index is built.

export const INTENTS = [
  // motion
  { canonical: 'Make it lively', examples: ['make it pop', 'more energy please', 'add more movement', 'make it feel alive', 'bouncier please', 'jazz it up with motion', 'more dynamic animations', 'make the page more animated'] },
  { canonical: 'Add some animation', examples: ['a little motion would be nice', 'subtle animations', 'animate the page gently', 'add a bit of movement', 'can things fade in as I scroll', 'make sections slide in', 'calmer animation'] },
  { canonical: 'No animations', examples: ['stop everything moving', 'kill the motion', 'keep it static', "I don't want things moving around", 'turn the effects off', 'too much movement, remove it', 'no motion at all'] },
  { canonical: 'Replay the animation', examples: ['show me the intro again', 'play the entrance again', 'run the animation one more time', 'replay the intro'] },
  // buttons
  { canonical: 'Outline buttons', examples: ['buttons with just a border', 'hollow buttons', 'bordered buttons with no fill', 'make the buttons outlined'] },
  { canonical: 'Soft buttons', examples: ['tinted buttons', 'pastel buttons', 'a subtle background on the buttons'] },
  { canonical: 'Ghost buttons', examples: ['text only buttons', 'link style buttons', 'buttons that look like links'] },
  { canonical: 'Solid buttons', examples: ['filled buttons', 'make the buttons a solid colour', 'bold filled buttons'] },
  { canonical: 'Bigger buttons', examples: ['chunkier buttons', 'make the buttons larger', 'huge call to action buttons', 'the buttons are too small'] },
  { canonical: 'Smaller buttons', examples: ['tiny buttons', 'make the buttons less big', 'the buttons are too big'] },
  { canonical: 'Glow on hover', examples: ['buttons should glow when I hover', 'a glowing hover effect', 'a halo around buttons on hover'] },
  { canonical: 'Lift on hover', examples: ['buttons float up on hover', 'raise the buttons when hovered'] },
  { canonical: 'Fill on hover', examples: ['buttons fill with colour on hover', 'colour the buttons in when you hover'] },
  { canonical: 'Underline on hover', examples: ['underline the buttons when hovering', 'hover should underline the buttons'] },
  // nav
  { canonical: 'Floating nav', examples: ['a pill shaped menu', 'a floating header bar', 'rounded navigation that floats'] },
  { canonical: 'Minimal nav', examples: ['strip down the menu', 'simpler navigation', 'hide the menu links'] },
  { canonical: 'Centered nav', examples: ['put the logo in the middle of the header', 'centre the menu', 'a center aligned header'] },
  { canonical: 'Bar nav', examples: ['a normal top bar', 'classic navigation bar', 'a regular header again'] },
  { canonical: 'Sticky nav', examples: ['keep the menu at the top when scrolling', 'pin the header', 'fixed navigation', 'the menu should follow me down the page'] },
  { canonical: 'Unstick the nav', examples: ['let the menu scroll away', 'unpin the header', 'stop the menu following me'] },
  // one section's look
  { canonical: 'Dark background on the {section}', examples: ['make the faq dark', 'a black background behind the pricing', 'invert the testimonials', 'put the call to action on dark'] },
  { canonical: 'Accent background on the {section}', examples: ['brand colour behind the pricing', 'make the faq colourful', 'colour block the cta section'] },
  { canonical: 'Plain background on the {section}', examples: ['a white background for the faq', 'remove the colour from the pricing', 'reset the background of the features'] },
  { canonical: 'More space around the {section}', examples: ['give the faq room to breathe', 'more padding on the pricing', 'spread out the features section'] },
  { canonical: 'Less space around the {section}', examples: ['tighten up the faq', 'less padding on the hero', 'compress the pricing section'] },
  { canonical: 'Round the {section} corners', examples: ['rounded corners on the pricing', 'soften the edges of the faq section'] },
  { canonical: 'Square the {section} corners', examples: ['sharp corners on the cta', 'no rounding on the features'] },
  { canonical: 'Center the {section}', examples: ['center align the features', 'put the faq text in the middle'] },
  // photos
  { canonical: 'Add a photo to the {section?}', examples: ['upload a picture to the hero', 'use my own image', 'put a photo of my shop in there', 'I want to add my own picture'] },
  // undo and views
  { canonical: 'Undo', examples: ['go back', 'revert that', 'I preferred it before', 'put it back how it was', 'that was better before'] },
  { canonical: 'Show the map', examples: ['show me the flow chart', 'open the canvas view', 'zoom out to the map'] },
  { canonical: 'Back to the page', examples: ['show me the website again', 'return to the page', 'go back to the site preview'] },
];

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
export const INTENT_INDEX = `builder-intents-${hash(JSON.stringify(INTENTS))}`;

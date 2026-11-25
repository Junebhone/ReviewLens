// Team deck. Slides 1–6 are Dinh's slides, copied unchanged from docs/slides/build_slides.js; slides 7–13
// (QLoRA method, training, results, Exp. 2, comparison, conclusions) are JN's, added in the same style. Longqi's BERT slides are still to be added.
// Run:  (cd ../docs/slides && npm install) && NODE_PATH=../docs/slides/node_modules node build_deck.js
// Rebuilding overwrites the .pptx, so hand edits made in PowerPoint are lost.
const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("../docs/slides/apply_theme.js");
const D = require("./deck_data.js"); // numbers for the tables and for slides 7 onwards

const OUT = process.argv[2] || path.join(__dirname, "ReviewLens_Presentation.pptx");

// Palette: charcoal dominant, amber accent (Neutral is the story), sentiment colors for data.
const HEX = {
  ink: "232A34", paper: "FFFFFF", slate: "3C4A5C", mist: "DCE2E9",
  amber: "E39B2D", neg: "C2553F", pos: "4C8C5A", grey: "9AA5B1", teal: "2F6F7E",
};
const THEME = {
  name: "ReviewLens",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.ink, lt1: HEX.paper, dk2: HEX.slate, lt2: HEX.mist,
    accent1: HEX.amber, accent2: HEX.teal, accent3: HEX.neg, accent4: HEX.pos,
    accent5: HEX.grey, accent6: "6B5B95", hlink: HEX.teal, folHlink: "6B5B95",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "ReviewLens: Sentiment Classification of E-Commerce Product Reviews";
pres.author = "Bhone Kyaw Si Hein, Quoc Cuong Dinh, Longqi Sun";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Content",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75,
      fontSize: 28, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "ReviewLens · EDS 6352 · Fall 2026",
      options: { x: 0.5, y: 5.2, w: 6, h: 0.25, fontSize: 9, color: C.text2, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontSize: 9, color: C.text2, align: "right" },
});
pres.defineSlideMaster({
  title: "Dark",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75,
      fontSize: 28, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontSize: 9, color: C.accent5, align: "right" },
});

const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0 }, o));
const card = (s, name, x, y, w, h, fill) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: name, x, y, w, h, rectRadius: 0.08,
    fill: { color: fill || C.background2 }, line: { type: "none" } });
const chartText = {
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
  legendFontFace: "+mn-lt", titleFontFace: "+mn-lt",
  catAxisLabelColor: HEX.slate, valAxisLabelColor: HEX.slate, dataLabelColor: HEX.ink,
  catAxisLabelFontSize: 11, valAxisLabelFontSize: 9, dataLabelFontSize: 10, legendFontSize: 10,
  legendColor: HEX.slate,
};

const chip = (s, name, x, y, w, h, text, fill) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: name, x, y, w, h, rectRadius: 0.06,
    fill: { color: fill }, line: { type: "none" } });
  T(s, text, { x, y, w, h, fontSize: 12, bold: true, color: HEX.paper, align: "center", valign: "middle" });
};

// ---------- Intro ----------
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Introduction" });
  s.addText("ReviewLens: Sentiment Classification of\nE-Commerce Product Reviews", { placeholder: "title", fontSize: 22 });
  T(s, "Sellers get thousands of reviews; finding unhappy customers by hand is slow.",
    { x: 0.5, y: 1.08, w: 9, h: 0.35, fontSize: 13, color: C.text2 });

  // Example: a real 3-star test review that reads like a complaint
  card(s, "review-card", 0.5, 1.6, 2.9, 2.2);
  T(s, "★★★☆☆", { x: 0.7, y: 1.72, w: 2.5, h: 0.35, fontSize: 18, color: C.accent1 });
  T(s, "“Too heavy, bulky. Only works with a few Samsung phones. Biggest gripe is that the controls are up on the headset itself…”",
    { x: 0.7, y: 2.1, w: 2.5, h: 1.25, fontSize: 12, italic: true, color: C.text1, valign: "top" });
  T(s, "3-star review from the test set", { x: 0.7, y: 3.42, w: 2.5, h: 0.25, fontSize: 9, color: C.text2 });
  s.addShape(pres.shapes.CHEVRON, { objectName: "review-arrow", x: 3.5, y: 2.55, w: 0.2, h: 0.3,
    fill: { color: C.accent5 }, line: { type: "none" } });
  [["Negative", HEX.neg], ["Neutral", HEX.amber], ["Positive", HEX.pos]].forEach(([t, col], i) =>
    chip(s, `label-${t}`, 3.8, 1.75 + i * 0.7, 1.05, 0.5, t, col));

  // Three methods, one dataset
  T(s, "One task, three methods, same data", { x: 5.2, y: 1.55, w: 4.3, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
  const methods = [
    ["Fine-tuned BERT", "bert-base-uncased + classification head", "Longqi Sun"],
    ["Prompted Llama 3.1 8B", "zero- / few-shot, no training", "Quoc Cuong Dinh"],
    ["Llama 3.1 8B + QLoRA", "4-bit base, trained low-rank adapters", "Bhone Kyaw Si Hein"],
  ];
  methods.forEach(([m, d, who], i) => {
    const y = 1.98 + i * 0.62;
    card(s, `method-${i + 1}`, 5.2, y, 4.3, 0.54);
    s.addShape(pres.shapes.OVAL, { objectName: `method-num-${i + 1}`, x: 5.32, y: y + 0.11, w: 0.32, h: 0.32,
      fill: { color: C.text2 }, line: { type: "none" } });
    T(s, String(i + 1), { x: 5.32, y: y + 0.11, w: 0.32, h: 0.32, fontSize: 12, bold: true,
      color: C.background1, align: "center", valign: "middle" });
    T(s, [
      { text: m, options: { fontSize: 13, bold: true, color: HEX.ink, breakLine: true } },
      { text: d, options: { fontSize: 10, color: HEX.slate } },
    ], { x: 5.75, y: y + 0.03, w: 2.45, h: 0.48, valign: "middle" });
    T(s, who, { x: 8.1, y: y + 0.03, w: 1.3, h: 0.48, fontSize: 10, color: C.accent2, align: "right", valign: "middle" });
  });

  card(s, "metric", 0.5, 4.1, 9, 0.75);
  T(s, [
    { text: "Main metric: macro-F1 ", options: { bold: true, color: HEX.ink } },
    { text: "(the mean of the three per-class F1 scores, so Neutral counts as much as the easy classes). Also reported: per-class precision, recall and F1.", options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.15, w: 8.5, h: 0.65, fontSize: 12, valign: "middle" });

  s.addNotes("[~60 s · 0:00–1:00]\nHello everyone, I'm Quoc, and our project is ReviewLens. Every online seller has the same problem: thousands of reviews come in, and the ones that matter most, from unhappy customers, are buried in the pile. Our goal is to sort every review automatically into Negative, Neutral or Positive.\nWhat makes this project interesting is that we solve the same task in three different ways, on exactly the same data. Longqi fine-tunes BERT, Bhone fine-tunes Llama with QLoRA, and I take the opposite route: the same Llama with no training at all, only prompting. So we can ask a practical question: how much does training actually buy you?\nWe judge everything by macro-F1, so the hard Neutral class counts as much as the easy ones. And keep this review in mind: it has three stars, but it reads like a complaint. We'll come back to that.");
}

// ---------- Data ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Introduction" });
  s.addText("Data: one shared, balanced split", { placeholder: "title" });

  const funnel = [
    ["Data source", "20.8 M", "Cell Phones & Accessories reviews, Amazon Reviews 2023"],
    ["Filtering", "1.11 M", "100–300 words, duplicates dropped; links, @, #, emojis removed"],
    ["Balancing", "50,000", "balanced sample:\n16,667 / 16,667 / 16,666"],
    ["Splitting", "40k/5k/5k", "stratified train / val / test, used by all three methods"],
  ];
  funnel.forEach(([h, n, d], i) => {
    const x = 0.5 + i * 2.3;
    card(s, `funnel-${i + 1}`, x, 1.15, 2.1, 1.6, i === 3 ? "F8E0B8" : C.background2);
    T(s, h, { x: x + 0.15, y: 1.25, w: 1.8, h: 0.3, fontSize: 14, bold: true, color: C.text1 });
    T(s, n, { x: x + 0.15, y: 1.55, w: 1.8, h: 0.5, fontSize: 24, bold: true, fontFace: "Cambria",
      color: i === 3 ? C.accent1 : C.accent2 });
    T(s, d, { x: x + 0.15, y: 2.07, w: 1.8, h: 0.62, fontSize: 10.5, color: C.text2, valign: "top" });
    if (i < 3) s.addShape(pres.shapes.CHEVRON, { objectName: `funnel-arrow-${i + 1}`, x: x + 2.13, y: 1.82,
      w: 0.14, h: 0.25, fill: { color: C.accent5 }, line: { type: "none" } });
  });

  // Star rating -> label
  card(s, "labels", 0.5, 2.95, 4.35, 1.8);
  T(s, "Gold label = star rating", { x: 0.7, y: 3.05, w: 4.0, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
  [["1–2 ★\nNegative", HEX.neg], ["3 ★\nNeutral", HEX.amber], ["4–5 ★\nPositive", HEX.pos]].forEach(([t, col], i) =>
    chip(s, `stars-${i + 1}`, 0.7 + i * 1.35, 3.5, 1.2, 0.65, t, col));
  T(s, "Neutral is the scarcest: 131k eligible vs 243k Negative and 737k Positive, hence the balanced sample.",
    { x: 0.7, y: 4.22, w: 4.0, h: 0.45, fontSize: 10.5, color: C.text2, valign: "top" });

  // Experiment 2
  card(s, "exp2", 5.15, 2.95, 4.35, 1.8, "F8E0B8");
  T(s, "Experiment 2: AI-labelled reviews", { x: 5.35, y: 3.05, w: 4.0, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
  T(s, [
    { text: "600 extra reviews (200 per star class), not in the 50k", options: { bullet: { indent: 12 }, breakLine: true } },
    { text: "Claude Haiku labels them from the text only, stars hidden", options: { bullet: { indent: 12 }, breakLine: true } },
    { text: "Every method is also scored against these labels", options: { bullet: { indent: 12 } } },
  ], { x: 5.35, y: 3.42, w: 4.0, h: 0.85, fontSize: 11.5, color: C.text1, valign: "top", paraSpaceAfter: 2 });
  T(s, "Claude's labels: 260 Neg · 169 Neu · 171 Pos", { x: 5.35, y: 4.32, w: 4.0, h: 0.3, fontSize: 11.5, bold: true, color: C.accent2 });

  T(s, "Source: Amazon Reviews 2023, McAuley Lab (UCSD) · split seed 42",
    { x: 0.5, y: 4.8, w: 9, h: 0.28, fontSize: 10, italic: true, color: C.text2 });

  s.addNotes("[~60 s · 1:00–2:00]\nAll three methods share one dataset, so any difference in results comes from the method, not the data. We start from Amazon's Cell Phones and Accessories reviews, keep reviews long enough to carry a real opinion, and clean out the noise.\nLabels come from the star rating, which is standard practice, but it creates a problem: Neutral reviews are by far the rarest. On the natural mix, a model could almost ignore Neutral and still look good. So we draw a balanced sample and fix one train, validation and test split that everyone uses.\nThere's one assumption here worth questioning: is the star rating really the truth? To test it, I added Experiment 2: a separate set of reviews labelled by Claude from the text alone, with the stars hidden. Scoring every method against both label sets lets us separate model error from label noise.");
}

// ---------- Slide 1: Method ----------
pres.addSection({ title: "Prompted Llama" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Prompted Llama 3.1 8B, no training", { placeholder: "title" });

  // Process flow: 3 numbered steps
  const steps = [
    ["Prompt", "Instructions + definitions\n+ examples + review"],
    ["Generate", "Llama-3.1-8B-Instruct\ngreedy decoding"],
    ["Extract", "Exact label, else first\nwhole-word label match"],
  ];
  steps.forEach(([h, d], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `step-${i + 1}`, x, 1.3, 2.8, 1.35);
    s.addShape(pres.shapes.OVAL, { objectName: `step-num-${i + 1}`, x: x + 0.2, y: 1.45, w: 0.45, h: 0.45,
      fill: { color: C.accent1 }, line: { type: "none" } });
    T(s, String(i + 1), { x: x + 0.2, y: 1.45, w: 0.45, h: 0.45, fontSize: 16, bold: true,
      color: C.background1, align: "center", valign: "middle" });
    T(s, h, { x: x + 0.8, y: 1.45, w: 1.9, h: 0.45, fontSize: 18, bold: true, color: C.text1, valign: "middle",
      fontFace: "Cambria" });
    T(s, d, { x: x + 0.2, y: 1.98, w: 2.5, h: 0.6, fontSize: 12, color: C.text2 });
    if (i < 2) s.addShape(pres.shapes.CHEVRON, { objectName: `arrow-${i + 1}`, x: x + 2.85, y: 1.83,
      w: 0.18, h: 0.25, rotate: 0, fill: { color: C.accent5 }, line: { type: "none" }, flipH: false });
  });

  // Baseline vs final design
  const settings = [
    ["Zero-shot (baseline)", "Instructions only", "266 tokens / prompt"],
    ["Few-shot k=5 + definitions", "15 examples from train + label definitions\nbest of 8 designs on 600 val reviews", "2,874 tokens / prompt"],
  ];
  settings.forEach(([h, d, tok], i) => {
    const x = 0.5 + i * 4.65;
    card(s, `setting-${i + 1}`, x, 2.95, 4.35, 1.4, i === 1 ? "F8E0B8" : C.background2);
    T(s, h, { x: x + 0.25, y: 3.07, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: C.text1 });
    T(s, d, { x: x + 0.25, y: 3.45, w: 3.9, h: 0.5, fontSize: 12, color: C.text2, valign: "top" });
    T(s, tok, { x: x + 0.25, y: 3.95, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: C.accent2, valign: "top" });
  });
  T(s, "Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1",
    { x: 0.5, y: 4.6, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.text2 });

  s.addNotes("[~40 s · 2:00–2:40]\nMy method needs no training at all. Llama 3.1 8B Instruct reads one prompt: instructions, a short definition of each label, a few labelled examples, and then the review. It answers with greedy decoding, so every result is deterministic and reproducible, and a simple parser extracts the label.\nThe real design work is the prompt itself. I treated it like a hyperparameter: I compared eight designs on the validation set only and kept the test set untouched until the end. One trade-off to keep in mind is cost: the winning prompt is about ten times longer than zero-shot, so every prediction is slower and more expensive.");
}

// ---------- Slide 2: Test results ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("The best prompt lifts test macro-F1: 0.68 → 0.78", { placeholder: "title" });

  s.addChart(pres.charts.BAR, [
    { name: "Zero-shot", labels: ["Negative", "Neutral", "Positive", "Macro"], values: [0.732, 0.430, 0.868, 0.677] },
    { name: "Few-shot k=5 + definitions", labels: ["Negative", "Neutral", "Positive", "Macro"], values: [0.788, 0.675, 0.886, 0.783] },
  ], Object.assign({
    objectName: "f1-chart", x: 0.4, y: 1.15, w: 5.0, h: 3.85, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.grey, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00",
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", showTitle: true, title: "F1 per class (test, n = 5,000)", titleFontSize: 12,
    titleColor: HEX.ink,
  }, chartText));

  prfTable(s, D.few, "Final design: per-class scores (test set)"); // was a confusion matrix

  card(s, "takeaway", 5.7, 3.65, 3.8, 1.15, "F3D2C9");
  T(s, [
    { text: "29% of Neutral reviews → Negative", options: { bold: true, color: HEX.neg, breakLine: true } },
    { text: "Still the main error (62% zero-shot). The prompt helps most on Neutral: recall 32% → 66%, F1 0.43 → 0.68.", options: { color: HEX.ink } },
  ], { x: 5.9, y: 3.75, w: 3.4, h: 0.95, fontSize: 12, valign: "top" });

  s.addNotes("[~45 s · 2:40–3:25]\nThat design work pays off: a well-chosen prompt adds about ten points of macro-F1, with zero training. What matters is where the gain comes from. Negative and Positive were already easy; almost all of the improvement is on Neutral. The examples show the model what a “middle” review looks like, which an instruction alone doesn't convey.\nBut the per-class scores show Neutral is still the weak point, and the error goes in one direction: Neutral reviews get pushed toward Negative, and rarely toward Positive. When I read those reviews, many are real complaints from customers who still gave three stars. So the question becomes: is the model wrong, or is the label?");
}

// ---------- Prompt design selection on validation (§9) ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Choosing the prompt: 8 designs on validation", { placeholder: "title" });

  // Two stacked series so only the winner is amber; zeros are hidden by the label format
  const cats = ["Zero-shot", "Zero-shot + definitions", "Few-shot k=1", "Few-shot k=2", "Few-shot k=3",
    "Few-shot k=5", "Few-shot k=7", "Few-shot k=5 + definitions"];
  const val = [0.680, 0.747, 0.761, 0.755, 0.777, 0.797, 0.760, 0.800];
  const best = 7;
  s.addChart(pres.charts.BAR, [
    { name: "Variant", labels: cats, values: val.map((v, i) => (i === best ? 0 : v)) },
    { name: "Best on validation", labels: cats, values: val.map((v, i) => (i === best ? v : 0)) },
  ], Object.assign({
    objectName: "variants-chart", x: 0.4, y: 1.15, w: 5.7, h: 3.25, barDir: "bar", barGrouping: "stacked",
    barGapWidthPct: 45, chartColors: [HEX.grey, HEX.amber], catAxisOrientation: "maxMin",
    showValue: true, dataLabelPosition: "inEnd", dataLabelFormatCode: "0.000;;;", dataLabelColor: HEX.paper,
    valAxisMinVal: 0.5, valAxisMaxVal: 0.85, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, showTitle: true, title: "Validation macro-F1 (600 reviews)", titleFontSize: 12, titleColor: HEX.ink,
  }, chartText, { dataLabelColor: HEX.paper }));

  // Final vs runner-up: a statistical tie
  card(s, "tie-card", 6.35, 1.2, 3.15, 2.05, "F8E0B8");
  T(s, "Final vs plain k = 5", { x: 6.55, y: 1.3, w: 2.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  T(s, "+0.003", { x: 6.55, y: 1.6, w: 2.8, h: 0.7, fontSize: 40, bold: true, color: C.accent1, fontFace: "Cambria" });
  T(s, [
    { text: "95% CI −0.007 to +0.013: a tie", options: { breakLine: true } },
    { text: "so the definitions are a tie-break" },
  ], { x: 6.55, y: 2.32, w: 2.8, h: 0.8, fontSize: 12, color: C.text2, valign: "top", paraSpaceAfter: 4 });

  card(s, "k-note", 6.35, 3.4, 3.15, 1.0);
  T(s, "More isn't always better: k = 7 drops to 0.760. Other random draws of the examples move F1 by up to 0.03.",
    { x: 6.55, y: 3.48, w: 2.8, h: 0.85, fontSize: 11, color: C.text2, valign: "middle" });

  card(s, "variants-takeaway", 0.5, 4.55, 9, 0.5, "F3D2C9");
  T(s, [
    { text: "Examples help most. ", options: { bold: true, color: HEX.neg } },
    { text: "Validation 0.800 → test 0.783: picking among 8 designs barely overfit.", options: { color: HEX.ink } },
  ], { x: 0.7, y: 4.55, w: 8.6, h: 0.5, fontSize: 12, valign: "middle" });

  s.addNotes("[~40 s · 3:25–4:05]\nBefore I answer that, a quick look at how I chose the prompt. Two lessons stand out. First, examples matter more than instructions: definitions help, but examples help more. Second, more isn't always better: going beyond five examples per class actually hurts, and which examples you pick matters almost as much as how many. That's a real weakness of prompting: results are sensitive to small choices.\nThe top two designs are a statistical tie, so I don't over-claim the value of the definitions. And the test score lands close to validation, so choosing among eight designs didn't overfit.");
}

// ---------- Slide 3: Experiment 2 ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Exp. 2: prompted model agrees with AI labels", { placeholder: "title" });
  T(s, "600 extra reviews labelled by Claude Haiku from the text only (stars hidden)",
    { x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 13, color: C.text2 });

  const stats = [
    ["0.879", "Few-shot Llama\nvs AI labels", HEX.amber, true],
    ["0.788", "Few-shot Llama\nvs star labels (same 600)", HEX.slate, false],
    ["0.746", "AI labels\nvs star labels", HEX.slate, false],
  ];
  stats.forEach(([n, l, col, main], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `stat-${i + 1}`, x, 1.6, 2.8, 2.0, main ? "F8E0B8" : C.background2);
    T(s, n, { x: x + 0.2, y: 1.75, w: 2.4, h: 0.95, fontSize: 48, bold: true, color: col, align: "center",
      valign: "middle", fontFace: "Cambria" });
    T(s, l, { x: x + 0.2, y: 2.75, w: 2.4, h: 0.65, fontSize: 13, color: C.text2, align: "center" });
  });
  T(s, "macro-F1", { x: 0.5, y: 3.65, w: 9, h: 0.25, fontSize: 10, italic: true, color: C.text2 });

  card(s, "insight", 0.5, 4.0, 9, 0.95);
  T(s, [
    { text: "Stars are a noisy label. ", options: { bold: true, color: HEX.ink } },
    { text: "Both models read many 3-star reviews as Negative, so part of the test \"error\" is label noise. 0.879 is agreement between two LLMs, not a ground-truth score.", options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.1, w: 8.5, h: 0.75, fontSize: 13, valign: "middle" });

  s.addNotes("[~45 s · 4:05–4:50]\nNow, back to that question. In Experiment 2, my few-shot model agrees much more with Claude's text-based labels than with the star ratings, and Claude disagrees with the stars in the same way. Two different models, reading only the text, reach the same conclusion: a three-star rating often hides a negative review.\nThe takeaway is that star ratings are a noisy proxy for sentiment, so part of what looks like model error is really label noise. One honest caveat: agreement between two language models is not ground truth. But it suggests our test scores may understate what these models can do.\nThat's my part. Next, my teammates will show how much training changes the picture.");
}


// =====================================================================================
// Slides 7–14, added for the team deck in the same style. Numbers come from deck_data.js,
// which reads the committed result files.
// =====================================================================================
const { f2, f3, NOTES } = D;
const CATS = ["Negative", "Neutral", "Positive", "Macro"];
const TINT = "F8E0B8", ROSE = "F3D2C9";

function steps3(s, steps) {
  steps.forEach(([h, d], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `step-${i + 1}`, x, 1.3, 2.8, 1.35);
    s.addShape(pres.shapes.OVAL, { objectName: `step-num-${i + 1}`, x: x + 0.2, y: 1.45, w: 0.45, h: 0.45,
      fill: { color: C.accent1 }, line: { type: "none" } });
    T(s, String(i + 1), { x: x + 0.2, y: 1.45, w: 0.45, h: 0.45, fontSize: 16, bold: true,
      color: C.background1, align: "center", valign: "middle" });
    T(s, h, { x: x + 0.8, y: 1.45, w: 1.9, h: 0.45, fontSize: 18, bold: true, color: C.text1, valign: "middle", fontFace: "Cambria" });
    T(s, d, { x: x + 0.2, y: 1.98, w: 2.5, h: 0.6, fontSize: 12, color: C.text2 });
    if (i < 2) s.addShape(pres.shapes.CHEVRON, { objectName: `arrow-${i + 1}`, x: x + 2.85, y: 1.83, w: 0.18, h: 0.25,
      fill: { color: C.accent5 }, line: { type: "none" } });
  });
}
function settings2(s, settings) {
  settings.forEach(([h, d, foot], i) => {
    const x = 0.5 + i * 4.65;
    card(s, `setting-${i + 1}`, x, 2.95, 4.35, 1.4, i === 1 ? TINT : C.background2);
    T(s, h, { x: x + 0.25, y: 3.07, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: C.text1 });
    T(s, d, { x: x + 0.25, y: 3.45, w: 3.9, h: 0.5, fontSize: 12, color: C.text2, valign: "top" });
    T(s, foot, { x: x + 0.25, y: 3.95, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: C.accent2, valign: "top" });
  });
}
// per-class precision / recall / F1 of one results row, Neutral (the hard class) picked out
function prfTable(s, r, title, hotCols = ["f1"]) {
  T(s, title, { x: 5.7, y: 1.2, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.slate, fill: { color: HEX.paper }, align: "center" } });
  const rows = [["Class", "Precision", "Recall", "F1"].map(hdr)];
  ["Negative", "Neutral", "Positive"].forEach((l) => rows.push([hdr(l), ...["precision", "recall", "f1"].map((m) => {
    const hot = l === "Neutral" && hotCols.includes(m);
    return { text: Number(r[`${l}_${m}`]).toFixed(2), options: { align: "center", bold: hot, color: hot ? HEX.paper : HEX.ink, fill: { color: hot ? HEX.neg : HEX.mist } } };
  })]));
  s.addTable(rows, { objectName: "prf-table", x: 5.7, y: 1.6, w: 3.8, colW: [1.1, 1.0, 0.85, 0.85],
    rowH: 0.42, fontSize: 12, fontFace: "Calibri", border: { type: "solid", pt: 2, color: HEX.paper }, valign: "middle" });
}
// left: F1 chart of two settings; right: per-class scores and a takeaway card
function resultSlide(s, series, r, tableTitle, headline, detail, hotCols) {
  s.addChart(pres.charts.BAR, series.map(([name, row]) => ({ name, labels: CATS, values: D.f1s(row) })), Object.assign({
    objectName: "f1-chart", x: 0.4, y: 1.15, w: 5.0, h: 3.85, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.grey, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00",
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", showTitle: true, title: "F1 per class (n = 5,000)", titleFontSize: 12, titleColor: HEX.ink,
  }, chartText));
  prfTable(s, r, tableTitle, hotCols);
  card(s, "takeaway", 5.7, 3.65, 3.8, 1.15, ROSE);
  T(s, [
    { text: headline, options: { bold: true, color: HEX.neg, breakLine: true } },
    { text: detail, options: { color: HEX.ink } },
  ], { x: 5.9, y: 3.75, w: 3.4, h: 0.95, fontSize: 12, valign: "top" });
}

// Longqi's BERT slides are not in yet: they go here, after Dinh's Exp. 2 slide.

// ---------- Llama + QLoRA (JN) ----------
pres.addSection({ title: "Llama + QLoRA" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Llama + QLoRA" });
  s.addText("Llama 3.1 8B + QLoRA, 0.5% of weights trained", { placeholder: "title" });
  steps3(s, [
    ["Freeze", "Llama-3.1-8B-Instruct in 4-bit\n8.07 B weights, not trained"],
    ["Adapt", "LoRA adapters, rank 16\n41.9 M trainable weights (0.52%)"],
    ["Train", "Target is the label only\n1 epoch over 40,000 reviews"],
  ]);
  settings2(s, [
    ["Same prompt as zero-shot", "No definitions, no examples:\nthe only change is the fine-tuning", `${D.tok(D.zc)} tokens / prompt`],
    ["Training", "Learning rate 2e-4, batch size 16\nsame label-extraction rule as prompting", `${Math.round(D.cost.training_minutes)} min on one A100 GPU`],
  ]);
  T(s, "Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1",
    { x: 0.5, y: 4.6, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.text2 });
  s.addNotes(NOTES.qloraMethod);
}
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Llama + QLoRA" });
  s.addText(`Training: ${Math.round(D.cost.training_minutes)} minutes on one A100 GPU`, { placeholder: "title" });
  const steps = D.lossCurve.map((p) => p.step.toLocaleString("en-US"));
  s.addChart(pres.charts.LINE, [
    { name: "Training loss (mean of the last 500 steps)", labels: steps, values: D.lossCurve.map((p) => p.train) },
    { name: "Validation loss (600 reviews)", labels: steps, values: D.lossCurve.map((p) => p.val) },
  ], Object.assign({
    objectName: "loss-chart", x: 0.4, y: 1.15, w: 5.0, h: 3.85, chartColors: [HEX.grey, HEX.amber], lineSize: 3, lineDataSymbolSize: 8,
    showValue: true, dataLabelPosition: "t", dataLabelFormatCode: "0.00", valAxisMinVal: 0.15, valAxisMaxVal: 0.3, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: true, legendPos: "t",
    showTitle: true, title: "Loss on the label, by training step", titleFontSize: 12, titleColor: HEX.ink,
  }, chartText));
  T(s, "Training setup and cost", { x: 5.7, y: 1.2, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  s.addTable(D.setup.map(([k, v, hot]) => [
    { text: k, options: { bold: true, color: hot ? HEX.paper : HEX.slate, fill: { color: hot ? HEX.amber : HEX.mist } } },
    { text: v, options: { bold: hot, color: HEX.ink, fill: { color: hot ? TINT : HEX.mist } } },
  ]), { objectName: "setup-table", x: 5.7, y: 1.55, w: 3.8, colW: [1.5, 2.3], rowH: 0.4, fontSize: 11.5, fontFace: "Calibri",
    border: { type: "solid", pt: 2, color: HEX.paper }, valign: "middle" });
  card(s, "train-takeaway", 5.7, 4.1, 3.8, 0.75, ROSE);
  T(s, [
    { text: `Validation loss ${f2(D.lossCurve[0].val)} → ${f2(D.lossCurve[D.lossCurve.length - 1].val)}: `, options: { bold: true, color: HEX.neg } },
    { text: "no sign of overfitting. Test set used once, after training.", options: { color: HEX.ink } },
  ], { x: 5.9, y: 4.15, w: 3.4, h: 0.65, fontSize: 12, valign: "middle" });
  s.addNotes(NOTES.qloraTrain);
}
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Llama + QLoRA" });
  s.addText(`QLoRA lifts test macro-F1: ${f2(D.few.macro_f1)} → ${f2(D.qlora.macro_f1)}`, { placeholder: "title" });
  resultSlide(s, [["Best prompt (k=5 + definitions)", D.few], ["QLoRA", D.qlora]], D.qlora, "QLoRA: per-class scores (test set)",
    `Neutral F1 ${f2(D.few.Neutral_f1)} → ${f2(D.qlora.Neutral_f1)}`,
    `Neutral recall ${D.pct(D.few.Neutral_recall)}% → ${D.pct(D.qlora.Neutral_recall)}%. Better on all three classes; all 5,000 outputs are a bare label.`, ["recall", "f1"]);
  s.addNotes(NOTES.qloraRes);
}
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Llama + QLoRA" });
  s.addText("Exp. 2: QLoRA on the AI-labelled reviews", { placeholder: "title" });
  T(s, "The fine-tuned model on the same 600 reviews labelled by Claude Haiku (stars hidden)", { x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 13, color: C.text2 });
  const stats = [
    [f3(D.qAI.macro_f1), "QLoRA\nvs AI labels", HEX.amber, true],
    [f3(D.qStar.macro_f1), "QLoRA\nvs star labels (same 600)", HEX.slate, false],
    [f3(D.fewAI.macro_f1), "Best prompt\nvs AI labels", HEX.slate, false],
  ];
  stats.forEach(([n, l, col, main], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `stat-${i + 1}`, x, 1.6, 2.8, 2.0, main ? TINT : C.background2);
    T(s, n, { x: x + 0.2, y: 1.75, w: 2.4, h: 0.95, fontSize: 48, bold: true, color: col, align: "center", valign: "middle", fontFace: "Cambria" });
    T(s, l, { x: x + 0.2, y: 2.75, w: 2.4, h: 0.65, fontSize: 13, color: C.text2, align: "center" });
  });
  T(s, "macro-F1", { x: 0.5, y: 3.65, w: 9, h: 0.25, fontSize: 10, italic: true, color: C.text2 });
  card(s, "insight", 0.5, 4.0, 9, 0.95);
  T(s, [
    { text: "QLoRA agrees equally with both label sets. ", options: { bold: true, color: HEX.ink } },
    { text: `Against Claude's labels its Negative precision is ${f2(D.qAI.Negative_precision)} but recall only ${f2(D.qAI.Negative_recall)}: 3-star reviews that Claude reads as Negative, it calls Neutral, as the stars do.`, options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.1, w: 8.5, h: 0.75, fontSize: 13, valign: "middle" });
  s.addNotes(NOTES.qloraExp2);
}

// ---------- Comparison and conclusions (JN) ----------
pres.addSection({ title: "Comparison" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Three methods on the same test set", { placeholder: "title" });
  const cell = (t, o) => ({ text: t, options: Object.assign({ align: "center", color: HEX.ink, fill: { color: HEX.mist } }, o) });
  const hd = (t, i) => cell(t, { bold: true, color: HEX.paper, fill: { color: HEX.slate }, align: i ? "center" : "left" });
  const hot = { bold: true, fill: { color: HEX.amber } };
  const row = (name, r, train, sec, o = {}) => [cell(name, { align: "left", bold: true }), cell(f3(r.macro_f1), o.f1), cell(f3(r.Neutral_f1), o.neu), cell(train), cell(sec, o.sec)];
  s.addTable([
    ["Method", "Macro-F1", "Neutral F1", "Training", "s / review"].map(hd),
    row("Fine-tuned BERT", D.bert, Math.round(D.bcost.training_minutes) + " min", f3(D.bcost.sec_per_review) + " (L4)", { sec: hot }),
    row("Llama, zero-shot", D.zero, "none", f3(D.zc.sec_per_review) + " (L4)"),
    row("Llama, best prompt", D.few, "none", f3(D.fc.sec_per_review) + " (L4)"),
    row("Llama + QLoRA", D.qlora, Math.round(D.cost.training_minutes) + " min", f3(D.cost.sec_per_review) + " (A100)", { f1: hot, neu: hot }),
  ], { objectName: "compare-table", x: 0.5, y: 1.25, w: 9, colW: [2.9, 1.45, 1.5, 1.4, 1.75], rowH: 0.48, fontSize: 14, fontFace: "Calibri",
    border: { type: "solid", pt: 2, color: HEX.paper }, valign: "middle" });
  card(s, "compare-takeaway", 0.5, 3.95, 9, 0.85, ROSE);
  T(s, [
    { text: "QLoRA is best; BERT and the best prompt tie. ", options: { bold: true, color: HEX.neg } },
    { text: `QLoRA leads both by 0.055 macro-F1 (95% CI 0.045 to 0.065). BERT is the cheapest to train and run; the prompt needs no training but is the slowest.`, options: { color: HEX.ink } },
  ], { x: 0.7, y: 4.0, w: 8.6, h: 0.75, fontSize: 12, valign: "middle" });
  T(s, "QLoRA was timed on a different GPU, so its speed is not directly comparable.",
    { x: 0.5, y: 4.85, w: 9, h: 0.25, fontSize: 10, italic: true, color: C.text2 });
  s.addNotes(NOTES.table);
}
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Exp. 2: fine-tuned models follow the star labels", { placeholder: "title" });
  const cats = ["vs AI labels", "vs star labels (same 600)"];
  s.addChart(pres.charts.BAR, [
    { name: "Fine-tuned BERT", labels: cats, values: [+D.bAI.macro_f1, +D.bStar.macro_f1] },
    { name: "Best prompt", labels: cats, values: [+D.fewAI.macro_f1, +D.fewStar.macro_f1] },
    { name: "QLoRA", labels: cats, values: [+D.qAI.macro_f1, +D.qStar.macro_f1] },
  ], Object.assign({
    objectName: "exp2-chart", x: 0.4, y: 1.15, w: 5.4, h: 3.85, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.grey, HEX.teal, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00",
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", showTitle: true, title: "Macro-F1 on the 600 Experiment 2 reviews", titleFontSize: 12, titleColor: HEX.ink,
  }, chartText));
  card(s, "exp2-flip", 6.1, 1.2, 3.4, 1.55, TINT);
  T(s, "The ranking flips", { x: 6.3, y: 1.3, w: 3.0, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  T(s, `Against Claude's labels the prompted model is first (${f2(D.fewAI.macro_f1)}). Against the stars of the same reviews, QLoRA is first (${f2(D.qStar.macro_f1)}).`,
    { x: 6.3, y: 1.62, w: 3.0, h: 1.05, fontSize: 12, color: C.text2, valign: "top" });
  card(s, "exp2-why", 6.1, 2.95, 3.4, 1.85, ROSE);
  T(s, [
    { text: "Training on stars teaches the star convention", options: { bold: true, color: HEX.neg, breakLine: true } },
    { text: `QLoRA scores ${f2(D.qAI.macro_f1)} on both label sets. The prompted model reads the text as Claude does: many 3-star reviews look Negative.`, options: { color: HEX.ink } },
  ], { x: 6.3, y: 3.05, w: 3.0, h: 1.65, fontSize: 12, valign: "top" });
  s.addNotes(NOTES.exp2);
}
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Conclusions", { placeholder: "title" });
  T(s, "How much does training buy you?", { x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 13, color: C.text2 });
  const stats = [
    [f3(D.qlora.macro_f1), "Llama + QLoRA\n0.5% of weights trained", HEX.amber, true],
    [f3(D.bert.macro_f1), "Fine-tuned BERT\nabout " + D.bertFaster + "× faster than the prompt", HEX.slate, false],
    [f3(D.few.macro_f1), "Best prompt\nno training at all", HEX.slate, false],
  ];
  stats.forEach(([n, l, col, main], i) => {
    const x = 0.5 + i * 3.1;
    card(s, `stat-${i + 1}`, x, 1.6, 2.8, 2.0, main ? TINT : C.background2);
    T(s, n, { x: x + 0.2, y: 1.75, w: 2.4, h: 0.95, fontSize: 48, bold: true, color: col, align: "center", valign: "middle", fontFace: "Cambria" });
    T(s, l, { x: x + 0.2, y: 2.75, w: 2.4, h: 0.65, fontSize: 13, color: C.text2, align: "center" });
  });
  T(s, "test macro-F1", { x: 0.5, y: 3.65, w: 9, h: 0.25, fontSize: 10, italic: true, color: C.text2 });
  card(s, "insight", 0.5, 4.0, 9, 0.95);
  T(s, [
    { text: "Neutral is the hardest class for every method ", options: { bold: true, color: HEX.ink } },
    { text: `(F1 ${f2(Math.min(...D.neuF1))} to ${f2(Math.max(...D.neuF1))}), mostly confused with Negative. Part of that is label noise: Claude agrees with the star labels at only 0.75 macro-F1.`, options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.1, w: 8.5, h: 0.75, fontSize: 13, valign: "middle" });
  s.addNotes(NOTES.end);
}
pres.addSection({ title: "References" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "References" });
  s.addText("References", { placeholder: "title" });
  const refs = [
    "[1] Y. Hou, J. Li, Z. He, A. Yan, X. Chen, and J. McAuley, \"Bridging language and items for retrieval and recommendation,\" arXiv:2403.03952, 2024. (Amazon Reviews 2023)",
    "[2] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in Proc. NAACL-HLT, 2019.",
    "[3] A. Grattafiori et al., \"The Llama 3 herd of models,\" arXiv:2407.21783, 2024. Model: meta-llama/Llama-3.1-8B-Instruct.",
    "[4] T. Dettmers, A. Pagnoni, A. Holtzman, and L. Zettlemoyer, \"QLoRA: Efficient finetuning of quantized LLMs,\" in Proc. NeurIPS, 2023.",
    "[5] E. J. Hu et al., \"LoRA: Low-rank adaptation of large language models,\" in Proc. ICLR, 2022.",
  ];
  T(s, refs.map((t, i) => ({ text: t, options: { breakLine: i < refs.length - 1 } })),
    { x: 0.5, y: 1.2, w: 9, h: 3.7, fontSize: 12, color: C.text1, valign: "top", paraSpaceAfter: 8 });
  s.addNotes("Not presented. Backup for questions.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();

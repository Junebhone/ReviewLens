const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("./apply_theme.js");

const OUT = process.argv[2] || path.join(__dirname, "Dinh_ReviewLens_Slides.pptx");

// Palette: charcoal dominant, amber accent (Neutral is the story), sentiment colors for data.
const HEX = {
  ink: "232A34", paper: "FFFFFF", slate: "3C4A5C", mist: "EEF1F4",
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
pres.title = "ReviewLens — Intro, Data and Prompted Llama 3.1 8B";
pres.author = "Quoc Cuong Dinh";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Content",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75,
      fontSize: 28, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "ReviewLens · Quoc Cuong Dinh",
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
  s.addText("ReviewLens: sorting product reviews by sentiment", { placeholder: "title" });
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
    card(s, `method-${i + 1}`, 5.2, y, 4.3, 0.54, i === 1 ? "FDF3E3" : C.background2);
    s.addShape(pres.shapes.OVAL, { objectName: `method-num-${i + 1}`, x: 5.32, y: y + 0.11, w: 0.32, h: 0.32,
      fill: { color: i === 1 ? C.accent1 : C.accent5 }, line: { type: "none" } });
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
    { text: "(the mean of the three per-class F1 scores, so Neutral counts as much as the easy classes). Also reported: accuracy, per-class precision / recall / F1, confusion matrices.", options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.15, w: 8.5, h: 0.65, fontSize: 12, valign: "middle" });

  s.addNotes("[~30 s · 0:00–0:30]\nHi, I'm Quoc. Our project is ReviewLens. Sellers get thousands of reviews, and we want to sort each one into Negative, Neutral or Positive so the unhappy customers can be found quickly. We solved this one task with three methods on exactly the same data: Longqi fine-tuned BERT, I prompted Llama 3.1 8B with no training, and Bhone fine-tuned the same Llama with QLoRA. Our main metric is macro-F1, so the Neutral class counts as much as the other two. Keep this example in mind: it's a 3-star review, but it reads like a complaint.");
}

// ---------- Data ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Introduction" });
  s.addText("Data: one shared, balanced split", { placeholder: "title" });

  const funnel = [
    ["20.8 M", "Cell Phones & Accessories reviews, Amazon Reviews 2023"],
    ["1.11 M", "100–300 words, duplicates dropped; links, @, #, emojis removed"],
    ["50,000", "balanced sample:\n16,667 / 16,667 / 16,666"],
    ["40k/5k/5k", "stratified train / val / test, used by all three methods"],
  ];
  funnel.forEach(([n, d], i) => {
    const x = 0.5 + i * 2.3;
    card(s, `funnel-${i + 1}`, x, 1.2, 2.1, 1.3, i === 3 ? "FDF3E3" : C.background2);
    T(s, n, { x: x + 0.15, y: 1.3, w: 1.8, h: 0.5, fontSize: 24, bold: true, fontFace: "Cambria",
      color: i === 3 ? C.accent1 : C.accent2 });
    T(s, d, { x: x + 0.15, y: 1.82, w: 1.8, h: 0.62, fontSize: 10.5, color: C.text2, valign: "top" });
    if (i < 3) s.addShape(pres.shapes.CHEVRON, { objectName: `funnel-arrow-${i + 1}`, x: x + 2.13, y: 1.72,
      w: 0.14, h: 0.25, fill: { color: C.accent5 }, line: { type: "none" } });
  });

  // Star rating -> label
  card(s, "labels", 0.5, 2.75, 4.35, 1.8);
  T(s, "Gold label = star rating", { x: 0.7, y: 2.85, w: 4.0, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
  [["1–2 ★\nNegative", HEX.neg], ["3 ★\nNeutral", HEX.amber], ["4–5 ★\nPositive", HEX.pos]].forEach(([t, col], i) =>
    chip(s, `stars-${i + 1}`, 0.7 + i * 1.35, 3.3, 1.2, 0.65, t, col));
  T(s, "Neutral is the scarcest: 131k eligible vs 243k Negative and 737k Positive, hence the balanced sample.",
    { x: 0.7, y: 4.02, w: 4.0, h: 0.45, fontSize: 10.5, color: C.text2, valign: "top" });

  // Experiment 2
  card(s, "exp2", 5.15, 2.75, 4.35, 1.8, "FDF3E3");
  T(s, "Experiment 2: AI-labelled reviews", { x: 5.35, y: 2.85, w: 4.0, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
  T(s, [
    { text: "600 extra reviews (200 per star class), not in the 50k", options: { bullet: { indent: 12 }, breakLine: true } },
    { text: "Claude Haiku labels them from the text only, stars hidden", options: { bullet: { indent: 12 }, breakLine: true } },
    { text: "Every method is also scored against these labels", options: { bullet: { indent: 12 } } },
  ], { x: 5.35, y: 3.22, w: 4.0, h: 0.85, fontSize: 11.5, color: C.text1, valign: "top", paraSpaceAfter: 2 });
  T(s, "Claude's labels: 260 Neg · 169 Neu · 171 Pos", { x: 5.35, y: 4.12, w: 4.0, h: 0.3, fontSize: 11.5, bold: true, color: C.accent2 });

  T(s, "Source: Amazon Reviews 2023, McAuley Lab (UCSD) · split seed 42",
    { x: 0.5, y: 4.7, w: 9, h: 0.3, fontSize: 10, italic: true, color: C.text2 });

  s.addNotes("[~40 s · 0:30–1:10]\nAll three of us use the same data. We start from 20.8 million Cell Phones and Accessories reviews in Amazon Reviews 2023, keep the ones with 100 to 300 words, drop duplicates and clean out links, mentions and emojis, which leaves about 1.1 million. The label comes from the stars: 1–2 is Negative, 3 is Neutral, 4–5 is Positive. Neutral is the rarest class, so we sample 50,000 reviews balanced across the three classes and split them 80/10/10. For Experiment 2, I took 600 extra reviews and had Claude Haiku label them from the text alone, without the stars. Every model is also tested against those labels, so we can see how much of the error is really label noise.");
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
    card(s, `setting-${i + 1}`, x, 2.95, 4.35, 1.4, i === 1 ? "FDF3E3" : C.background2);
    T(s, h, { x: x + 0.25, y: 3.07, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: C.text1 });
    T(s, d, { x: x + 0.25, y: 3.45, w: 3.9, h: 0.5, fontSize: 12, color: C.text2, valign: "top" });
    T(s, tok, { x: x + 0.25, y: 3.95, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: C.accent2, valign: "top" });
  });
  T(s, "Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1",
    { x: 0.5, y: 4.6, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.text2 });

  s.addNotes("[~30 s · 1:10–1:40]\nMy part is the method with no training at all. I just prompt Llama 3.1 8B Instruct. Each review goes into a prompt, the model answers with greedy decoding, and I pull the label out of the answer. I tried eight prompt designs on the validation set: zero-shot or with examples, and with or without a one-line definition of each label. The winner uses five examples per class plus the definitions. I compare it against plain zero-shot as the baseline. Like everyone else, I report macro-F1 on the same 5,000 test reviews.");
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

  // Confusion matrix, row-normalised %
  T(s, "Final design confusion matrix (% of each true class)", { x: 5.7, y: 1.2, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  const cm = [[84.6, 14.6, 0.7], [29.3, 66.3, 4.3], [0.9, 15.5, 83.6]];
  const names = ["Neg", "Neu", "Pos"];
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.slate, fill: { color: HEX.paper }, align: "center" } });
  const rows = [[hdr("True \\ Pred"), hdr("Neg"), hdr("Neu"), hdr("Pos")]];
  cm.forEach((r, i) => {
    rows.push([hdr(names[i]), ...r.map((v, j) => {
      const hot = i === 1 && j === 0;
      const diag = i === j;
      return { text: v.toFixed(1) + "%", options: { align: "center", bold: hot || diag,
        color: hot || diag ? HEX.paper : HEX.ink,
        fill: { color: hot ? HEX.neg : diag ? HEX.teal : HEX.mist } } };
    })]);
  });
  s.addTable(rows, { objectName: "cm-table", x: 5.7, y: 1.6, w: 3.8, colW: [1.25, 0.85, 0.85, 0.85],
    rowH: 0.42, fontSize: 12, fontFace: "Calibri", border: { type: "solid", pt: 2, color: HEX.paper }, valign: "middle" });

  card(s, "takeaway", 5.7, 3.65, 3.8, 1.15, "FBEAE6");
  T(s, [
    { text: "29% of Neutral reviews → Negative", options: { bold: true, color: HEX.neg, breakLine: true } },
    { text: "Still the main error (62% zero-shot). The prompt helps most on Neutral: recall 32% → 66%, F1 0.43 → 0.68.", options: { color: HEX.ink } },
  ], { x: 5.9, y: 3.75, w: 3.4, h: 0.95, fontSize: 12, valign: "top" });

  s.addNotes("[~40 s · 1:40–2:20]\nSo, the better prompt really helps. Macro-F1 goes from 0.68 zero-shot to 0.78. Negative and Positive were already good, so most of the gain is on Neutral, where F1 goes from 0.43 to 0.68. But Neutral is still the weak spot. In the confusion matrix, 29% of the 3-star reviews are still predicted Negative, down from 62% zero-shot. When I read some of them, a lot of these 3-star reviews are basically complaints, so honestly the star label is debatable.");
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
  card(s, "tie-card", 6.35, 1.2, 3.15, 2.05, "FDF3E3");
  T(s, "Final vs plain k = 5", { x: 6.55, y: 1.3, w: 2.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  T(s, "+0.003", { x: 6.55, y: 1.6, w: 2.8, h: 0.7, fontSize: 40, bold: true, color: C.accent1, fontFace: "Cambria" });
  T(s, [
    { text: "95% CI −0.007 to +0.013: a tie", options: { breakLine: true } },
    { text: "so the definitions are a tie-break" },
  ], { x: 6.55, y: 2.32, w: 2.8, h: 0.8, fontSize: 12, color: C.text2, valign: "top", paraSpaceAfter: 4 });

  card(s, "k-note", 6.35, 3.4, 3.15, 1.0);
  T(s, "More isn't always better: k = 7 drops to 0.760. Other random draws of the examples move F1 by up to 0.03.",
    { x: 6.55, y: 3.48, w: 2.8, h: 0.85, fontSize: 11, color: C.text2, valign: "middle" });

  card(s, "variants-takeaway", 0.5, 4.55, 9, 0.5, "FBEAE6");
  T(s, [
    { text: "Examples help most. ", options: { bold: true, color: HEX.neg } },
    { text: "Validation 0.800 → test 0.783: picking among 8 designs barely overfit.", options: { color: HEX.ink } },
  ], { x: 0.7, y: 4.55, w: 8.6, h: 0.5, fontSize: 12, valign: "middle" });

  s.addNotes("[~30 s · 2:20–2:50]\nWhere did that prompt come from? I scored eight designs on 600 validation reviews. Definitions help a lot without examples, from 0.68 to 0.75, and examples help even more. But more isn't always better: seven examples per class drops back to 0.76, and which examples you draw matters too. The top two, five examples with and without definitions, are a statistical tie, so the definitions were really a tie-break. And validation 0.80 versus test 0.78 means picking among eight designs didn't overfit much.");
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
    card(s, `stat-${i + 1}`, x, 1.6, 2.8, 2.0, main ? "FDF3E3" : C.background2);
    T(s, n, { x: x + 0.2, y: 1.75, w: 2.4, h: 0.95, fontSize: 48, bold: true, color: col, align: "center",
      valign: "middle", fontFace: "Cambria" });
    T(s, l, { x: x + 0.2, y: 2.75, w: 2.4, h: 0.65, fontSize: 13, color: C.text2, align: "center" });
  });
  T(s, "macro-F1", { x: 0.5, y: 3.65, w: 9, h: 0.25, fontSize: 10, italic: true, color: C.text2 });

  card(s, "insight", 0.5, 4.0, 9, 0.95);
  T(s, [
    { text: "Stars are a noisy label. ", options: { bold: true, color: HEX.ink } },
    { text: "Both models read many 3-star reviews as Negative, so part of the test \"error\" is label noise. 0.879 is agreement between two LLMs, not accuracy.", options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.1, w: 8.5, h: 0.75, fontSize: 13, valign: "middle" });

  s.addNotes("[~35 s · 2:50–3:25]\nBack to the star labels: that's why I ran Experiment 2. I had Claude Haiku label 600 new reviews from the text only, without the stars. Against those AI labels, my few-shot model gets 0.879, compared to 0.788 against the stars for the same reviews. And Claude itself only agrees with the stars at 0.746. So two models reading the text disagree with the stars in the same way, which tells us the star rating is partly noise. One caution: that 0.879 is two language models agreeing with each other, not accuracy against the truth. That's my part; next, my teammates present their methods and the comparison.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();

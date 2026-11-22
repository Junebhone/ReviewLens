// Builds ReviewLens_Presentation.pptx from the result CSVs in this repo.
// Run:  npm install pptxgenjs jszip && node build_deck.js [path/to/apply_theme.js]
// Rebuilding overwrites the .pptx, so hand edits made in PowerPoint are lost: edit here or there, not both.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "ReviewLens_Presentation.pptx");

// ---------- data, read from the committed result files ----------
function csv(rel) {
  const [head, ...rows] = fs.readFileSync(path.join(ROOT, rel), "utf8").trim().split("\n").map((l) => l.split(","));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const byName = (rows) => Object.fromEntries(rows.map((r) => [r.setting, r]));
const Q = byName(csv("quoc_llama_prompting/results/results_summary.csv"));
const J = byName(csv("jn_llama_qlora/results/results_summary.csv"));
const zero = Q["Test — zero-shot"], few = Q["Test — few-shot (k=3/class)"], qlora = J["QLoRA — test"];
const fewAI = Q["Exp2 — few_shot vs AI labels"], fewStar = Q["Exp2 — few_shot vs star labels (same 600)"];
const qAI = J["QLoRA — Exp2 vs AI labels"], qStar = J["QLoRA — Exp2 vs star labels (same 600)"];
for (const r of [zero, few, qlora, fewAI, fewStar, qAI, qStar]) if (!r) throw new Error("a results row is missing");
const n = (r, k) => Number(r[k]);
const f2 = (x) => Number(x).toFixed(2);
const f3 = (x) => Number(x).toFixed(3);
const LABELS = ["Negative", "Neutral", "Positive"];
const f1s = (r) => [...LABELS.map((l) => n(r, l + "_f1")), n(r, "macro_f1")];
// confusion matrix as row percentages (course guideline: percentages, not counts)
function cmPct(rel) {
  return csv(rel).map((r) => {
    const v = LABELS.map((l) => Number(r[l]));
    const tot = v.reduce((a, b) => a + b, 0);
    return v.map((x) => Math.round((100 * x) / tot));
  });
}
const cmFew = cmPct("quoc_llama_prompting/results/cm_test_few_shot.csv");
const cmQ = cmPct("jn_llama_qlora/results/cm_test.csv");
const cost = csv("jn_llama_qlora/results/inference_cost.csv")[0];
const qcost = csv("quoc_llama_prompting/results/inference_cost.csv");

// ---------- theme and layouts ----------
const THEME = {
  name: "ReviewLens",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "2D2D2D", lt1: "FFFFFF", dk2: "1F4E79", lt2: "F2F5F9",
    accent1: "2E75B6", accent2: "C55A11", accent3: "777777", accent4: "BFBFBF",
    accent5: "EBF3FA", accent6: "FFF2CC", hlink: "2E75B6", folHlink: "1F4E79",
  },
};
const T = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "ReviewLens: fine-tune or prompt?";
pres.author = "Bhone Kyaw Si Hein, Quoc Cuong Dinh, Longqi Sun";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Title",
  background: { color: T.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.2, w: 8.6, h: 1.9, fontSize: 32, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 3.35, w: 8.6, h: 1.4, fontSize: 16, color: C.accent5, align: "left", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Content",
  background: { color: T.lt1 },
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontSize: 11, color: C.accent3, align: "right" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.95, fontSize: 26, bold: true, color: C.text2, align: "left", valign: "top", margin: 0 }, text: "" } },
  ],
});

// ---------- helpers ----------
let section = "";
function slide(title, notes) {
  const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  s.addNotes(notes);
  return s;
}
const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, color: C.text1, fontSize: 18, valign: "top", ...o });
const source = (s, t) => text(s, t, { x: 0.5, y: 5.15, w: 8.3, h: 0.3, fontSize: 12, color: C.accent3 });
function box(s, o, fill, line) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { rectRadius: 0.08, fill: { color: fill }, line: line || { color: fill, width: 0 }, ...o });
}
// a filled card with centred lines of text
function card(s, x, y, w, h, runs, fill, line) {
  box(s, { x, y, w, h }, fill, line);
  s.addText(runs, { isTextBox: true, x: x + 0.12, y, w: w - 0.24, h, margin: 0, align: "center", valign: "middle" });
}
const run = (t, o, last) => ({ text: t, options: { breakLine: !last, color: C.text1, ...o } });
function bullets(s, items, o) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { isTextBox: true, margin: 0, fontSize: 18, color: C.text1, valign: "top", paraSpaceAfter: 12, ...o });
}
function callout(s, t, x, y, w) {
  card(s, x, y, w, 0.5, [run(t, { fontSize: 16, bold: true, color: C.text1 }, true)], C.accent6, { color: T.accent2, width: 1 });
}
function todo(s, t, x, y, w, h) {
  box(s, { x, y, w, h }, C.accent6, { color: T.accent2, width: 1.5, dashType: "dash" });
  s.addText(t, { isTextBox: true, x: x + 0.2, y, w: w - 0.4, h, margin: 0, fontSize: 18, color: C.text1, valign: "middle" });
}
function barChart(s, cats, series, colors, o) {
  s.addChart(pres.charts.BAR, series.map((d) => ({ name: d.name, labels: cats, values: d.values })), {
    barDir: "col", barGrouping: "clustered", barGapWidthPct: 60, chartColors: colors,
    showLegend: true, legendPos: "b", legendFontSize: 14, legendFontFace: "+mn-lt", legendColor: T.dk1,
    showValue: true, dataLabelFormatCode: "0.00", dataLabelFontSize: 14, dataLabelColor: T.dk1, dataLabelFontFace: "+mn-lt", dataLabelPosition: "outEnd",
    catAxisLabelFontSize: 16, catAxisLabelColor: T.dk1, catAxisLabelFontFace: "+mn-lt",
    valAxisLabelFontSize: 12, valAxisLabelColor: T.accent3, valAxisLabelFontFace: "+mn-lt", valAxisLabelFormatCode: "0.0",
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisMajorUnit: 0.2,
    valGridLine: { color: "E2E8F0", size: 0.5 }, catGridLine: { style: "none" },
    ...o,
  });
}
const GREY = T.accent4, BLUE = T.accent1, NAVY = T.dk2;

// ================= slides =================
section = "Introduction";
pres.addSection({ title: section });
{
  const s = pres.addSlide({ masterName: "Title", sectionTitle: section });
  s.addText("Fine-tune or prompt? Three ways to classify the sentiment of product reviews", { placeholder: "title" });
  s.addText([
    { text: "ReviewLens  ·  EDS 6352 Natural Language Processing  ·  Final project, Fall 2026", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "Bhone Kyaw Si Hein  ·  Quoc Cuong Dinh  ·  Longqi Sun", options: { bold: true, color: C.background1 } },
  ], { placeholder: "body" });
  s.addNotes("Setup slide, no talking time. 13 minutes total: aim for about one minute per slide.");
}
{
  const s = slide("Sellers need unhappy customers found fast: which model classifies review sentiment best?",
    "SPEAKER: Longqi (suggested). ~50 s.\nSellers get thousands of reviews; finding the negative ones by hand is slow. We classify each review as Negative, Neutral or Positive from its text alone, and compare three methods on exactly the same data. The three differ in how much of the model is trained: all of it, none of it, or half a percent of it.");
  const cards = [
    ["Fine-tuned BERT", "110 M weights", "all trained", "Longqi Sun"],
    ["Prompted Llama 3.1 8B", "8 B weights", "none trained", "Quoc Cuong Dinh"],
    ["Llama 3.1 8B + QLoRA", "8 B weights", "0.5% trained", "Bhone Kyaw Si Hein"],
  ];
  cards.forEach(([name, a, b, who], i) => {
    card(s, 0.5 + i * 3.1, 1.5, 2.8, 2.05, [
      run(name, { fontSize: 17, bold: true, color: C.text2 }),
      run(a, { fontSize: 18 }),
      run(b, { fontSize: 18, bold: true }),
      run(who, { fontSize: 14, color: C.accent3 }, true),
    ], C.accent5);
  });
  card(s, 0.5, 3.9, 9.0, 0.85, [run("Same 50,000 reviews, same test set, same metrics", { fontSize: 20, bold: true, color: C.background1 }, true)], C.text2);
  source(s, "Models: BERT [2], Llama 3.1 [3], QLoRA [4]");
}
{
  const s = slide("A balanced 50,000-review sample is drawn from 20.8 million Amazon reviews",
    "SPEAKER: Longqi (suggested). ~55 s.\nAmazon Reviews 2023, Cell Phones and Accessories only. We remove HTML, links, mentions, hash signs and emojis, keep reviews of 100 to 300 words, and drop duplicates. Eligible reviews are heavily skewed to Positive (737 thousand Positive, 243 thousand Negative, 131 thousand Neutral), so we sample one third per class. Labels come from stars. Split is stratified 80/10/10 and shared by all three methods.");
  const steps = [["20.8 M", "Cell Phones & Accessories reviews"], ["1.12 M", "100–300 words after cleaning"], ["1.11 M", "duplicates removed"], ["50,000", "balanced, one third per class"]];
  steps.forEach(([big, small], i) => {
    const last = i === steps.length - 1, x = 0.5 + i * 2.35;
    card(s, x, 1.5, 1.95, 1.6, [
      run(big, { fontSize: 28, bold: true, color: last ? C.background1 : C.text2 }),
      run(small, { fontSize: 14, color: last ? C.background1 : C.text1 }, true),
    ], last ? C.text2 : C.accent5);
    if (!last) text(s, "→", { x: x + 1.95, y: 1.5, w: 0.4, h: 1.6, fontSize: 24, color: C.accent3, align: "center", valign: "middle" });
  });
  [["1–2 stars", "Negative"], ["3 stars", "Neutral"], ["4–5 stars", "Positive"]].forEach(([a, b], i) => {
    card(s, 0.5 + i * 1.75, 3.45, 1.6, 0.8, [run(a, { fontSize: 14, color: C.accent3 }), run(b, { fontSize: 18, bold: true, color: C.text2 }, true)], C.background2);
  });
  text(s, [run("Stratified split, seed 42", { fontSize: 14, color: C.accent3 }), run("40,000 train · 5,000 val · 5,000 test", { fontSize: 16, bold: true, color: C.text2 }, true)],
    { x: 5.9, y: 3.45, w: 3.6, h: 0.8, valign: "middle" });
  source(s, "Data: Amazon Reviews 2023, Hou et al. [1]");
}
{
  const s = slide("Macro-F1 is the main metric, measured against star labels and against AI labels",
    "SPEAKER: Dinh (suggested). ~50 s.\nWe report accuracy, per-class precision, recall and F1, and macro and micro averages. Macro-F1 is the headline because it weights the three classes equally. Experiment 1 is the held-out test set with star-based labels. Experiment 2 is 600 extra reviews, 200 per star class, labeled by Claude without seeing the stars; Claude's labels came out 260 Negative, 169 Neutral, 171 Positive.");
  const exps = [
    ["Experiment 1", "Test set", "5,000 held-out reviews", "Gold label: star rating"],
    ["Experiment 2", "AI-labeled set", "600 extra reviews", "Gold label: Claude, stars hidden"],
  ];
  exps.forEach(([k, name, a, b], i) => {
    card(s, 0.5 + i * 4.65, 1.5, 4.35, 2.0, [
      run(k, { fontSize: 14, color: C.accent3 }),
      run(name, { fontSize: 22, bold: true, color: C.text2 }),
      run(a, { fontSize: 18 }),
      run(b, { fontSize: 18 }, true),
    ], C.accent5);
  });
  card(s, 0.5, 3.85, 9.0, 0.9, [
    run("Accuracy  ·  per-class precision, recall, F1  ·  macro and micro averages", { fontSize: 18 }),
    run("Macro-F1 weights the three classes equally", { fontSize: 18, bold: true, color: C.text2 }, true),
  ], C.background2);
}

section = "Fine-tuned BERT";
pres.addSection({ title: section });
{
  const s = slide("BERT is fine-tuned end to end with a 3-class classification head",
    "SPEAKER: Longqi. ~60 s.\nTO ADD by Longqi: the hyperparameters actually used and how they were chosen on validation.");
  const flow = [["Review text", C.background2, C.text1], ["bert-base-uncased\n110 M weights, all trained", C.accent5, C.text2], ["Linear head\non [CLS]", C.accent5, C.text2], ["Negative\nNeutral\nPositive", C.text2, C.background1]];
  const xs = [0.5, 2.55, 5.75, 7.95], ws = [1.6, 2.75, 1.75, 1.55];
  flow.forEach(([t, fill, col], i) => {
    card(s, xs[i], 1.6, ws[i], 1.4, [run(t, { fontSize: 16, bold: i > 0, color: col }, true)], fill);
    if (i < 3) text(s, "→", { x: xs[i] + ws[i], y: 1.6, w: xs[i + 1] - xs[i] - ws[i], h: 1.4, fontSize: 24, color: C.accent3, align: "center", valign: "middle" });
  });
  todo(s, "TO ADD (Longqi): learning rate, epochs, batch size, max sequence length, GPU, training time", 0.5, 3.45, 9.0, 1.2);
  source(s, "BERT: Devlin et al. [2]");
}
{
  const s = slide("BERT results: to add once the run is finished",
    "SPEAKER: Longqi. ~70 s.\nTO ADD by Longqi. Replace the title with the finding as a sentence, for example 'BERT reaches X macro-F1 with Neutral as its weakest class'. Use the same chart style as the two Llama result slides (copy that chart and edit its data).");
  todo(s, [
    { text: "TO ADD (Longqi)", options: { bold: true, breakLine: true } },
    { text: "Test set: accuracy, macro-F1, per-class precision / recall / F1", options: { breakLine: true } },
    { text: "600 AI-labeled reviews: the same metrics against AI labels and star labels", options: { breakLine: true } },
    { text: "Confusion matrix in percentages, not counts", options: {} },
  ], 0.5, 1.5, 9.0, 3.2);
}

section = "Prompted Llama";
pres.addSection({ title: section });
{
  const s = slide("Prompted Llama 3.1 8B classifies with no training, zero-shot or with nine examples",
    "SPEAKER: Dinh. ~60 s.\nSame system and user instruction in both settings: return only one label. Few-shot adds three training reviews per class as earlier turns; k was chosen on 600 validation reviews. The output is mapped to a label by exact match, and if the model adds an explanation, by the first label word. That fallback was needed for 518 of 5,000 zero-shot outputs and none of the few-shot ones.");
  const blocks = [
    ["System", "You are a sentiment classifier … return one label", C.background2, C.text1],
    ["Few-shot only", "3 labeled training reviews per class", C.accent6, C.text1],
    ["User", "Review: \"\"\" … \"\"\"", C.background2, C.text1],
    ["Llama answers", "Neutral", C.text2, C.background1],
  ];
  blocks.forEach(([k, v, fill, col], i) => {
    const y = 1.45 + i * 0.88;
    box(s, { x: 0.5, y, w: 5.2, h: 0.74 }, fill, i === 1 ? { color: T.accent2, width: 1, dashType: "dash" } : undefined);
    s.addText([run(k, { fontSize: 12, color: i === 3 ? C.accent5 : C.accent3 }), run(v, { fontSize: 16, bold: i === 3, color: col }, true)],
      { isTextBox: true, x: 0.7, y, w: 4.8, h: 0.74, margin: 0, valign: "middle" });
  });
  bullets(s, [`Zero-shot prompt: ${Math.round(qcost[0].prompt_tokens_mean)} tokens`, `Few-shot prompt: ${Number(Math.round(qcost[1].prompt_tokens_mean)).toLocaleString("en-US")} tokens`, "k = 3 per class chosen on validation", "Label read by exact match, then first label word"],
    { x: 6.1, y: 1.5, w: 3.4, h: 3.4 });
  source(s, "Llama 3.1 8B Instruct [3]");
}
{
  const s = slide(`Few-shot examples lift macro-F1 from ${f2(zero.macro_f1)} to ${f2(few.macro_f1)}, but Neutral remains the weak class`,
    "SPEAKER: Dinh. ~75 s.\nZero-shot, the model finds only 32% of Neutral reviews; most are called Negative. Nine examples raise Neutral recall to 54% and Neutral F1 from 0.43 to 0.61. Negative is still over-predicted: recall 0.90 but precision 0.69. The price is a prompt almost seven times longer, so each review takes about 4.4 times as long.");
  barChart(s, [...LABELS, "Macro-F1"], [{ name: "Zero-shot", values: f1s(zero) }, { name: "Few-shot (k = 3)", values: f1s(few) }], [GREY, BLUE], { x: 0.4, y: 1.3, w: 5.7, h: 3.75 });
  callout(s, `Neutral F1: ${f2(zero.Neutral_f1)} → ${f2(few.Neutral_f1)}`, 6.3, 1.5, 3.2);
  bullets(s, [`Neutral recall: ${Math.round(100 * zero.Neutral_recall)}% → ${Math.round(100 * few.Neutral_recall)}%`, `Negative over-predicted: precision ${f2(few.Negative_precision)}`, `${(qcost[1].sec_per_review / qcost[0].sec_per_review).toFixed(1)}× slower per review`],
    { x: 6.3, y: 2.2, w: 3.2, h: 2.7 });
  source(s, "F1 on the 5,000-review test set, star labels");
}

section = "Llama + QLoRA";
pres.addSection({ title: section });
{
  const s = slide("QLoRA trains 0.5% of Llama's weights on top of a frozen 4-bit base",
    "SPEAKER: JN. ~60 s.\nSame Llama 3.1 8B and exactly the same zero-shot prompt as Dinh, so the only difference is the fine-tuning. The base model is loaded in 4-bit and frozen; small low-rank adapter matrices are added to the attention and MLP projections and only those are trained: 42 million of 8 billion weights. The target is just the label, so the loss is computed on the label token only. One epoch over the 40,000 training reviews took 114 minutes on one A100.");
  box(s, { x: 0.5, y: 1.5, w: 5.3, h: 2.6 }, C.background2);
  text(s, [run("Llama 3.1 8B Instruct", { fontSize: 20, bold: true, color: C.text2 }), run("4-bit, frozen  ·  8.07 B weights", { fontSize: 16 }, true)], { x: 0.75, y: 1.65, w: 4.8, h: 0.8 });
  card(s, 0.75, 2.65, 4.8, 1.2, [run("LoRA adapters, rank 16", { fontSize: 20, bold: true, color: C.background1 }), run("41.9 M trainable weights (0.52%)", { fontSize: 16, color: C.background1 }, true)], C.text2);
  text(s, [run("Same zero-shot prompt in", { fontSize: 16, color: C.accent3 }), run("→  one label out", { fontSize: 16, color: C.accent3 }, true)], { x: 0.75, y: 4.25, w: 4.8, h: 0.6 });
  bullets(s, ["40,000 reviews, 1 epoch", "Learning rate 2e-4, batch 16", "Loss on the label only", `${Math.round(cost.training_minutes)} min on one A100`], { x: 6.2, y: 1.6, w: 3.3, h: 3.3 });
  source(s, "QLoRA: Dettmers et al. [4]; LoRA: Hu et al. [5]");
}
{
  const s = slide(`QLoRA reaches ${f2(qlora.macro_f1)} macro-F1 and raises Neutral F1 from ${f2(few.Neutral_f1)} to ${f2(qlora.Neutral_f1)}`,
    "SPEAKER: JN. ~75 s.\nAgainst few-shot prompting, QLoRA is better on every class. The largest gain is Neutral, 0.61 to 0.77. Because the prompt is the same as zero-shot, the fair comparison for the effect of fine-tuning is zero-shot 0.68 to QLoRA 0.84. Every one of the 5,000 outputs was a bare label: no fallback extraction and no invalid outputs. Validation macro-F1 on the 600 validation reviews was 0.84, matching the test score.");
  barChart(s, [...LABELS, "Macro-F1"], [{ name: "Few-shot (k = 3)", values: f1s(few) }, { name: "QLoRA", values: f1s(qlora) }], [BLUE, NAVY], { x: 0.4, y: 1.3, w: 5.7, h: 3.75 });
  callout(s, `Neutral F1: ${f2(few.Neutral_f1)} → ${f2(qlora.Neutral_f1)}`, 6.3, 1.5, 3.2);
  bullets(s, [`Same prompt as zero-shot: +${f2(qlora.macro_f1 - zero.macro_f1)} macro-F1`, "Better on all three classes", "5,000 outputs, none invalid"], { x: 6.3, y: 2.2, w: 3.2, h: 2.7 });
  source(s, "F1 on the 5,000-review test set, star labels");
}

section = "Comparison";
pres.addSection({ title: section });
{
  const s = slide(`Fine-tuning cuts Neutral-read-as-Negative errors from ${cmFew[1][0]}% to ${cmQ[1][0]}%, at a cost in Negative recall`,
    `SPEAKER: JN. ~60 s.\nRows are the star label, columns the prediction, each row sums to 100%. With few-shot prompting ${cmFew[1][0]}% of Neutral reviews are predicted Negative; after fine-tuning that is ${cmQ[1][0]}%. The errors do not vanish, they move: Negative reviews predicted Neutral rise from ${cmFew[0][1]}% to ${cmQ[0][1]}%, so Negative recall falls from ${cmFew[0][0]}% to ${cmQ[0][0]}%. Positive is rarely confused with Negative by either model. BERT's matrix is to be added by Longqi.`);
  const shade = (p) => { // white -> accent blue
    const a = p / 100, mix = (c) => Math.round(255 + (parseInt(c, 16) - 255) * a).toString(16).padStart(2, "0");
    return (mix(BLUE.slice(0, 2)) + mix(BLUE.slice(2, 4)) + mix(BLUE.slice(4, 6))).toUpperCase();
  };
  const cell = (t, o) => ({ text: t, options: { align: "center", valign: "middle", fontSize: 16, color: T.dk1, ...o } });
  [["Few-shot prompting", cmFew, 0.5], ["QLoRA", cmQ, 5.2]].forEach(([name, cm, x]) => {
    text(s, name, { x, y: 1.4, w: 4.3, h: 0.35, fontSize: 20, bold: true, color: C.text2 });
    const rows = [[cell("", {}), ...["Neg.", "Neu.", "Pos."].map((l) => cell(l, { bold: true }))]];
    cm.forEach((r, i) => rows.push([cell(LABELS[i], { bold: true, align: "left" }),
      ...r.map((p, j) => cell(p + "%", {
        fill: { color: shade(p) }, color: p > 55 ? "FFFFFF" : T.dk1, bold: i === j || (i === 1 && j === 0), fontSize: 18,
        ...(i === 1 && j === 0 ? { border: { type: "solid", pt: 3, color: T.accent2 } } : {}),
      }))]));
    s.addTable(rows, { x, y: 1.85, w: 4.3, colW: [1.42, 0.96, 0.96, 0.96], rowH: [0.45, 0.62, 0.62, 0.62], border: { type: "solid", pt: 1, color: "FFFFFF" } });
  });
  card(s, 0.5, 4.4, 9.0, 0.55, [run(`Neutral recall ${cmFew[1][1]}% → ${cmQ[1][1]}%     ·     Negative recall ${cmFew[0][0]}% → ${cmQ[0][0]}%`, { fontSize: 16 }, true)], C.background2);
  source(s, "Test set, row percentages. Rows: star label. Columns: prediction.");
}
{
  const s = slide(`On the test set QLoRA leads both prompting settings by at least ${Math.floor(100 * (qlora.macro_f1 - few.macro_f1))} points of macro-F1`,
    "SPEAKER: JN (suggested). ~60 s.\nHighlighted cells are the ones to talk about. QLoRA has the best macro-F1 and the best Neutral F1 of the Llama methods. It costs 114 minutes of training once; prompting costs nothing to train but few-shot is slow per review because of the long prompt. Timings come from different GPUs (L4 for prompting, A100 for QLoRA), so compare them only roughly. BERT row to be filled by Longqi.");
  const hl = { fill: { color: T.accent6 }, bold: true };
  const c = (t, o) => ({ text: t, options: { align: "center", valign: "middle", fontSize: 15, color: T.dk1, ...o } });
  const head = ["Method", "Accuracy", "Macro-F1", "Neutral F1", "Training", "s / review"].map((t, i) => c(t, { bold: true, color: "FFFFFF", fill: { color: T.dk2 }, align: i ? "center" : "left" }));
  const row = (name, r, train, sec, o = {}) => [c(name, { align: "left", bold: true }), c(f3(r.accuracy)), c(f3(r.macro_f1), o.f1), c(f3(r.Neutral_f1), o.neu), c(train), c(sec, o.sec)];
  s.addTable([
    head,
    [c("Fine-tuned BERT", { align: "left", bold: true }), ...Array(5).fill(0).map(() => c("to add", { color: T.accent2, italic: true }))],
    row("Llama, zero-shot", zero, "none", f3(qcost[0].sec_per_review) + " (L4)"),
    row("Llama, few-shot", few, "none", f3(qcost[1].sec_per_review) + " (L4)", { sec: hl }),
    row("Llama + QLoRA", qlora, Math.round(cost.training_minutes) + " min", f3(cost.sec_per_review) + " (A100)", { f1: hl, neu: hl }),
  ], { x: 0.5, y: 1.5, w: 9.0, colW: [2.3, 1.3, 1.3, 1.35, 1.15, 1.6], rowH: 0.6, border: { type: "solid", pt: 0.75, color: "D9D9D9" } });
  source(s, "Timings were measured on different GPUs and are not directly comparable.");
}
{
  const s = slide("Against AI labels the ranking flips: prompted Llama agrees with Claude more than QLoRA does",
    "SPEAKER: Dinh (suggested). ~70 s.\nSame 600 reviews scored two ways. Against Claude's labels, few-shot prompting scores 0.87 and QLoRA 0.84. Against the star labels of the same reviews, QLoRA scores 0.84 and prompting 0.77. QLoRA was trained on star labels, so it learned the star convention; the prompted model judges the text much as Claude does. Claude itself agrees with the stars at only 0.75 macro-F1, mostly because 3-star reviews often read as negative. So part of the 'error' against star labels is label noise. BERT to be added by Longqi.");
  barChart(s, ["vs AI labels", "vs star labels"], [
    { name: "Few-shot (k = 3)", values: [n(fewAI, "macro_f1"), n(fewStar, "macro_f1")] },
    { name: "QLoRA", values: [n(qAI, "macro_f1"), n(qStar, "macro_f1")] },
  ], [BLUE, NAVY], { x: 0.4, y: 1.3, w: 5.7, h: 3.75 });
  bullets(s, ["QLoRA learned the star convention: 0.84 on both", "Claude agrees with stars at only 0.75", "3-star reviews often read as negative"], { x: 6.3, y: 1.6, w: 3.2, h: 3.2 });
  source(s, "Macro-F1 on the 600 Experiment 2 reviews, labeled by Claude without star ratings");
}
{
  const s = slide("Fine-tuning wins on star labels, and what counts as Neutral decides the rest",
    "SPEAKER: all. ~45 s, then leave this slide up for Q&A.\nThree takeaways. One: fine-tuning half a percent of Llama's weights beats prompting the same model by 8 to 16 points of macro-F1 on the test set. Two: Neutral is the hardest class in every setting; fine-tuning moves the Neutral/Negative boundary rather than removing the confusion. Three: the label source matters; star labels are noisy for 3-star reviews, and each model agrees most with the labels it resembles. BERT conclusion to be added by Longqi.");
  const items = [
    [`${f2(qlora.macro_f1)}`, "QLoRA macro-F1 on the test set", `vs ${f2(few.macro_f1)} few-shot and ${f2(zero.macro_f1)} zero-shot`],
    ["Neutral", "is the hardest class everywhere", "fine-tuning moves the errors, it does not remove them"],
    ["0.75", "Claude vs star labels", "3-star reviews are noisy gold labels"],
  ];
  items.forEach(([big, a, b], i) => {
    card(s, 0.5 + i * 3.1, 1.5, 2.8, 2.4, [
      run(big, { fontSize: 32, bold: true, color: C.text2 }),
      run(a, { fontSize: 18, bold: true }),
      run(b, { fontSize: 14, color: C.accent3 }, true),
    ], C.accent5);
  });
  todo(s, "TO ADD (Longqi): where BERT lands against the two Llama methods", 0.5, 4.15, 9.0, 0.7);
}

section = "References";
pres.addSection({ title: section });
{
  const s = slide("References", "Not presented. Backup for questions.");
  const refs = [
    "[1] Y. Hou, J. Li, Z. He, A. Yan, X. Chen, and J. McAuley, \"Bridging language and items for retrieval and recommendation,\" arXiv:2403.03952, 2024. (Amazon Reviews 2023)",
    "[2] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in Proc. NAACL-HLT, 2019.",
    "[3] A. Grattafiori et al., \"The Llama 3 herd of models,\" arXiv:2407.21783, 2024. Model: meta-llama/Llama-3.1-8B-Instruct, Hugging Face.",
    "[4] T. Dettmers, A. Pagnoni, A. Holtzman, and L. Zettlemoyer, \"QLoRA: Efficient finetuning of quantized LLMs,\" in Proc. NeurIPS, 2023.",
    "[5] E. J. Hu et al., \"LoRA: Low-rank adaptation of large language models,\" in Proc. ICLR, 2022.",
  ];
  s.addText(refs.map((t, i) => ({ text: t, options: { breakLine: i < refs.length - 1 } })),
    { isTextBox: true, x: 0.5, y: 1.2, w: 9.0, h: 3.8, margin: 0, fontSize: 14, color: C.text1, valign: "top", paraSpaceAfter: 10 });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (process.argv[2]) await require(process.argv[2]).applyTheme(OUT, THEME);
  else console.warn("no apply_theme.js given: theme colours not written, deck will show Office default colours");
  console.log("wrote", OUT);
})();

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
pres.title = "ReviewLens — Prompted Llama 3.1 8B";
pres.author = "Quoc Cuong Dinh";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "Content",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9, h: 0.75,
      fontSize: 28, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: "ReviewLens · Prompted Llama 3.1 8B · Quoc Cuong Dinh",
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

// ---------- Slide 1: Method ----------
pres.addSection({ title: "Prompted Llama" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Prompted Llama 3.1 8B, no training", { placeholder: "title" });

  // Process flow: 3 numbered steps
  const steps = [
    ["Prompt", "System role + review text\n(+ labelled examples)"],
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

  // Two settings compared
  const settings = [
    ["Zero-shot", "Instruction only", "266 tokens / prompt"],
    ["Few-shot (k = 3 per class)", "9 labelled examples from train\nk chosen on 600 val reviews", "1,798 tokens / prompt"],
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

  s.addNotes("My part is the method that needs no training: we prompt Llama 3.1 8B Instruct and read the label from its answer. " +
    "Each review goes in a prompt, the model generates, and we extract the label: exact match first, then the first whole-word label. " +
    "I tried zero-shot, and few-shot with 1, 2 or 3 examples per class; k = 3 was best on 600 validation reviews. " +
    "Few-shot prompts are about 7 times longer. Everything is scored with macro-F1 on the same 5,000 test reviews as the other methods.");
}

// ---------- Slide 2: Test results ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Few-shot lifts test macro-F1: 0.68 → 0.76", { placeholder: "title" });

  s.addChart(pres.charts.BAR, [
    { name: "Zero-shot", labels: ["Negative", "Neutral", "Positive", "Macro"], values: [0.732, 0.430, 0.868, 0.677] },
    { name: "Few-shot k=3", labels: ["Negative", "Neutral", "Positive", "Macro"], values: [0.780, 0.609, 0.881, 0.757] },
  ], Object.assign({
    objectName: "f1-chart", x: 0.4, y: 1.15, w: 5.0, h: 3.85, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.grey, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00",
    valAxisMinVal: 0, valAxisMaxVal: 1, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", showTitle: true, title: "F1 per class (test, n = 5,000)", titleFontSize: 12,
    titleColor: HEX.ink,
  }, chartText));

  // Confusion matrix, row-normalised %
  T(s, "Few-shot confusion matrix (% of each true class)", { x: 5.7, y: 1.2, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  const cm = [[90.0, 9.2, 0.8], [39.3, 53.9, 6.8], [1.3, 13.9, 84.8]];
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
    { text: "39% of Neutral reviews → Negative", options: { bold: true, color: HEX.neg, breakLine: true } },
    { text: "Neutral is the weak class (recall 54%; 32% zero-shot). Few-shot helps most there: F1 0.43 → 0.61.", options: { color: HEX.ink } },
  ], { x: 5.9, y: 3.75, w: 3.4, h: 0.95, fontSize: 12, valign: "top" });

  s.addNotes("Adding three examples per class raises macro-F1 from 0.68 to 0.76, and accuracy from 70% to 76%. " +
    "Negative and Positive are already good zero-shot; the gain is almost all on Neutral, F1 0.43 to 0.61. " +
    "The confusion matrix shows the remaining problem: 39% of 3-star reviews are predicted Negative. " +
    "Reading them, many 3-star reviews are mostly complaints, so the star label itself is debatable.");
}

// ---------- Slide 3: Experiment 2 ----------
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Prompted Llama" });
  s.addText("Exp. 2: prompted model agrees with AI labels", { placeholder: "title" });
  T(s, "600 extra reviews labelled by Claude Haiku from the text only (stars hidden)",
    { x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 13, color: C.text2 });

  const stats = [
    ["0.874", "Few-shot Llama\nvs AI labels", HEX.amber, true],
    ["0.766", "Few-shot Llama\nvs star labels (same 600)", HEX.slate, false],
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
    { text: "Claude and the prompted model both read many 3-star reviews as Negative, so part of the test \"error\" is label noise, not model error.", options: { color: HEX.ink } },
  ], { x: 0.75, y: 4.1, w: 8.5, h: 0.75, fontSize: 13, valign: "middle" });

  s.addNotes("For Experiment 2, I labelled 600 new reviews with Claude Haiku using the text only. " +
    "Against these AI labels, the few-shot model scores 0.874 macro-F1, much higher than 0.766 against the stars of the same reviews. " +
    "And Claude itself only agrees with the stars at 0.746. So when two independent readers of the text disagree with the stars in the same way, " +
    "the star rating is the noisy part, especially for Neutral.");
}

// ---------- Slide 4: Comparison ----------
pres.addSection({ title: "Comparison" });
{
  const s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Three methods on the same data", { placeholder: "title" });

  s.addChart(pres.charts.BAR, [
    { name: "Test (star labels)", labels: ["BERT fine-tuned", "Llama few-shot", "Llama + QLoRA"], values: [0.783, 0.757, 0.838] },
    { name: "Exp 2 (AI labels)", labels: ["BERT fine-tuned", "Llama few-shot", "Llama + QLoRA"], values: [0.803, 0.874, 0.838] },
  ], Object.assign({
    objectName: "compare-chart", x: 0.4, y: 1.15, w: 4.9, h: 3.85, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.slate, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.000",
    valAxisMinVal: 0.6, valAxisMaxVal: 0.95, valAxisMajorUnit: 0.1, valAxisLabelFormatCode: "0.0", valGridLine: { color: "E2E6EA", size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", showTitle: true, title: "Macro-F1", titleFontSize: 12, titleColor: HEX.ink,
  }, chartText));

  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.paper, fill: { color: HEX.ink }, align: "center" } });
  const cell = (t, best) => ({ text: t, options: { align: "center", bold: !!best,
    color: best ? HEX.paper : HEX.ink, fill: { color: best ? HEX.teal : HEX.mist } } });
  const lab = (t) => ({ text: t, options: { bold: true, color: HEX.ink, fill: { color: HEX.mist } } });
  const rows = [
    [hdr(""), hdr("BERT"), hdr("Few-shot"), hdr("QLoRA")],
    [lab("Neutral F1"), cell("0.692"), cell("0.609"), cell("0.768", true)],
    [lab("Training"), cell("17 min"), cell("none", true), cell("114 min")],
    [lab("Inference / review"), cell("0.003 s", true), cell("0.71 s"), cell("0.056 s")],
    [lab("Trainable params"), cell("110 M"), cell("0", true), cell("42 M")],
  ];
  s.addTable(rows, { objectName: "cost-table", x: 5.55, y: 1.2, w: 4.0, colW: [1.45, 0.85, 0.85, 0.85],
    rowH: 0.45, fontSize: 11, fontFace: "Calibri", border: { type: "solid", pt: 2, color: HEX.paper }, valign: "middle" });
  T(s, "Highlighted = best in row. Training/inference: BERT and few-shot on an L4 GPU, QLoRA on an A100.",
    { x: 5.55, y: 3.55, w: 4.0, h: 0.45, fontSize: 10, italic: true, color: C.text2 });
  T(s, [
    { text: "QLoRA wins on star labels; ", options: { bold: true } },
    { text: "few-shot wins on AI labels with no training at all." },
  ], { x: 5.55, y: 4.2, w: 4.0, h: 0.75, fontSize: 13, color: C.text1 });

  s.addNotes("Now all three methods side by side. On the star-labelled test set, QLoRA is best at 0.838, then BERT at 0.783, then few-shot prompting at 0.757. " +
    "On the AI-labelled set the order flips: few-shot prompting is best at 0.874, because the fine-tuned models learned the star convention. " +
    "Neutral is the weakest class for every method; QLoRA handles it best. " +
    "On cost: prompting needs no training but is the slowest at inference; BERT is by far the fastest.");
}

// ---------- Slide 5: Conclusion ----------
{
  const s = pres.addSlide({ masterName: "Dark", sectionTitle: "Comparison" });
  s.addText("Conclusion", { placeholder: "title" });
  const cols = [
    ["Llama + QLoRA", "0.838", "Most accurate on star labels and best on Neutral, at the cost of 114 min of A100 training", "6FC2D0"],
    ["Fine-tuned BERT", "0.783", "Solid accuracy and cheapest to run: ~240× faster per review than prompting", "C9D2DB"],
    ["Few-shot Llama", "0.757", "No training; best agreement with text-based AI labels (0.874), but slowest at inference", HEX.amber],
  ];
  cols.forEach(([h, n, d, col], i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `concl-${i + 1}`, x, y: 1.25, w: 2.8, h: 2.75, rectRadius: 0.08,
      fill: { color: "323B48" }, line: { type: "none" } });
    T(s, h, { x: x + 0.25, y: 1.4, w: 2.3, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
    T(s, n, { x: x + 0.25, y: 1.85, w: 2.3, h: 0.7, fontSize: 40, bold: true, color: col, fontFace: "Cambria" });
    T(s, "test macro-F1", { x: x + 0.25, y: 2.55, w: 2.3, h: 0.25, fontSize: 10, color: C.accent5 });
    T(s, d, { x: x + 0.25, y: 2.9, w: 2.3, h: 1.0, fontSize: 12, color: C.background2, valign: "top" });
  });
  T(s, [
    { text: "Neutral (3-star) reviews are the hardest class for all three, ", options: { bold: true, color: HEX.amber } },
    { text: "partly because star ratings and review text often disagree.", options: { color: HEX.paper } },
  ], { x: 0.5, y: 4.3, w: 9, h: 0.6, fontSize: 14, valign: "middle" });

  s.addNotes("To conclude: if labelled data and a GPU for training are available, QLoRA gives the best accuracy. " +
    "BERT is the practical choice for high volume because it is cheap and fast. " +
    "Few-shot prompting is the fastest to set up, needs no training data beyond a few examples, and matches human-like reading of the text best. " +
    "For all three, Neutral is the hard case, partly because the stars themselves are a noisy label.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();

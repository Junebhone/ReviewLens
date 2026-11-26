// Builds ReviewLens_Presentation.html (single self-contained file, no dependencies).  Run:  node build_web.js
// Same slides and wording as build_deck.js (the team deck built on Dinh's slides), in the Swiss Modern web style
// (frontend-slides skill: fixed 1920x1080 stage, white / black / one red accent).
// Slides 1–6 are Dinh's; their speaker notes are read from docs/slides/build_slides.js. Slides 7–10 are Longqi's
// (content from docs/slides/Longqi_BERT_Experiment_Slides.pptx). Slides 11–17 are JN's.
// Rebuilding overwrites the .html, so text edited in the browser and saved over it is lost.
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "ReviewLens_Presentation.html");
const D = require("./deck_data.js");
const { f2, f3, LABELS, NOTES } = D;
const dinhNotes = [...fs.readFileSync(path.join(__dirname, "../docs/slides/build_slides.js"), "utf8")
  .matchAll(/s\.addNotes\("((?:[^"\\]|\\.)*)"\)/g)].map((m) => JSON.parse(`"${m[1]}"`));
if (dinhNotes.length !== 6) throw new Error("expected 6 speaker notes in Dinh's build_slides.js");

// ---------- html helpers ----------
const slides = [];
function slide(section, title, body, notes, cls = "") {
  slides.push(`
<section class="slide ${cls}">
  <header class="chrome"><span><i></i>${section}</span><span>ReviewLens</span></header>
  <h2 class="title reveal">${title}</h2>
  <div class="body">${body}</div>
  <aside class="notes">${notes.replace(/\n/g, "<br>")}</aside>
</section>`);
}
const src = (t) => `<p class="source">${t}</p>`;
const bullets = (items) => `<ul class="points reveal">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
// grouped bars on a 0–1 axis; `focus` is the index of the category to spotlight
function chart(cats, series, focus) {
  const groups = cats.map((c, i) => `
      <div class="group${i === focus ? " focus" : ""}">
        <div class="bars">${series.map((s) => `<div class="bar ${s.cls}" style="height:${(100 * s.values[i]).toFixed(1)}%"><span>${f2(s.values[i])}</span></div>`).join("")}</div>
        <div class="cat">${c}</div>
      </div>`).join("");
  const legend = series.map((s) => `<span><i class="${s.cls}"></i>${s.name}</span>`).join("");
  return `<div class="chart reveal"><div class="plot">${groups}</div><div class="legend">${legend}</div></div>`;
}
const CATS = [...LABELS, "Macro-F1"];
const flow = (steps) => `<div class="flow steps reveal">${steps.map(([h, d], i) => `${i ? "<b>→</b>" : ""}<div class="strong"><small>Step ${i + 1}</small>${h}<small>${d}</small></div>`).join("")}</div>`;
// per-class precision / recall / F1 of one results row, Neutral F1 (the hard class) picked out
const prf = (name, r, hotCols = ["f1"]) => `<div class="prf reveal"><h3>${name}</h3><table><tr><th></th><th>Precision</th><th>Recall</th><th>F1</th></tr>${LABELS.map((l) =>
  `<tr><th>${l}</th>${["precision", "recall", "f1"].map((m) => `<td class="${l === "Neutral" && hotCols.includes(m) ? "hot" : ""}">${f2(r[`${l}_${m}`])}</td>`).join("")}</tr>`).join("")}</table></div>`;
// confusion matrix in row percentages (course guideline: percentages, not counts); Neutral → Negative outlined
function matrix(name, cm) {
  const rows = cm.map((r, i) => `<tr><th>${LABELS[i]}</th>${r.map((p, j) =>
    `<td class="${i === 1 && j === 0 ? "hit" : ""}" style="background:rgba(17,17,17,${(p / 100 * 0.9).toFixed(2)});color:${p > 45 ? "#fff" : "#111"}">${p}%</td>`).join("")}</tr>`).join("");
  return `<div class="matrix reveal"><h3>${name}</h3><table><tr><th></th><th>Neg.</th><th>Neu.</th><th>Pos.</th></tr>${rows}</table></div>`;
}
// left: F1 chart of two settings; right: confusion matrix and a callout
const result = (series, name, cm, label, big, note) => `
  <div class="split">
    ${chart(CATS, series, 1)}
    <div>${matrix(name, cm)}<p class="callout reveal">${label}<b>${big}</b></p><p class="aside reveal">${note}</p></div>
  </div>`;
// training and validation loss by step, as an inline SVG line chart
function lossChart(curve) {
  const W = 1080, H = 560, x = (i) => 110 + (i * (W - 220)) / (curve.length - 1), y = (v) => 60 + ((0.31 - v) / 0.16) * (H - 150);
  const line = (k, col) => `<polyline fill="none" stroke="${col}" stroke-width="6" points="${curve.map((p, i) => `${x(i)},${y(p[k])}`).join(" ")}"/>` +
    curve.map((p, i) => `<circle cx="${x(i)}" cy="${y(p[k])}" r="9" fill="${col}"/><text x="${x(i)}" y="${y(p[k]) + (k === "val" ? 44 : -22)}" text-anchor="middle" fill="${col}" class="v">${f2(p[k])}</text>`).join("");
  return `<div class="chart reveal"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><line x1="60" y1="${H - 70}" x2="${W - 60}" y2="${H - 70}" stroke="#111" stroke-width="3"/>` +
    line("train", "#b0b0b0") + line("val", "#ff3300") + curve.map((p, i) => `<text x="${x(i)}" y="${H - 28}" text-anchor="middle" class="c">step ${p.step.toLocaleString("en-US")}</text>`).join("") +
    `</svg><div class="legend"><span><i class="grey"></i>Training loss (500-step mean)</span><span><i class="red"></i>Validation loss</span></div></div>`;
}

// ================= slides 1–6: Dinh (content as in docs/slides/build_slides.js) =================
slide("Introduction", "ReviewLens: Sentiment Classification of E-Commerce Product Reviews", `
  <div class="cards three compact reveal">
    <div class="card"><small>Longqi Sun</small><h3>Fine-tuned BERT</h3><p>bert-base-uncased + classification head</p></div>
    <div class="card"><small>Quoc Cuong Dinh</small><h3>Prompted Llama 3.1 8B</h3><p>zero- / few-shot, no training</p></div>
    <div class="card"><small>Bhone Kyaw Si Hein</small><h3>Llama 3.1 8B + QLoRA</h3><p>4-bit base, trained low-rank adapters</p></div>
  </div>
  <div class="row reveal">
    <div class="chip wide quote"><small>★★★☆☆ &nbsp; 3-star review from the test set</small>“Too heavy, bulky. Only works with a few Samsung phones. Biggest gripe is that the controls are up on the headset itself…”</div>
    <div class="chip"><small>Label?</small>Negative<br>Neutral<br>Positive</div>
  </div>
  <p class="banner light reveal"><b>Main metric: macro-F1</b>, so Neutral counts as much as the easy classes.</p>
  ${src("One task, three methods, same data. Also reported: per-class precision / recall / F1, confusion matrices.")}`, dinhNotes[0]);

slide("Introduction", "Data: one shared, balanced split", `
  <div class="funnel reveal">
    <div><small>Data source</small><b>20.8 M</b><span>Cell Phones &amp; Accessories reviews, Amazon Reviews 2023</span></div>
    <div><small>Filtering</small><b>1.11 M</b><span>100–300 words, duplicates dropped; links, @, #, emojis removed</span></div>
    <div><small>Balancing</small><b>50,000</b><span>balanced sample: 16,667 / 16,667 / 16,666</span></div>
    <div class="hot"><small>Splitting</small><b>40k/5k/5k</b><span>stratified train / val / test, used by all three methods</span></div>
  </div>
  <div class="row reveal">
    <div class="chip"><small>1–2 ★</small>Negative</div>
    <div class="chip"><small>3 ★</small>Neutral</div>
    <div class="chip"><small>4–5 ★</small>Positive</div>
    <div class="chip wide"><small>Experiment 2: AI-labelled reviews</small>600 extra reviews, labelled by Claude Haiku from the text only</div>
  </div>
  <p class="banner light reveal">Neutral is the scarcest: 131k eligible vs 243k Negative and 737k Positive, hence the balanced sample. <b>Claude's labels: 260 Neg · 169 Neu · 171 Pos.</b></p>
  ${src("Source: Amazon Reviews 2023, McAuley Lab (UCSD) · split seed 42")}`, dinhNotes[1]);

slide("Prompted Llama", "Prompted Llama 3.1 8B, no training", `
  ${flow([["Prompt", "Instructions + definitions + examples + review"], ["Generate", "Llama-3.1-8B-Instruct, greedy decoding"], ["Extract", "Exact label, else first whole-word label match"]])}
  <div class="cards two compact gap reveal">
    <div class="card"><small>${D.tok(D.zc)} tokens / prompt</small><h3>Zero-shot (baseline)</h3><p>Instructions only</p></div>
    <div class="card hot"><small>${D.tok(D.fc)} tokens / prompt</small><h3>Few-shot k=5 + definitions</h3><p>15 examples from train + label definitions; best of 8 designs on 600 val reviews</p></div>
  </div>
  ${src("Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1")}`, dinhNotes[2]);

slide("Prompted Llama", `The best prompt lifts test macro-F1: ${f2(D.zero.macro_f1)} → ${f2(D.few.macro_f1)}`,
  result([{ name: "Zero-shot", cls: "grey", values: D.f1s(D.zero) }, { name: "Few-shot k=5 + definitions", cls: "ink", values: D.f1s(D.few) }],
    "Final design, % of each true class", D.cmFew, "Neutral reviews → Negative", `62% → ${D.cmFew[1][0]}%`,
    `Still the main error. Neutral recall ${D.pct(D.zero.Neutral_recall)}% → ${D.pct(D.few.Neutral_recall)}%, F1 ${f2(D.zero.Neutral_f1)} → ${f2(D.few.Neutral_f1)}.`) +
  src("F1 per class on the test set (n = 5,000)"), dinhNotes[3]);

{
  // validation macro-F1 of the eight designs (quoc_llama_prompting/results/validation_selection.csv); axis 0.5–0.85 as in Dinh's chart
  const designs = [["Zero-shot", 0.680], ["Zero-shot + definitions", 0.747], ["Few-shot k=1", 0.761], ["Few-shot k=2", 0.755], ["Few-shot k=3", 0.777],
    ["Few-shot k=5", 0.797], ["Few-shot k=7", 0.760], ["Few-shot k=5 + definitions", 0.800]];
  const best = Math.max(...designs.map((d) => d[1]));
  slide("Prompted Llama", "Choosing the prompt: 8 designs on validation", `
  <div class="split">
    <div class="hbars reveal">${designs.map(([name, v]) => `<div><span>${name}</span><div><i class="${v === best ? "red" : "ink"}" style="width:${(100 * (v - 0.5) / 0.35).toFixed(1)}%">${f3(v)}</i></div></div>`).join("")}</div>
    <div>
      <p class="callout reveal">Final vs plain k = 5<b>+0.003</b></p>
      ${bullets(["95% CI −0.007 to +0.013: a tie, so the definitions are a tie-break", "More isn't always better: k = 7 drops to 0.760", "Validation 0.800 → test 0.783: barely overfit"])}
    </div>
  </div>
  ${src("Validation macro-F1 (600 reviews). Other random draws of the examples move F1 by up to 0.03.")}`, dinhNotes[4]);
}

slide("Prompted Llama", "Exp. 2: prompted model agrees with AI labels", `
  <div class="cards three big reveal">
    <div class="card hot"><h3>${f3(D.fewAI.macro_f1)}</h3><p><b>Few-shot Llama vs AI labels</b></p></div>
    <div class="card"><h3>${f3(D.fewStar.macro_f1)}</h3><p><b>Few-shot Llama vs star labels</b></p><p>the same 600 reviews</p></div>
    <div class="card"><h3>0.746</h3><p><b>AI labels vs star labels</b></p></div>
  </div>
  <p class="banner light reveal"><b>Stars are a noisy label.</b> Both models read many 3-star reviews as Negative, so part of the test "error" is label noise. 0.879 is agreement between two LLMs, not a ground-truth score.</p>
  ${src("Macro-F1 on 600 extra reviews labelled by Claude Haiku from the text only (stars hidden)")}`, dinhNotes[5]);

// ================= slides 7–10: Longqi =================
slide("Fine-tuned BERT", "Fine-tuned BERT for three-class sentiment", `
  ${flow([["Tokenize", `BERT tokenizer, max length ${D.binfo.max_length}`], ["Fine-tune", `bert-base-uncased, ${D.binfo.epochs} epochs · LR 2e-5`], ["Select", "Best val macro-F1: checkpoint at epoch 3"]])}
  <div class="cards two compact gap reveal">
    <div class="card"><small>same split as all three methods</small><h3>Shared data split</h3><p>40,000 train · 5,000 validation · 5,000 held-out test</p></div>
    <div class="card hot"><small>${Number(D.binfo.training_minutes).toFixed(1)} min training time</small><h3>Training setup</h3><p>Batch ${D.binfo.train_batch_size} · weight decay ${D.binfo.weight_decay} · seed ${D.binfo.seed} · NVIDIA L4</p></div>
  </div>
  ${src("Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1")}`, NOTES.bert1);

slide("Fine-tuned BERT", "Training strategy and loss design", `
  ${flow([["Encode", "[CLS] representation; linear head gives 3 logits"], ["Optimize", "AdamW, LR 2e-5; batch 16 for 3 epochs"], ["Select", "Evaluate each epoch; keep best validation macro-F1"]])}
  <div class="cards two compact gap reveal">
    <div class="card"><small>balanced classes, no class weights</small><h3>Loss function</h3><p>Unweighted 3-class cross-entropy: L = −(1/N) Σ log p(yᵢ | xᵢ)</p></div>
    <div class="card hot"><small>checkpoint each epoch, resume enabled</small><h3>Training control</h3><p>750 warmup steps (10%) · weight decay 0.01</p></div>
  </div>
  ${src("Seed 42 with dynamic padding and mixed precision. The test set stays untouched during training.")}`, NOTES.bert2);

slide("Fine-tuned BERT", `BERT holds up on test: val ${f3(D.bertVal.macro_f1)}, test ${f3(D.bert.macro_f1)}`, `
  <div class="split even">
    <div>${prf("Test precision, recall and F1", D.bert)}<p class="aside reveal"><b>Macro:</b> precision ${f3(D.bert.macro_precision)}, recall ${f3(D.bert.macro_recall)}, F1 ${f3(D.bert.macro_f1)}.</p></div>
    <div>${matrix("Test confusion matrix, % of each true class", D.cmBert)}<p class="callout reveal">Neutral reviews predicted Negative<b>${D.cmBert[1][0]}%</b></p></div>
  </div>
  ${src(`Neutral is the weak class (F1 ${f3(D.bert.Neutral_f1)}). Positive is strongest at ${f3(D.bert.Positive_f1)} F1.`)}`, NOTES.bert3);

slide("Fine-tuned BERT", "Exp. 2: BERT on 600 AI-labeled reviews", `
  <div class="split even">
    <div>
      <p class="callout reveal">Fine-tuned BERT vs AI labels · macro-F1<b>${f3(D.bAI.macro_f1)}</b></p>
      ${bullets([`Macro precision <b>${f3(D.bAI.macro_precision)}</b>`, `Macro recall <b>${f3(D.bAI.macro_recall)}</b>`])}
    </div>
    ${prf("Per-class results on Experiment 2", D.bAI)}
  </div>
  <p class="banner light reveal"><b>Positive is strongest (F1 ${f3(D.bAI.Positive_f1)}).</b> Neutral remains weakest (F1 ${f3(D.bAI.Neutral_f1)}), with lower precision than recall.</p>
  ${src("Claude Haiku labelled each review from text only; star ratings were hidden")}`, NOTES.bert4);

// ================= slides 11–17: JN =================
slide("Llama + QLoRA", "Llama 3.1 8B + QLoRA, 0.5% of weights trained", `
  ${flow([["Freeze", "Llama-3.1-8B-Instruct in 4-bit; 8.07 B weights, not trained"], ["Adapt", "LoRA adapters, rank 16; 41.9 M trainable weights (0.52%)"], ["Train", "Target is the label only; 1 epoch over 40,000 reviews"]])}
  <div class="cards two compact gap reveal">
    <div class="card"><small>${D.tok(D.zc)} tokens / prompt</small><h3>Same prompt as zero-shot</h3><p>No definitions, no examples: the only change is the fine-tuning</p></div>
    <div class="card hot"><small>${Math.round(D.cost.training_minutes)} min on one A100 GPU</small><h3>Training</h3><p>Learning rate 2e-4, batch size 16; same label-extraction rule as prompting</p></div>
  </div>
  ${src("Evaluated on the shared 5,000-review balanced test set · main metric: macro-F1")}`, NOTES.qloraMethod);

slide("Llama + QLoRA", `Training: ${Math.round(D.cost.training_minutes)} minutes on one A100 GPU`, `
  <div class="split">
    ${lossChart(D.lossCurve)}
    <div>
      <div class="prf setup reveal"><h3>Training setup and cost</h3><table>${D.setup.map(([k, v, hot]) => `<tr class="${hot ? "hot" : ""}"><th>${k}</th><td>${v}</td></tr>`).join("")}</table></div>
      <p class="aside reveal"><b>Validation loss ${f2(D.lossCurve[0].val)} → ${f2(D.lossCurve[D.lossCurve.length - 1].val)}:</b> no sign of overfitting. Test set used once, after training.</p>
    </div>
  </div>
  ${src("Loss on the label, by training step")}`, NOTES.qloraTrain);

slide("Llama + QLoRA", `QLoRA lifts test macro-F1: ${f2(D.few.macro_f1)} → ${f2(D.qlora.macro_f1)}`,
  result([{ name: "Best prompt (k=5 + definitions)", cls: "ink", values: D.f1s(D.few) }, { name: "QLoRA", cls: "red", values: D.f1s(D.qlora) }],
    "QLoRA, % of each true class", D.cmQ, "Neutral reviews → Negative", `${D.cmFew[1][0]}% → ${D.cmQ[1][0]}%`,
    `Neutral recall ${D.pct(D.few.Neutral_recall)}% → ${D.pct(D.qlora.Neutral_recall)}%, F1 ${f2(D.few.Neutral_f1)} → ${f2(D.qlora.Neutral_f1)}; all 5,000 outputs are a bare label.`) +
  src("F1 per class on the test set (n = 5,000)"), NOTES.qloraRes);

slide("Llama + QLoRA", "Exp. 2: QLoRA on the AI-labelled reviews", `
  <div class="cards three big reveal">
    <div class="card hot"><h3>${f3(D.qAI.macro_f1)}</h3><p><b>QLoRA vs AI labels</b></p></div>
    <div class="card"><h3>${f3(D.qStar.macro_f1)}</h3><p><b>QLoRA vs star labels</b></p><p>the same 600 reviews</p></div>
    <div class="card"><h3>${f3(D.fewAI.macro_f1)}</h3><p><b>Best prompt vs AI labels</b></p></div>
  </div>
  <p class="banner light reveal"><b>QLoRA agrees equally with both label sets.</b> Against Claude's labels its Negative precision is ${f2(D.qAI.Negative_precision)} but recall only ${f2(D.qAI.Negative_recall)}: 3-star reviews that Claude reads as Negative, it calls Neutral, as the stars do.</p>
  ${src("Macro-F1 on the 600 reviews labelled by Claude Haiku from the text only (stars hidden)")}`, NOTES.qloraExp2);

const trow = (name, r, train, sec, hot = []) => `<tr><th>${name}</th>${[f3(r.macro_f1), f3(r.Neutral_f1), train, sec].map((v, i) => `<td class="${hot.includes(i) ? "hot" : ""}">${v}</td>`).join("")}</tr>`;
slide("Comparison", "Three methods on the same test set", `
  <table class="results reveal">
    <tr><th>Method</th><th>Macro-F1</th><th>Neutral F1</th><th>Training</th><th>Seconds per review</th></tr>
    ${trow("Fine-tuned BERT", D.bert, Math.round(D.bcost.training_minutes) + " min", f3(D.bcost.sec_per_review) + " (L4)", [3])}
    ${trow("Llama, zero-shot", D.zero, "none", f3(D.zc.sec_per_review) + " (L4)")}
    ${trow("Llama, best prompt", D.few, "none", f3(D.fc.sec_per_review) + " (L4)")}
    ${trow("Llama + QLoRA", D.qlora, Math.round(D.cost.training_minutes) + " min", f3(D.cost.sec_per_review) + " (A100)", [0, 1])}
  </table>
  <p class="banner light reveal"><b>QLoRA is best; BERT and the best prompt tie.</b> QLoRA leads both by 0.055 macro-F1.</p>
  ${src("95% CI of the lead: 0.045 to 0.065. QLoRA was timed on a different GPU, so its speed is not directly comparable.")}`, NOTES.table);

slide("Comparison", "Exp. 2: fine-tuned models follow the star labels", `
  <div class="split">
    ${chart(["vs AI labels", "vs star labels (same 600)"], [{ name: "Fine-tuned BERT", cls: "grey", values: [+D.bAI.macro_f1, +D.bStar.macro_f1] }, { name: "Best prompt", cls: "ink", values: [+D.fewAI.macro_f1, +D.fewStar.macro_f1] }, { name: "QLoRA", cls: "red", values: [+D.qAI.macro_f1, +D.qStar.macro_f1] }], 0)}
    <div>
      <p class="callout reveal">The ranking flips<b>${f2(D.fewAI.macro_f1)} vs ${f2(D.qStar.macro_f1)}</b></p>
      ${bullets([`Against Claude's labels the prompted model is first (${f2(D.fewAI.macro_f1)})`, `Against the stars of the same reviews, QLoRA is first (${f2(D.qStar.macro_f1)})`, "Training on stars teaches the star convention"])}
    </div>
  </div>
  ${src("Macro-F1 on the 600 Experiment 2 reviews")}`, NOTES.exp2);

slide("Conclusions", "Conclusions: how much does training buy you?", `
  <div class="cards three big reveal">
    <div class="card hot"><h3>${f3(D.qlora.macro_f1)}</h3><p><b>Llama + QLoRA</b></p><p>0.5% of weights trained</p></div>
    <div class="card"><h3>${f3(D.bert.macro_f1)}</h3><p><b>Fine-tuned BERT</b></p><p>about ${D.bertFaster}× faster than the prompt</p></div>
    <div class="card"><h3>${f3(D.few.macro_f1)}</h3><p><b>Best prompt</b></p><p>no training at all</p></div>
  </div>
  <p class="banner light reveal"><b>Neutral is the hardest class for every method</b> (F1 ${f2(Math.min(...D.neuF1))} to ${f2(Math.max(...D.neuF1))}), mostly confused with Negative. Part of that is label noise: Claude agrees with the star labels at only 0.75 macro-F1.</p>
  ${src("Test macro-F1")}`, NOTES.end);

slide("References", "References", `
  <ol class="refs reveal">
    <li>Y. Hou, J. Li, Z. He, A. Yan, X. Chen, and J. McAuley, "Bridging language and items for retrieval and recommendation," arXiv:2403.03952, 2024. (Amazon Reviews 2023)</li>
    <li>J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, "BERT: Pre-training of deep bidirectional transformers for language understanding," in Proc. NAACL-HLT, 2019.</li>
    <li>A. Grattafiori et al., "The Llama 3 herd of models," arXiv:2407.21783, 2024. Model: meta-llama/Llama-3.1-8B-Instruct, Hugging Face.</li>
    <li>T. Dettmers, A. Pagnoni, A. Holtzman, and L. Zettlemoyer, "QLoRA: Efficient finetuning of quantized LLMs," in Proc. NeurIPS, 2023.</li>
    <li>E. J. Hu et al., "LoRA: Low-rank adaptation of large language models," in Proc. ICLR, 2022.</li>
  </ol>`, "Not presented. Backup for questions.");

// ---------- page ----------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ReviewLens: Sentiment Classification of E-Commerce Product Reviews</title>
<!-- Fonts load from Google; offline the deck falls back to Helvetica/Arial and still fits -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;800&family=Nunito:wght@400;700&display=swap">
<style>
/* === THEME (Swiss Modern: white, black, one red accent) === */
:root {
  --ink: #111; --paper: #fff; --red: #ff3300; --grey: #c8c8c8; --mute: #6b6b6b; --wash: #f3f3f1; --tint: #ffe9e2;
  --font-display: 'Archivo', 'Helvetica Neue', Arial, sans-serif;
  --font-body: 'Nunito', 'Helvetica Neue', Arial, sans-serif;
  --stage-bg: #111; --slide-bg: #fff;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
* { margin: 0; padding: 0; box-sizing: border-box; }

/* === FIXED 16:9 STAGE (frontend-slides viewport-base.css, in full) === */
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--stage-bg, #000); }
.deck-viewport { position: fixed; inset: 0; overflow: hidden; background: var(--stage-bg, #000); }
.deck-stage { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; transform-origin: 0 0; background: var(--slide-bg, #fff); }
.slide { position: absolute; inset: 0; width: 1920px; height: 1080px; overflow: hidden; display: block; visibility: hidden; opacity: 0; pointer-events: none; background: var(--slide-bg, #fff); }
.slide.active, .slide.visible { visibility: visible; opacity: 1; pointer-events: auto; z-index: 1; }
img, video, canvas, svg { max-width: 100%; max-height: 100%; }
.deck-controls { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 1000; }
@media print {
  html, body { width: 1920px; height: auto; overflow: visible; background: #fff; }
  .deck-viewport { position: static; overflow: visible; background: #fff; }
  .deck-stage { position: static; width: auto; height: auto; transform: none !important; background: none; }
  .slide { position: relative; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; width: 1920px; height: 1080px; break-after: page; page-break-after: always; }
  .slide:last-child { break-after: auto; page-break-after: auto; }
  .deck-controls, .progress, .notes { display: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .bar { transform: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.2s !important; }
}

/* === ANIMATION: one staggered reveal per slide === */
.reveal { opacity: 0; transform: translateY(26px); transition: opacity .6s var(--ease), transform .6s var(--ease); }
.slide.visible .reveal { opacity: 1; transform: none; }
.slide.visible .body > .reveal:nth-child(1), .slide.visible .split > :nth-child(1) { transition-delay: .12s; }
.slide.visible .body > .reveal:nth-child(2), .slide.visible .split > :nth-child(2) .reveal, .slide.visible .split > .reveal:nth-child(2) { transition-delay: .26s; }
.slide.visible .body > .reveal:nth-child(3) { transition-delay: .4s; }

/* === SLIDE FRAME === */
.slide { font-family: var(--font-body); color: var(--ink); font-size: 40px; line-height: 1.3; padding: 150px 110px 0; }
.chrome { position: absolute; top: 56px; left: 110px; right: 110px; display: flex; justify-content: space-between; padding-top: 18px; border-top: 3px solid var(--ink);
  font: 500 22px var(--font-display); letter-spacing: .12em; text-transform: uppercase; }
.chrome i { display: inline-block; width: 18px; height: 18px; background: var(--red); margin-right: 14px; vertical-align: -1px; }
.title { font: 800 60px/1.1 var(--font-display); letter-spacing: -.01em; max-width: 1560px; min-height: 132px; }
.body { margin-top: 44px; }
.source { position: absolute; left: 110px; bottom: 50px; font-size: 24px; color: var(--mute); }
.slide::after { content: attr(data-n); position: absolute; right: 110px; bottom: 56px; font: 500 22px var(--font-display); color: var(--mute); }
small { display: block; font: 500 21px var(--font-display); letter-spacing: .1em; text-transform: uppercase; color: var(--mute); margin-bottom: 10px; }
h3 { font: 800 38px/1.15 var(--font-display); }

/* === COMPONENTS === */
.cards { display: grid; gap: 40px; }
.cards.three { grid-template-columns: repeat(3, 1fr); } .cards.two { grid-template-columns: repeat(2, 1fr); }
.card { border-top: 8px solid var(--ink); padding-top: 26px; min-height: 300px; }
.card.hot { border-color: var(--red); } .card.hot h3 { color: var(--red); }
.card h3 { margin-bottom: 18px; font-size: 44px; } .card p { font-size: 40px; }
.cards.big .card h3 { font-size: 120px; line-height: 1; letter-spacing: -.02em; margin-bottom: 26px; }
.cards.big .card p + p { color: var(--mute); font-size: 32px; margin-top: 12px; }
.banner { margin-top: 56px; background: var(--ink); color: #fff; font: 800 40px var(--font-display); padding: 34px 44px; }
.banner.light { background: var(--wash); color: var(--ink); font: 400 38px/1.4 var(--font-body); }
.funnel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
.funnel > div { border-top: 8px solid var(--ink); padding: 26px 30px 0 0; min-height: 250px; position: relative; }
.funnel > div + div { padding-left: 30px; border-left: 2px solid var(--grey); }
.funnel b { display: block; font: 800 92px/1 var(--font-display); letter-spacing: -.02em; margin-bottom: 18px; }
.funnel span { font-size: 34px; } .funnel .hot { border-top-color: var(--red); } .funnel .hot b { color: var(--red); }
.row { display: flex; gap: 28px; margin-top: 60px; }
.chip { background: var(--wash); padding: 24px 32px; font: 800 36px var(--font-display); min-width: 240px; } .chip.wide { flex: 1; }
.flow { display: flex; align-items: stretch; gap: 26px; }
.flow > div { flex: 1; background: var(--wash); padding: 34px 30px; font-size: 36px; display: flex; flex-direction: column; justify-content: center; min-height: 230px; }
.flow > b { align-self: center; font-size: 48px; color: var(--mute); }
.flow .strong { font: 800 34px var(--font-display); flex: 1.5; } .flow .strong small { margin: 14px 0 0; text-transform: none; letter-spacing: 0; font-size: 24px; }
.flow .hot { background: var(--ink); color: #fff; font: 800 34px/1.3 var(--font-display); }
.split { display: grid; grid-template-columns: 1080px 1fr; gap: 80px; align-items: start; } .split.even { grid-template-columns: 1fr 1fr; }
.points { list-style: none; } .points li { font-size: 40px; padding: 22px 0; border-top: 2px solid var(--grey); } .points li:first-child { border-top: 3px solid var(--ink); }
.callout { background: var(--tint); border-left: 10px solid var(--red); padding: 24px 30px; font: 500 24px var(--font-display); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 40px; }
.callout b { display: block; font: 800 60px/1.1 var(--font-display); letter-spacing: -.01em; color: var(--red); text-transform: none; margin-top: 6px; }
.prompt > div { background: var(--wash); padding: 24px 32px; font-size: 38px; margin-bottom: 20px; }
.prompt .dashed { background: var(--tint); border: 3px dashed var(--red); } .prompt .hot { background: var(--ink); color: #fff; font: 800 44px var(--font-display); } .prompt .hot small { color: var(--grey); }
.model { background: var(--wash); padding: 44px 48px; } .model h3 { font-size: 46px; } .model > p { margin-top: 8px; }
.adapter { background: var(--red); color: #fff; padding: 34px 38px; margin: 36px 0 30px; width: 76%; } .model .io { color: var(--mute); font-size: 32px; }

/* === additions for the team-deck content === */
.cards.compact .card { min-height: 0; } .cards.compact .card p { font-size: 34px; } .cards.gap { margin-top: 56px; }
.chip.quote { font: 400 italic 32px/1.3 var(--font-body); } .chip.quote small { font-style: normal; color: var(--red); }
.row { margin-top: 44px; } .banner { margin-top: 44px; }
.funnel small { margin-bottom: 14px; } .funnel b { font-size: 76px; } .funnel span { font-size: 30px; display: block; }
.flow.steps > div { min-height: 200px; font-size: 44px; } .flow.steps small:first-child { margin: 0 0 8px; text-transform: uppercase; letter-spacing: .1em; font-size: 21px; color: var(--red); }
.split .matrix h3 { font-size: 28px; margin-bottom: 10px; } .split .matrix td { font-size: 34px; height: 76px; } .split .matrix th { font-size: 24px; padding: 8px 12px; }
.matrix + .callout { margin: 30px 0 18px; } .prf + .aside { margin-top: 24px; }
.prf h3 { font-size: 28px; margin-bottom: 10px; } .prf td, .prf th { font-size: 30px; padding: 12px 8px; text-align: center; border-bottom: 2px solid var(--grey); } .prf th:first-child { text-align: left; }
.prf tr:first-child th { font: 500 20px var(--font-display); letter-spacing: .08em; text-transform: uppercase; border-bottom: 3px solid var(--ink); } .prf td.hot { background: var(--tint); color: var(--red); font-weight: 800; }
.prf.setup td, .prf.setup th { text-align: left; font-size: 28px; padding: 13px 10px; } .prf.setup tr:first-child th { font: 800 28px var(--font-body); letter-spacing: 0; text-transform: none; border-bottom: 2px solid var(--grey); }
.prf.setup tr.hot th, .prf.setup tr.hot td { background: var(--tint); color: var(--red); font-weight: 800; } .prf.setup + .aside { margin-top: 24px; }
.prf + .callout { margin: 30px 0 18px; } svg .v { font: 800 30px var(--font-display); } svg .c { font: 500 28px var(--font-display); } .aside { font-size: 30px; color: var(--mute); }
.hbars { display: flex; flex-direction: column; gap: 16px; } .hbars > div { display: flex; align-items: center; gap: 22px; }
.hbars span { width: 420px; text-align: right; font-size: 30px; } .hbars > div > div { flex: 1; }
.hbars i { display: block; font: 800 28px var(--font-display); color: #fff; text-align: right; padding: 10px 14px; }
.title { min-height: 80px; }

/* === BAR CHART (0–1 axis; plot height = 1.0) === */
.plot { display: flex; align-items: flex-end; gap: 0; height: 520px; border-bottom: 3px solid var(--ink); padding-top: 60px; }
.group { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; position: relative; }
.group.focus::before { content: ""; position: absolute; inset: -60px 14px -64px; background: var(--tint); }
.bars { height: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 12px; position: relative; }
.bar { width: 86px; position: relative; transform: scaleY(0); transform-origin: bottom; transition: transform .9s var(--ease) .3s; }
.slide.visible .bar { transform: scaleY(1); }
.bar span { position: absolute; top: -44px; left: -20px; right: -20px; text-align: center; font: 800 30px var(--font-display); }
.grey { background: var(--grey); } .ink { background: var(--ink); } .red { background: var(--red); }
.cat { position: absolute; left: 0; right: 0; bottom: -56px; text-align: center; font: 500 32px var(--font-display); }
.legend { margin-top: 90px; display: flex; gap: 48px; font-size: 32px; } .legend i { display: inline-block; width: 26px; height: 26px; margin-right: 12px; vertical-align: -3px; }

/* === TABLES === */
table { border-collapse: collapse; width: 100%; }
.matrix h3 { margin-bottom: 24px; }
.matrix th { font: 800 30px var(--font-display); padding: 14px 18px; text-align: left; } .matrix tr:first-child th { text-align: center; }
.matrix td { font: 800 44px var(--font-display); text-align: center; height: 112px; border: 4px solid #fff; width: 22%; }
.matrix td.hit { outline: 8px solid var(--red); outline-offset: -6px; }
.results th, .results td { padding: 30px 20px; font-size: 40px; text-align: center; border-bottom: 2px solid var(--grey); }
.results th { font-family: var(--font-display); font-weight: 800; } .results th:first-child { text-align: left; }
.results tr:first-child th { border-bottom: 4px solid var(--ink); font-size: 26px; letter-spacing: .08em; text-transform: uppercase; }
.results td.hot { background: var(--tint); color: var(--red); font: 800 44px var(--font-display); }
.refs { padding-left: 50px; } .refs li { font-size: 30px; margin-bottom: 24px; max-width: 1560px; }

/* === DECK CHROME (outside the stage) === */
.progress { position: fixed; left: 0; bottom: 0; height: 5px; background: var(--red); z-index: 1000; transition: width .3s; }
.notes { display: none; position: absolute; left: 0; right: 0; bottom: 0; z-index: 5; background: rgba(17,17,17,.94); color: #fff; padding: 30px 110px; font-size: 28px; line-height: 1.4; }
body.show-notes .notes { display: block; }
body.editing [contenteditable]:hover { outline: 3px dashed var(--red); outline-offset: 6px; }
.edit-toggle { position: fixed; top: 14px; left: 14px; z-index: 10001; opacity: 0; pointer-events: none; transition: opacity .3s; border: 0; background: var(--red); color: #fff; font: 700 14px sans-serif; padding: 8px 12px; cursor: pointer; }
.edit-toggle.show, .edit-toggle.active { opacity: 1; pointer-events: auto; }
.edit-hotzone { position: fixed; top: 0; left: 0; width: 80px; height: 80px; z-index: 10000; }
</style>
</head>
<body>
<div class="edit-hotzone"></div>
<button class="edit-toggle" id="editToggle" title="Edit mode (E)">Edit text</button>
<div class="deck-viewport"><main class="deck-stage" id="deckStage">
${slides.join("\n")}
</main></div>
<div class="progress" id="progress"></div>
<script>
/* === SLIDE CONTROLLER: arrows / space / page keys, wheel, swipe, #n in the URL === */
class SlidePresentation {
  constructor() {
    this.slides = [...document.querySelectorAll('.slide')];
    this.stage = document.getElementById('deckStage');
    this.slides.forEach((s, i) => { s.dataset.n = i + 1; });
    const scale = () => {
      const f = Math.min(innerWidth / 1920, innerHeight / 1080);
      this.stage.style.transform = 'translate(' + (innerWidth - 1920 * f) / 2 + 'px,' + (innerHeight - 1080 * f) / 2 + 'px) scale(' + f + ')';
    };
    scale(); addEventListener('resize', scale);
    addEventListener('keydown', (e) => {
      if (e.target.isContentEditable) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); this.show(this.i + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); this.show(this.i - 1); }
      else if (e.key === 'Home') this.show(0);
      else if (e.key === 'End') this.show(this.slides.length - 1);
      else if (e.key === 'n' || e.key === 'N') document.body.classList.toggle('show-notes');
    });
    let last = 0;
    addEventListener('wheel', (e) => { const t = Date.now(); if (t - last < 500 || Math.abs(e.deltaY) < 20) return; last = t; this.show(this.i + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
    let x0 = null;
    addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) this.show(this.i + (dx < 0 ? 1 : -1)); x0 = null; });
    addEventListener('hashchange', () => this.show((parseInt(location.hash.slice(1)) || 1) - 1));
    this.show((parseInt(location.hash.slice(1)) || 1) - 1);
  }
  show(i) {
    this.i = Math.max(0, Math.min(i, this.slides.length - 1));
    this.slides.forEach((s, k) => { s.classList.toggle('active', k === this.i); s.classList.toggle('visible', k === this.i); });
    document.getElementById('progress').style.width = (100 * (this.i + 1) / this.slides.length) + '%';
    history.replaceState(null, '', '#' + (this.i + 1));
  }
}
new SlidePresentation();

/* === INLINE EDITING: E or top-left corner toggles; Ctrl/Cmd+S downloads the edited file === */
const editor = {
  isActive: false,
  toggleEditMode() {
    this.isActive = !this.isActive;
    document.body.classList.toggle('editing', this.isActive);
    editToggle.classList.toggle('active', this.isActive);
    editToggle.textContent = this.isActive ? 'Editing: Ctrl+S saves a copy, E exits' : 'Edit text';
    document.querySelectorAll('.slide h1,.slide h2,.slide h3,.slide p,.slide li,.slide td,.slide th,.slide small,.slide span').forEach((el) => {
      if (this.isActive) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable');
    });
  },
};
const editToggle = document.getElementById('editToggle'), hotzone = document.querySelector('.edit-hotzone');
let hideTimeout = null;
const hideSoon = () => { hideTimeout = setTimeout(() => { if (!editor.isActive) editToggle.classList.remove('show'); }, 400); };
hotzone.addEventListener('mouseenter', () => { clearTimeout(hideTimeout); editToggle.classList.add('show'); });
hotzone.addEventListener('mouseleave', hideSoon);
editToggle.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
editToggle.addEventListener('mouseleave', hideSoon);
editToggle.addEventListener('click', () => editor.toggleEditMode());
document.addEventListener('keydown', (e) => {
  if ((e.key === 'e' || e.key === 'E') && !e.target.isContentEditable && !e.metaKey && !e.ctrlKey) editor.toggleEditMode();
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    const wasActive = editor.isActive; if (wasActive) editor.toggleEditMode();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['<!DOCTYPE html>\\n' + document.documentElement.outerHTML], { type: 'text/html' }));
    a.download = 'ReviewLens_Presentation.html'; a.click();
    if (wasActive) editor.toggleEditMode();
  }
});
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log("wrote", OUT, slides.length, "slides");

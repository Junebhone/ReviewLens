// Data and speaker notes shared by build_deck.js (PowerPoint) and build_web.js (HTML).
// Everything is read from the committed result files, so the two decks cannot drift apart.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
function csv(rel) {
  const [head, ...rows] = fs.readFileSync(path.join(ROOT, rel), "utf8").trim().split(/\r?\n/).map((l) => l.split(","));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const byName = (rows) => Object.fromEntries(rows.map((r) => [r.setting, r]));
const Q = byName(csv("quoc_llama_prompting/results/results_summary.csv"));
const J = byName(csv("jn_llama_qlora/results/results_summary.csv"));
const B = byName(csv("longqi_bert/results/results_summary.csv"));
const FEW = "few-shot k=5/class + definitions"; // Dinh's final prompt design
const zero = Q["Test — zero-shot"], few = Q[`Test — ${FEW}`], qlora = J["QLoRA — test"], bert = B["BERT — test"], bertVal = B["BERT — val"];
const fewAI = Q[`Exp2 — ${FEW} vs AI labels`], fewStar = Q[`Exp2 — ${FEW} vs star labels (same 600)`];
const qAI = J["QLoRA — Exp2 vs AI labels"], qStar = J["QLoRA — Exp2 vs star labels (same 600)"];
const bAI = B["BERT — Exp2 vs AI labels"], bStar = B["BERT — Exp2 vs star labels (same 600)"];
for (const r of [zero, few, qlora, bert, bertVal, fewAI, fewStar, qAI, qStar, bAI, bStar]) if (!r) throw new Error("a results row is missing");
const f2 = (x) => Number(x).toFixed(2), f3 = (x) => Number(x).toFixed(3), pct = (x) => Math.round(100 * x);
const LABELS = ["Negative", "Neutral", "Positive"];
const f1s = (r) => [...LABELS.map((l) => Number(r[l + "_f1"])), Number(r.macro_f1)];
function cmPct(rel) { // confusion matrix as row percentages (course guideline: percentages, not counts)
  return csv(rel).map((r) => {
    const v = LABELS.map((l) => Number(r[l])), tot = v.reduce((a, b) => a + b, 0);
    return v.map((x) => Math.round((100 * x) / tot));
  });
}
const cmBert = cmPct("longqi_bert/results/cm_test.csv");
const cmFew = cmPct("quoc_llama_prompting/results/cm_test_def_few_shot_k5.csv");
const cmQ = cmPct("jn_llama_qlora/results/cm_test.csv");
const cost = csv("jn_llama_qlora/results/inference_cost.csv")[0];
const bcost = csv("longqi_bert/results/inference_cost.csv")[0];
const qc = byName(csv("quoc_llama_prompting/results/inference_cost.csv")), zc = qc["zero-shot"], fc = qc[FEW];
if (!zc || !fc) throw new Error("a prompting cost row is missing");
const qVal = J["QLoRA — val (600)"];
// QLoRA training log: validation loss at each evaluation, and the mean training loss over the steps before it
const tinfo = JSON.parse(fs.readFileSync(path.join(ROOT, "jn_llama_qlora/results/train_info.json"), "utf8"));
const evals = tinfo.log.filter((e) => "eval_loss" in e), trains = tinfo.log.filter((e) => "loss" in e);
const lossCurve = evals.map((e, i) => {
  const w = trains.filter((t) => t.step > (i ? evals[i - 1].step : 0) && t.step <= e.step);
  return { step: e.step, val: e.eval_loss, train: w.reduce((a, t) => a + t.loss, 0) / w.length };
});
// QLoRA run: where and how long. [label, value, highlighted on the slide]
const setup = [
  ["Machine", "Google Colab Pro", false],
  ["GPU", "NVIDIA A100, 80 GB", true],
  ["Training time", `${Math.round(cost.training_minutes)} min (1 epoch, 2,500 steps)`, true],
  ["Trainable weights", "41.9 M of 8.07 B (0.52%)", false],
  ["Inference time", `${f3(cost.sec_per_review)} s per review`, false],
  ["Validation macro-F1", `${f3(qVal.macro_f1)} (600 reviews)`, false],
];
if (!/A100.*80GB/.test(cost.gpu_training)) throw new Error("GPU in inference_cost.csv is not the A100 the slide names");
const binfo = JSON.parse(fs.readFileSync(path.join(ROOT, "longqi_bert/results/train_info.json"), "utf8"));
const tok = (c) => Math.round(c.prompt_tokens_mean).toLocaleString("en-US");
const slower = (fc.sec_per_review / zc.sec_per_review).toFixed(1);               // best prompt vs zero-shot
const bertFaster = Math.round(fc.sec_per_review / bcost.sec_per_review / 10) * 10; // BERT vs best prompt, both on an L4
const neuF1 = [bert, few, qlora].map((r) => Number(r.Neutral_f1));
// speaker notes, shared wording for both decks
const NOTES = {
  // Longqi's own speaker notes, from docs/slides/Longqi_BERT_Experiment_Slides.pptx
  bert1: "[~30 s]\nMy method fine-tunes bert-base-uncased for three-class sentiment classification. I tokenize each review and cap the input at 384 tokens; only 0.18 percent of reviews are longer than that. The model trains for three epochs on the same 40,000-review split used by the team, and I select the checkpoint with the best validation macro-F1. On an NVIDIA L4, the full training run took about 16.9 minutes.",
  bert2: "[~35 s]\nBERT produces three logits from the CLS representation. Hugging Face Trainer applies the standard unweighted cross-entropy loss. I did not add class weights because the training split is balanced across Negative, Neutral, and Positive. AdamW uses a learning rate of 2e-5, weight decay of 0.01, and 750 warmup steps. I evaluate and save at the end of every epoch, then reload the checkpoint with the highest validation macro-F1. The notebook can also resume from the last checkpoint if Colab disconnects.",
  bert3: "[~40 s]\nThe model is stable from validation to test: macro-F1 moves from 0.796 to 0.783. Positive is the strongest class at 0.880 F1, and Negative is also solid. Neutral remains the hardest class at 0.692 F1. The confusion matrix shows the main error pattern: about 21 percent of true Neutral reviews are predicted as Negative. That is the class I would target first with more data or a better objective.",
  bert4: "[~35 s]\nFor Experiment 2, I evaluated the trained BERT model on 600 additional reviews. Claude Haiku labelled the text without seeing the star rating. BERT reaches 0.803 macro-F1 against those AI labels and 0.788 against the original star labels for the same reviews, a difference of only 0.015. Since the AI labels agree with the stars at 0.746, this suggests BERT is fairly stable even when the label source changes.",
  qloraMethod: `SPEAKER: JN. ~60 s.\nSame Llama 3.1 8B and exactly the same zero-shot prompt as Dinh's baseline, so the only difference is the fine-tuning. The base model is loaded in 4-bit and frozen; small low-rank adapter matrices are added to the attention and MLP projections and only those are trained: 42 million of 8 billion weights. The target is just the label, so the loss is computed on the label only. One epoch over the 40,000 training reviews took ${Math.round(cost.training_minutes)} minutes on one A100.`,
  qloraTrain: `SPEAKER: JN. ~45 s.\nI trained on Google Colab Pro with one NVIDIA A100 GPU with 80 GB of memory. One epoch over the 40,000 training reviews is 2,500 steps and took ${Math.round(cost.training_minutes)} minutes in a single uninterrupted run. Inference then takes ${f3(cost.sec_per_review)} seconds per review on the same GPU. Training loss and validation loss fall together and the validation loss is still going down at the end (${f3(lossCurve[0].val)} at step 500, ${f3(lossCurve[lossCurve.length - 1].val)} at step 2,500), so there is no sign of overfitting. Before touching the test set I checked the model on the same 600 validation reviews Dinh used to choose his prompt: macro-F1 ${f3(qVal.macro_f1)}. The settings were fixed in advance; nothing was tuned on the test set.`,
  qloraRes: `SPEAKER: JN. ~60 s.\nAgainst the best prompt, QLoRA is better on every class. The largest gain is Neutral, F1 ${f2(few.Neutral_f1)} to ${f2(qlora.Neutral_f1)}: Neutral recall rises from ${pct(few.Neutral_recall)}% to ${pct(qlora.Neutral_recall)}%. Negative recall drops a little, ${pct(few.Negative_recall)}% to ${pct(qlora.Negative_recall)}%, but Negative precision rises from ${f2(few.Negative_precision)} to ${f2(qlora.Negative_precision)}: the model stops calling Neutral reviews Negative. In the confusion matrix, each row is a true class and sums to 100%: Neutral reviews predicted Negative fall from ${cmFew[1][0]}% to ${cmQ[1][0]}%. On macro-F1 the gain over the best prompt is 0.055 (95% bootstrap interval 0.045 to 0.065). Because QLoRA uses the zero-shot prompt, the direct effect of fine-tuning is zero-shot ${f2(zero.macro_f1)} to QLoRA ${f2(qlora.macro_f1)}. Every one of the 5,000 outputs was a bare label.`,
  qloraExp2: `SPEAKER: JN. ~45 s.\nI also ran the fine-tuned model on the 600 reviews that Claude labelled from the text alone. Against Claude's labels QLoRA scores ${f3(qAI.macro_f1)} macro-F1; against the star labels of the same reviews, ${f3(qStar.macro_f1)}. So unlike the prompted model, it agrees about equally with both. Against Claude's labels its Negative precision is ${f2(qAI.Negative_precision)} but its Negative recall only ${f2(qAI.Negative_recall)}: reviews that Claude reads as Negative but that carry three stars, QLoRA calls Neutral, which is the star convention it was trained on.`,
  table: `SPEAKER: JN. ~60 s.\nHighlighted cells are the ones to talk about. QLoRA has the best macro-F1 and the best Neutral F1. BERT and the best prompt reach the same macro-F1: a paired comparison on the 5,000 test reviews finds no difference (95% interval −0.011 to +0.012). They differ in cost: BERT trains in ${Math.round(bcost.training_minutes)} minutes and is about ${bertFaster} times faster per review than the long few-shot prompt, both on an L4. QLoRA costs ${Math.round(cost.training_minutes)} minutes of training once. QLoRA was timed on an A100, so compare its speed only roughly.`,
  exp2: `SPEAKER: JN. ~60 s.\nSame 600 reviews scored two ways. Against Claude's labels the prompted model scores ${f2(fewAI.macro_f1)}, QLoRA ${f2(qAI.macro_f1)} and BERT ${f2(bAI.macro_f1)}. Against the star labels of the same reviews, QLoRA scores ${f2(qStar.macro_f1)} and the other two ${f2(fewStar.macro_f1)}. The fine-tuned models were trained on star labels, so they learned the star convention; the prompted model judges the text much as Claude does. Claude itself agrees with the stars at only 0.75 macro-F1, mostly because 3-star reviews often read as negative. So part of the error against star labels is label noise, and the ${f2(fewAI.macro_f1)} is agreement between two language models, not a score against ground truth.`,
  end: `SPEAKER: JN. ~45 s, then leave this slide up for Q&A.\nThree takeaways. One: fine-tuning half a percent of Llama's weights gives the best result, ${f2(qlora.macro_f1)} macro-F1, against ${f2(bert.macro_f1)} for both fine-tuned BERT and the best prompt. Two: Neutral is the hardest class for every method, and it is mostly confused with Negative. Three: the label source matters; star labels are noisy for 3-star reviews, and each model agrees most with the labels it resembles. For a seller, BERT is the cheap option: the same macro-F1 as the best prompt at a fraction of the cost per review.`,
};
module.exports = { setup, qVal, lossCurve, zero, few, qlora, bert, bertVal, fewAI, fewStar, qAI, qStar, bAI, bStar, f2, f3, pct, LABELS, f1s, cmBert, cmFew, cmQ, cost, bcost, zc, fc, binfo, tok, slower, bertFaster, neuF1, NOTES };

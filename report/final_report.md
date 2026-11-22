# ReviewLens: Sentiment Classification of E-Commerce Product Reviews

Bhone Kyaw Si Hein, Quoc Cuong Dinh, Longqi Sun

> **Draft status.** Sections 1, 2, 4 and the prompted-Llama parts are written from the proposal and the files in this repo. Anything marked **TODO** is waiting on Longqi's write-up of the BERT results (the numbers are in `longqi_bert/results/`). The prompted-Llama numbers are from the Nov 21 run of the notebook. Dinh's own write-up (`Dinh_ReviewLens_Report_Section.docx`) should replace 3.2 and his parts of section 5 when merged.

## 1. Introduction

Online sellers receive thousands of product reviews, and finding unhappy customers by hand is slow. ReviewLens reads a review and classifies its sentiment as Negative, Neutral or Positive, so a seller can find negative reviews quickly and respond.

We solve this one problem with three methods and compare them on the same data:

1. a fine-tuned pretrained transformer (BERT),
2. a prompted large language model (Llama 3.1 8B Instruct, no training),
3. the same Llama model fine-tuned with QLoRA.

## 2. Dataset and preprocessing

**Source.** Amazon Reviews 2023 (McAuley Lab, UC San Diego), Cell Phones & Accessories category only: 20,812,945 reviews.

**Preprocessing** (shared by all members; `data_prep/prepare_data.py`):

1. Decode HTML entities and remove HTML tags, links, @ mentions and symbols, # symbols and emojis, then collapse whitespace.
2. Keep reviews of 100–300 words: 1,124,898 reviews.
3. Drop duplicate review texts, ignoring case (14,880), leaving 1,110,018.
4. Map stars to gold labels: 1–2 = Negative, 3 = Neutral, 4–5 = Positive.

Tokenization is done by each model's own tokenizer and is not a separate preparation step.

**Class imbalance and sampling.** The eligible reviews are heavily skewed towards Positive, so we draw a uniform random sample from each class to get a balanced set of 50,000.

| Class | Eligible reviews | Sampled |
|---|---|---|
| Positive | 736,540 | 16,666 |
| Negative | 242,651 | 16,667 |
| Neutral | 130,827 | 16,667 |

**Split.** Stratified 80/10/10 with seed 42. All three methods use exactly these files.

| Split | Negative | Neutral | Positive | Total |
|---|---|---|---|---|
| Train | 13,333 | 13,334 | 13,333 | 40,000 |
| Validation | 1,667 | 1,666 | 1,667 | 5,000 |
| Test | 1,667 | 1,667 | 1,666 | 5,000 |

**Experiment 2 set.** A further 200 reviews per class (600 total, disjoint from the 50,000) were labeled by Claude (`claude-haiku-5-5`) through its API in shuffled batches of 10, without showing the star rating. The AI labels are not balanced: 260 Negative, 169 Neutral, 171 Positive. AI labels agree with star labels on 74.8% of the 600 reviews (macro-F1 0.746).

## 3. Methods

### 3.1 Fine-tuned BERT (Longqi Sun)

`bert-base-uncased` with a classification head for 3-class sequence classification, trained with standard cross-entropy loss on the balanced training set.

**TODO (Longqi):** hyperparameters (learning rate, epochs, batch size, max sequence length), how they were chosen on validation, GPU.

### 3.2 Prompted Llama 3.1 8B (Quoc Cuong Dinh)

`Llama-3.1-8B-Instruct` with no task-specific training. The system prompt describes the task and both system and user turns end with: *Return only one label: Positive, Neutral, or Negative.*

The model is loaded in bfloat16 and decoded greedily with at most 8 new tokens.

Prompt designs vary along two axes:

- **Examples:** none (zero-shot, mean prompt length 266 tokens), or k labeled examples per class (k = 1, 2, 3, 5, 7), drawn only from training reviews of at most 150 words and placed before the review as earlier user/assistant turns.
- **Label definitions:** optionally, the system prompt adds a one-line definition of each label (Positive: mainly satisfied; Neutral: mixed or lukewarm, acceptable but with clear drawbacks; Negative: mainly dissatisfied).

Eight designs were scored on the same 600 validation reviews (200 per class). The best zero-shot and best few-shot designs, plus plain zero-shot as a baseline, were then run once on the test set. The better of the two on validation is the final model.

| Validation design | Accuracy | Macro-F1 |
|---|---|---|
| Zero-shot | 0.697 | 0.680 |
| Zero-shot + definitions | 0.745 | 0.747 |
| Few-shot, k = 1 per class | 0.763 | 0.761 |
| Few-shot, k = 2 per class | 0.763 | 0.755 |
| Few-shot, k = 3 per class | 0.780 | 0.777 |
| Few-shot, k = 5 per class | 0.797 | 0.797 |
| Few-shot, k = 7 per class | 0.768 | 0.760 |
| **Few-shot, k = 5 per class + definitions** | **0.798** | **0.800** |

The final design is **few-shot with k = 5 per class plus definitions** (15 examples, mean prompt length 2,874 tokens). Because every design is scored on the same reviews, we compared the final design with each other design in pairs: a 95% bootstrap confidence interval for the macro-F1 difference (2,000 resamples), and an exact McNemar test on accuracy. Only plain few-shot k = 5 cannot be separated from it (difference +0.003, CI −0.007 to +0.013, McNemar p = 1.0), so adding definitions was a tie-break, not a clear improvement. Every other design is significantly worse; k = 7 is 0.040 below the final design (CI +0.014 to +0.065). In a side analysis, four other random draws of the k = 3 examples gave validation macro-F1 from 0.749 to 0.779, so which examples are drawn matters about as much as how many.

**Label extraction.** The output is stripped of whitespace, quotes, punctuation and markdown, lower-cased, and matched exactly against the three labels; if that fails, the first whole-word, case-insensitive label in the output is used; otherwise the prediction is invalid. On the test set the fallback was needed for 518 of 5,000 plain zero-shot outputs and for 4,556 of 5,000 zero-shot + definitions outputs: with definitions and no examples, the model almost always adds an explanation after the label. The label still comes first, so the fallback extracts it. The final few-shot design needed the fallback for only 4 outputs. One output (zero-shot + definitions) was invalid.

### 3.3 Llama 3.1 8B fine-tuned with QLoRA (Bhone Kyaw Si Hein)

The same `Llama-3.1-8B-Instruct` model, loaded in 4-bit precision (NF4, double quantization, bfloat16 compute) with only low-rank adapter weights trained through the Hugging Face PEFT library.

- **Input:** identical to the zero-shot prompt in 3.2, so the only difference from the prompted method is the fine-tuning.
- **Target:** only the label (`Positive`, `Neutral` or `Negative`) followed by the end-of-turn token. Prompt tokens are masked out of the loss.
- **LoRA:** rank 16, alpha 32, dropout 0.05, on all attention and MLP projection layers.
- **Training:** 1 epoch over the 40,000 training reviews, batch size 16, learning rate 2e-4 with cosine decay and 100 warm-up steps, 8-bit paged AdamW.
- **Inference:** greedy decoding, at most 8 new tokens, and the same extraction rule as 3.2.
- **Validation:** checked on the same 600 validation reviews used in 3.2 before running the test set.

**Final run.** The settings above are the ones used. The adapters add 41,943,040 trainable parameters (0.52% of the 8.07 billion in the model). Training took 114.1 minutes on one NVIDIA A100 (80 GB) in Google Colab, in a single uninterrupted run; validation loss fell from 0.241 at step 500 to 0.194 at the end (step 2,500). On the 600 validation reviews the model reached accuracy 0.837 and macro-F1 0.839. All 6,200 generated outputs (validation, test and Experiment 2) were an exact label, so the fallback rule was never needed and no output was invalid.

## 4. Evaluation

We report overall accuracy, per-class precision, recall and F1, and micro- and macro-averaged precision, recall and F1. Macro-F1 is the main comparison metric because it weights the three classes equally. Confusion matrices are used to analyze class-specific errors, not as a performance metric.

- **Experiment 1:** the held-out test set (5,000 reviews, star-based gold labels).
- **Experiment 2:** each final model is run on the 600 AI-labeled reviews and scored against the AI labels, and against the star labels of the same reviews for reference.

Both Llama methods are scored on the extracted discrete labels.

## 5. Results

### 5.1 Experiment 1: test set

| Method | Accuracy | Macro-P | Macro-R | Macro-F1 | Micro-F1 |
|---|---|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO | TODO | TODO |
| Llama, zero-shot | 0.699 | 0.721 | 0.699 | 0.677 | 0.699 |
| Llama, zero-shot + definitions | 0.756 | 0.767 | 0.756 | 0.756 | 0.756 |
| Llama, few-shot (k = 5 + definitions) | 0.782 | 0.789 | 0.782 | 0.783 | 0.782 |
| Llama + QLoRA | 0.837 | 0.841 | 0.837 | 0.838 | 0.837 |

Per-class precision / recall / F1:

| Method | Negative | Neutral | Positive |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, zero-shot | 0.592 / 0.959 / 0.732 | 0.641 / 0.324 / 0.430 | 0.931 / 0.813 / 0.868 |
| Llama, zero-shot + definitions | 0.707 / 0.880 / 0.784 | 0.657 / 0.605 / 0.630 | 0.939 / 0.782 / 0.853 |
| Llama, few-shot (k = 5 + definitions) | 0.737 / 0.846 / 0.788 | 0.688 / 0.664 / 0.675 | 0.943 / 0.836 / 0.886 |
| Llama + QLoRA | 0.838 / 0.814 / 0.826 | 0.739 / 0.800 / 0.768 | 0.946 / 0.896 / 0.920 |

### 5.2 Experiment 2: 600 AI-labeled reviews

| Method | Macro-F1 vs AI labels | Accuracy vs AI labels | Macro-F1 vs star labels |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, few-shot (k = 5 + definitions) | 0.879 | 0.880 | 0.788 |
| Llama + QLoRA | 0.838 | 0.840 | 0.842 |

### 5.3 Cost

| Method | Training time | Inference (s / review) | GPU |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, zero-shot | none | 0.119 | L4 |
| Llama, zero-shot + definitions | none | 0.142 | L4 |
| Llama, few-shot (k = 5 + definitions) | none | 1.131 | L4 |
| Llama + QLoRA | 114.1 min | 0.056 | A100 (80 GB) |

Inference time is measured on 300 test reviews (100 per class) after a warm-up batch. For prompted Llama, three repeated runs agreed within 3%; the table shows the latest run (zero-shot batch size 32, few-shot batch size 8, bfloat16). Timings from different GPUs are not directly comparable.

## 6. Discussion

**Prompted Llama.** Neutral is the hardest class. Plain zero-shot finds only 32% of Neutral reviews; of the 1,667 Neutral test reviews, 1,035 (62%) are predicted Negative. Label definitions alone raise Neutral recall to 60% and macro-F1 from 0.677 to 0.756. Adding 15 examples (k = 5 per class) raises Neutral recall to 66% and macro-F1 to 0.783, significantly better than definitions alone (+0.028, 95% CI +0.019 to +0.037). The cost is about 9.5 times the inference time per review, because the prompt is almost eleven times longer. The final design still predicts 29% of Neutral reviews as Negative, and this is its largest error type (489 of 1,090 test errors). Validation and test agree well: macro-F1 0.800 on validation and 0.783 on test, so choosing among eight designs on 600 reviews did not overfit much.

**Prompted Llama versus BERT.** The final prompted design and fine-tuned BERT reach the same test macro-F1 (0.783 vs 0.783). A paired comparison on the 5,000 test reviews finds no difference: +0.0002, 95% CI −0.011 to +0.012; each model gets about 460 reviews right that the other gets wrong (McNemar p = 0.95). They get there differently. BERT is better on Neutral (F1 0.692 vs 0.675), and the prompted model is better on Negative and Positive. The prompted model needs no training, but BERT is about 380 times faster per review (0.003 vs 1.13 s, both on an L4).

**Star labels versus AI labels.** The prompted model agrees much more with Claude's labels (macro-F1 0.879) than with the star labels of the same 600 reviews (0.788), and Claude itself agrees with the stars only at macro-F1 0.746 (Cohen's kappa 0.62). Both models read many 3-star reviews as Negative; Claude labels 260 of the 600 reviews Negative where the stars give 200. This suggests part of the "error" against star labels is label noise in the stars, especially for 3-star reviews whose text reads as negative. The 0.879 is agreement between two language models that share this tendency, not accuracy against a ground truth.

**Fine-tuned Llama (QLoRA).** Fine-tuning the same model on the 40,000 star-labeled training reviews raises test macro-F1 from 0.783 (best prompt) to 0.838 (paired difference 0.055, 95% CI 0.045 to 0.065). Most of the gain is on Neutral: recall rises from 66% to 80% and Neutral F1 from 0.675 to 0.768, so fine-tuning largely fixes the Neutral-predicted-as-Negative problem of the prompted model. Neutral is still the weakest class. On Experiment 2 the pattern reverses: the fine-tuned model agrees about equally with Claude's labels (macro-F1 0.838) and with the star labels (0.842), while the prompted model agrees far more with Claude (0.879 vs 0.788). This fits a model that has learned the star-label convention it was trained on, including where stars and text disagree. The price is 114 minutes of A100 training; inference uses the short zero-shot prompt, at 0.056 s per review.

**TODO (all):** once BERT results are in — which method wins on macro-F1, how BERT handles Neutral, and the accuracy-versus-cost trade-off across all three.

## 7. Conclusion

**TODO (all).**

## 8. Team contributions

- **Longqi Sun:** fine-tuned BERT.
- **Quoc Cuong Dinh:** prompted Llama 3.1 8B (eight prompt designs: zero-shot and few-shot, with and without label definitions); AI labeling of the 600 Experiment 2 reviews.
- **Bhone Kyaw Si Hein:** Llama 3.1 8B fine-tuned with QLoRA.
- **All members:** data filtering and cleaning, labeling, balanced sampling, the shared split, and this report.

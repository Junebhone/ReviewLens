# ReviewLens: Sentiment Classification of E-Commerce Product Reviews

Bhone Kyaw Si Hein, Quoc Cuong Dinh, Longqi Sun

> **Draft status.** Sections 1, 2, 4 and the prompted-Llama parts are written from the proposal and the files in this repo. Anything marked **TODO** is waiting on results that do not exist yet (BERT). Dinh's own write-up (`Dinh_ReviewLens_Report_Section.docx`) should replace 3.2 and his parts of section 5 when merged.

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

- **Zero-shot:** the review only (mean prompt length 266 tokens).
- **Few-shot:** k labeled examples per class, drawn only from training reviews of at most 150 words, placed before the review as earlier user/assistant turns. k was chosen on 600 validation reviews (200 per class); k = 3 (nine examples, mean prompt length 1,798 tokens) was best.

| Validation setting | Accuracy | Macro-F1 |
|---|---|---|
| Zero-shot | 0.697 | 0.680 |
| Few-shot, k = 1 per class | 0.763 | 0.761 |
| Few-shot, k = 2 per class | 0.763 | 0.755 |
| Few-shot, k = 3 per class | 0.780 | 0.777 |

**Label extraction.** The output is stripped of whitespace, quotes, punctuation and markdown, lower-cased, and matched exactly against the three labels; if that fails, the first whole-word, case-insensitive label in the output is used; otherwise the prediction is invalid. On the test set the fallback was needed for 518 of 5,000 zero-shot outputs (the model added an explanation after the label) and for none of the few-shot outputs. No output was invalid.

### 3.3 Llama 3.1 8B fine-tuned with QLoRA (Bhone Kyaw Si Hein)

The same `Llama-3.1-8B-Instruct` model, loaded in 4-bit precision (NF4, double quantization, bfloat16 compute) with only low-rank adapter weights trained through the Hugging Face PEFT library.

- **Input:** identical to the zero-shot prompt in 3.2, so the only difference from the prompted method is the fine-tuning.
- **Target:** only the label (`Positive`, `Neutral` or `Negative`) followed by the end-of-turn token. Prompt tokens are masked out of the loss.
- **LoRA:** rank 16, alpha 32, dropout 0.05, on all attention and MLP projection layers.
- **Training:** 1 epoch over the 40,000 training reviews, batch size 16, learning rate 2e-4 with cosine decay and 100 warm-up steps, 8-bit paged AdamW.
- **Inference:** greedy decoding, at most 8 new tokens, and the same extraction rule as 3.2.
- **Validation:** checked on the same 600 validation reviews used in 3.2 before running the test set.

**Final run.** The settings above are the ones used. The adapters add 41,943,040 trainable parameters (0.52% of the 8.07 billion in the model). Training took 114.4 minutes on one NVIDIA A100 (80 GB) in Google Colab, in a single uninterrupted run; validation loss fell from 0.244 at step 500 to 0.197 at the end (step 2,500). On the 600 validation reviews the model reached accuracy 0.837 and macro-F1 0.839. All 6,200 generated outputs (validation, test and Experiment 2) were an exact label, so the fallback rule was never needed and no output was invalid.

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
| Llama, few-shot (k = 3) | 0.762 | 0.769 | 0.762 | 0.757 | 0.762 |
| Llama + QLoRA | 0.833 | 0.838 | 0.833 | 0.835 | 0.833 |

Per-class precision / recall / F1:

| Method | Negative | Neutral | Positive |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, zero-shot | 0.592 / 0.959 / 0.732 | 0.641 / 0.324 / 0.430 | 0.931 / 0.813 / 0.868 |
| Llama, few-shot (k = 3) | 0.689 / 0.900 / 0.780 | 0.700 / 0.539 / 0.609 | 0.917 / 0.848 / 0.881 |
| Llama + QLoRA | 0.830 / 0.822 / 0.826 | 0.738 / 0.791 / 0.764 | 0.947 / 0.887 / 0.916 |

### 5.2 Experiment 2: 600 AI-labeled reviews

| Method | Macro-F1 vs AI labels | Accuracy vs AI labels | Macro-F1 vs star labels |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, few-shot (k = 3) | 0.874 | 0.882 | 0.766 |
| Llama + QLoRA | 0.829 | 0.832 | 0.836 |

### 5.3 Cost

| Method | Training time | Inference (s / review) | GPU |
|---|---|---|---|
| BERT (fine-tuned) | TODO | TODO | TODO |
| Llama, zero-shot | none | 0.160 | L4 |
| Llama, few-shot (k = 3) | none | 0.708 | L4 |
| Llama + QLoRA | 114.4 min | 0.056 | A100 (80 GB) |

Inference time is measured on 300 test reviews (100 per class) after a warm-up batch. Timings from different GPUs are not directly comparable.

## 6. Discussion

**Prompted Llama.** Neutral is the hardest class. Zero-shot, the model finds only 32% of Neutral reviews; of the 1,667 Neutral test reviews, 1,035 are predicted Negative. Nine few-shot examples raise Neutral recall to 54% and macro-F1 from 0.677 to 0.757, at about 4.4 times the inference time per review because the prompt is almost seven times longer.

**Star labels versus AI labels.** The prompted model agrees much more with Claude's labels (macro-F1 0.874) than with the star labels of the same 600 reviews (0.766), and Claude itself agrees with the stars only at macro-F1 0.746. This suggests a large part of the "error" against star labels is label noise in the stars, especially for 3-star reviews whose text reads as negative, rather than model mistakes.

**TODO (all):** once BERT and QLoRA results are in — which method wins on macro-F1, whether fine-tuning fixes the Neutral/Negative confusion, whether the fine-tuned models (trained on star labels) agree less with the AI labels than the prompted model does, and the accuracy-versus-cost trade-off.

## 7. Conclusion

**TODO (all).**

## 8. Team contributions

- **Longqi Sun:** fine-tuned BERT.
- **Quoc Cuong Dinh:** prompted Llama 3.1 8B (zero-shot and few-shot); AI labeling of the 600 Experiment 2 reviews.
- **Bhone Kyaw Si Hein:** Llama 3.1 8B fine-tuned with QLoRA.
- **All members:** data filtering and cleaning, labeling, balanced sampling, the shared split, and this report.

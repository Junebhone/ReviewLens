# Prompted Llama 3.1 8B — Quoc Cuong Dinh

Prompting of `Llama-3.1-8B-Instruct` with no training. Eight prompt designs are compared on 600 validation reviews: zero-shot, zero-shot + a one-line definition of each label, few-shot with k = 1, 2, 3, 5, 7 training examples per class, and few-shot k = 5 + definitions. The best zero-shot and best few-shot designs run on the test set (with plain zero-shot as the baseline); the better one is the final model for Experiment 2, error analysis and cost. Files are a copy of Dinh's Drive folder, plus his notebook, sorted into subfolders.

## Results

Final design: **few-shot, k = 5 examples per class + label definitions** (15 examples, mean prompt 2,874 tokens).

| Setting | Val macro-F1 (n=600) | Test macro-F1 | Test Neutral F1 | s / review (L4) |
|---|---|---|---|---|
| Zero-shot | 0.680 | 0.677 | 0.430 | 0.12 |
| Zero-shot + definitions | 0.747 | 0.756 | 0.630 | 0.14 |
| **Few-shot k = 5 + definitions** | **0.800** | **0.783** | **0.675** | **1.13** |

Experiment 2 (600 Claude-labeled reviews): macro-F1 **0.879** against the AI labels, 0.788 against the star labels of the same reviews.

- **Choosing the design.** Validation can't separate the final design from plain few-shot k = 5 (0.800 vs 0.797; difference +0.003, 95% bootstrap CI −0.007 to +0.013, McNemar p = 1.0; see `results/validation_paired_tests.csv`). Definitions were kept as a tie-break. Every other design is significantly worse. k = 7 drops to 0.760, so more examples don't always help.
- **Errors.** 29% of Neutral (3-star) test reviews are predicted Negative, down from 62% zero-shot. This is the largest error type (489 of 1,090 errors).
- **Output format.** With definitions but no examples, 91% of zero-shot outputs add an explanation after the label (the label still comes first, so the fallback rule extracts it). Few-shot outputs are a bare label in 4,996 of 5,000 cases.
- **Timing** is stable to within 3% across three repeated runs (Nov 21).

## Files

| Files | Contents |
|---|---|
| `reviewlens_quoc_llama_prompting_haiku.ipynb` | the notebook: shared data prep (§3), label-extraction rule (§4), prompt designs (§6), design selection on validation (§9) with paired tests (§9.1), test (§10), AI labeling (§11), Experiment 2 (§12), evaluation |
| `results/results_summary.csv/.json`, `results/per_class_metrics.csv` | final metrics: test (each design run on test) and Experiment 2 |
| `results/validation_selection.csv`, `figures/validation_selection.png`, `results/val_vs_test.csv` | all eight designs on 600 validation reviews; validation vs test for the designs run on test |
| `results/validation_paired_tests.csv` | final design vs every other design on validation: macro-F1 difference with 95% bootstrap CI, McNemar test |
| `results/inference_cost.csv` | prompt length and seconds per review for each test design (measured on an L4) |
| `results/cm_*.csv`, `figures/cm_*.png` | confusion matrices (`cm_test_<design>`, `cm_exp2_*`) |
| `outputs/preds_*.csv`, `outputs/raw_*.jsonl` | extracted predictions and raw model outputs, tagged `<split>_<design>` |
| `results/extraction_methods.csv`, `outputs/fallback_outputs_test_*.csv` | how often the exact-match vs whole-word fallback rule was used |
| `prompts/prompt_example_*.txt`, `prompts/few_shot_examples_used.csv` | the prompts, and the examples used by the best few-shot design |
| `figures/prompt_length_hist.png`, `figures/cm_all_settings.png` | prompt-length histograms, all confusion matrices side by side |
| `outputs/misclassified_test_def_few_shot_k5.csv` | errors of the final design, for analysis |
| `outputs/ai_labels_progress_claude-haiku-5-5.jsonl` | Claude labels for the 600 Experiment 2 reviews |

**Not produced by the current notebook.** These files come from the earlier version of the notebook, when the final design was few-shot k = 3, and from a Nov 19 side analysis. They are kept for reference:

- `cm_test_few_shot.*`, `misclassified_test_few_shot.csv`, `*_test_few_shot_k3*`, `*_exp2_few_shot_k3*`: the old k = 3 final design.
- `caveat_*`, `*_val_few_shot_k3_seed*`, `*_val_def_few_shot_k3*`, `*_test_few_shot_k5*`: the side analysis (prompt variants, and four other random draws of the k = 3 examples, which gave validation macro-F1 0.749–0.779). The test run of plain k = 5 was a look at the test set after selection, so it is not part of the main results.

Not here yet: `Dinh_ReviewLens_Report_Section.docx`.

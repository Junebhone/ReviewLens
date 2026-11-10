# Prompted Llama 3.1 8B — Quoc Cuong Dinh

Zero-shot and few-shot prompting of `Llama-3.1-8B-Instruct` with no training. Files are an unchanged copy of Dinh's Drive folder, plus his notebook, sorted into subfolders.

| Files | Contents |
|---|---|
| `reviewlens_quoc_llama_prompting_haiku.ipynb` | the notebook: shared data prep (§3), label-extraction rule (§4), prompting, AI labeling, evaluation |
| `results/results_summary.csv/.json`, `results/per_class_metrics.csv` | final metrics: test (zero-shot, few-shot k=3) and Experiment 2 |
| `results/validation_selection.csv`, `results/val_vs_test.csv` | choosing k on 600 validation reviews |
| `results/inference_cost.csv` | prompt length and seconds per review (measured on an L4) |
| `results/cm_*.csv`, `figures/cm_*.png` | confusion matrices |
| `outputs/preds_*.csv`, `outputs/raw_*.jsonl` | extracted predictions and raw model outputs |
| `results/extraction_methods.csv`, `outputs/fallback_outputs_test_zero_shot.csv` | how often the exact-match vs whole-word fallback rule was used |
| `prompts/prompt_example_*.txt`, `prompts/few_shot_examples_used.csv` | the prompts |
| `figures/prompt_length_hist.png`, `figures/cm_all_settings.png` | prompt-length histogram, all confusion matrices side by side |
| `outputs/misclassified_test_few_shot.csv` | errors for analysis |
| `outputs/ai_labels_progress_claude-haiku-5-5.jsonl` | Claude labels for the 600 Experiment 2 reviews |

Not here yet: `Dinh_ReviewLens_Report_Section.docx`.

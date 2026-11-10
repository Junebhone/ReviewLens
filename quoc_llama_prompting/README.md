# Prompted Llama 3.1 8B — Quoc Cuong Dinh

Zero-shot and few-shot prompting of `Llama-3.1-8B-Instruct` with no training. Files are an unchanged copy of Dinh's Drive folder, plus his notebook.

| Files | Contents |
|---|---|
| `reviewlens_quoc_llama_prompting_haiku.ipynb` | the notebook: shared data prep (§3), label-extraction rule (§4), prompting, AI labeling, evaluation |
| `results_summary.csv/.json`, `per_class_metrics.csv` | final metrics: test (zero-shot, few-shot k=3) and Experiment 2 |
| `validation_selection.csv`, `val_vs_test.csv` | choosing k on 600 validation reviews |
| `inference_cost.csv` | prompt length and seconds per review (measured on an L4) |
| `cm_*.csv/.png` | confusion matrices |
| `preds_*.csv`, `raw_*.jsonl` | extracted predictions and raw model outputs |
| `extraction_methods.csv`, `fallback_outputs_test_zero_shot.csv` | how often the exact-match vs whole-word fallback rule was used |
| `prompt_example_*.txt`, `few_shot_examples_used.csv` | the prompts |
| `misclassified_test_few_shot.csv` | errors for analysis |
| `ai_labels_progress_claude-haiku-5-5.jsonl` | Claude labels for the 600 Experiment 2 reviews |

Not here yet: `Dinh_ReviewLens_Report_Section.docx`.

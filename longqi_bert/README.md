# Fine-tuned BERT — Longqi Sun

Fine-tune `bert-base-uncased` with a 3-class classification head (cross-entropy) on `shared_data/train.csv`, pick settings on `val.csv`, report on `test.csv` and on `ai_labeled_600.csv` (Experiment 2).

Nothing here yet. To line up with the other two methods, please add (in the same `results/`, `outputs/`, `figures/` subfolders they use):

| File | Contents |
|---|---|
| `bert_finetune.ipynb` | training and evaluation notebook |
| `results_summary.csv` | one row per setting: test, Exp2 vs `ai_label`, Exp2 vs `star_label` — same columns as `../quoc_llama_prompting/results/results_summary.csv` |
| `inference_cost.csv` | training time, seconds per review, batch size, GPU name |
| `preds_test.csv`, `preds_exp2.csv` | `review_id`, `pred` |
| `cm_test.csv/.png`, `cm_exp2_vs_ai.csv/.png` | confusion matrices |

`metrics_row()` in `../jn_llama_qlora/qlora_llama.ipynb` (section 2) produces a `results_summary.csv` row in exactly that column order from two lists of labels, if you want to copy it.

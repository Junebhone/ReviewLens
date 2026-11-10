# ReviewLens

Three-class sentiment classification (Negative / Neutral / Positive) of Amazon Cell Phones & Accessories reviews, solved with three methods on the same data. See [the proposal](ReviewLens_Project_Proposal_Revised_2.pdf).

| Method | Owner | Folder | Test macro-F1 | Exp. 2 macro-F1 (vs AI labels) |
|---|---|---|---|---|
| Fine-tuned BERT | Longqi Sun | — | — | — |
| Prompted Llama 3.1 8B (few-shot, k=3) | Quoc Cuong Dinh | [quoc_llama_prompting/](quoc_llama_prompting/) | 0.757 | 0.874 |
| Llama 3.1 8B + QLoRA | Bhone Kyaw Si Hein (JN) | [jn_llama_qlora/](jn_llama_qlora/) | not run yet | not run yet |

## Layout

- `shared_data/` — the shared split (`train.csv` 40,000 / `val.csv` 5,000 / `test.csv` 5,000) and `ai_labeled_600.csv` for Experiment 2. Everyone evaluates on these exact files.
- `quoc_llama_prompting/` — Dinh's results (metrics, predictions, confusion matrices, inference cost).
- `jn_llama_qlora/qlora_llama.ipynb` — QLoRA fine-tuning and evaluation, runs on Google Colab.

## Running the QLoRA notebook

1. Open `jn_llama_qlora/qlora_llama.ipynb` in Colab with a GPU runtime (A100 recommended).
2. Accept the [Llama 3.1 licence](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) and add your Hugging Face token as a Colab secret named `HF_TOKEN`.
3. Make sure the team's `ReviewLens/` Drive folder is at `MyDrive/ReviewLens`, then Run all.

Results are written to `ReviewLens/jn_llama_qlora/` on Drive in the same format as Dinh's (`results_summary.csv`, `inference_cost.csv`, `preds_*.csv`, `cm_*.csv/png`). Copy them into `jn_llama_qlora/` here afterwards.

It uses the same prompt and the same label-extraction rule as the prompted method (exact match, then first whole-word case-insensitive label).

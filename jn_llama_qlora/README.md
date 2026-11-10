# Llama 3.1 8B + QLoRA — Bhone Kyaw Si Hein (JN)

`qlora_llama.ipynb` fine-tunes `Llama-3.1-8B-Instruct` (4-bit base, LoRA adapters via PEFT) to generate one label, using the same prompt and label-extraction rule as the prompted method. Runs on Google Colab with a CUDA GPU; see the first cell for setup.

Run on 2026-11-10 on a Colab A100 (80 GB), full 40,000 training reviews, 114.4 min: test accuracy 0.833 / macro-F1 0.835; Experiment 2 macro-F1 0.829 vs AI labels, 0.836 vs star labels. After a run, copy these from `ReviewLens/jn_llama_qlora/` on Drive into this folder: `results_summary.csv`, `inference_cost.csv`, `train_info.json`, `preds_*.csv`, `cm_*.csv/.png`. Leave `adapter/` and `checkpoints/` on Drive.

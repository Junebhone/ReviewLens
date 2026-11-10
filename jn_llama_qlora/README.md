# Llama 3.1 8B + QLoRA — Bhone Kyaw Si Hein (JN)

`qlora_llama.ipynb` fine-tunes `Llama-3.1-8B-Instruct` (4-bit base, LoRA adapters via PEFT) to generate one label, using the same prompt and label-extraction rule as the prompted method. Runs on Google Colab with a CUDA GPU; see the first cell for setup. The notebook is saved with the outputs of the final run.

**Final run (2026-11-10):** Colab A100 (80 GB), all 40,000 training reviews, 1 epoch, 114.1 min, trained from scratch in one uninterrupted run. Test accuracy 0.837 / macro-F1 0.838; Experiment 2 macro-F1 0.838 vs AI labels, 0.842 vs star labels. All 6,200 outputs were an exact label.

| Files | Contents |
|---|---|
| `qlora_llama.ipynb` | the notebook, with outputs |
| `results/results_summary.csv` | metrics: validation (600), test, Exp2 vs AI labels, Exp2 vs star labels |
| `results/inference_cost.csv` | GPU, training minutes, seconds per review |
| `results/train_info.json` | training settings and the full loss log |
| `results/cm_*.csv`, `figures/cm_*.png` | confusion matrices (test, Exp2 vs AI, Exp2 vs stars) |
| `outputs/preds_*.csv` | per-review raw output, extracted label and extraction method |

The notebook writes these flat into `ReviewLens/jn_llama_qlora/` on Drive; after a run, sort them into the subfolders above. Leave `adapter/` and `checkpoints/` on Drive.

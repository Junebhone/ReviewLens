# Fine-tuned BERT - Longqi Sun

This folder contains the fine-tuned BERT method for ReviewLens. The model is
`bert-base-uncased` with a three-class sequence-classification head trained with
cross-entropy loss on the team's fixed, balanced training split.

## Data

The notebook uses the same committed split as the other two methods:

- `shared_data/train.csv`: 40,000 reviews for training
- `shared_data/val.csv`: 5,000 reviews for model selection
- `shared_data/test.csv`: 5,000 reviews for Experiment 1
- `shared_data/ai_labeled_600.csv`: 600 reviews for Experiment 2

The labels are Negative, Neutral, and Positive. The notebook uses only the
review `text` as model input. Star ratings are not included in the input.

## Training configuration

| Setting | Value |
|---|---:|
| Model | `bert-base-uncased` |
| Maximum sequence length | 384 tokens |
| Learning rate | 2e-5 |
| Epochs | 3 |
| Training batch size | 16 |
| Evaluation batch size | 32 |
| Weight decay | 0.01 |
| Warmup ratio | 0.10 |
| Random seed | 42 |
| GPU | NVIDIA L4 |
| Training time | 16.89 minutes |

The best checkpoint was selected by validation macro-F1. The best validation
macro-F1 was 0.7961 at the end of epoch 3.

## Results

| Evaluation | Accuracy | Macro-F1 |
|---|---:|---:|
| Test set, star labels | 0.7814 | 0.7830 |
| Experiment 2, AI labels | 0.8033 | 0.8030 |
| Experiment 2, star labels | 0.7867 | 0.7882 |

The complete accuracy, precision, recall, F1, class support, and per-class
metrics are in `results/results_summary.csv`.

## Folder layout

```text
longqi_bert/
|-- README.md
|-- bert_finetune.ipynb
|-- results/
|   |-- results_summary.csv
|   |-- inference_cost.csv
|   |-- cm_test.csv
|   |-- cm_exp2_vs_ai.csv
|   |-- cm_exp2_vs_stars.csv
|   |-- token_length_summary.csv
|   |-- training_history.csv
|   `-- train_info.json
|-- outputs/
|   |-- preds_val.csv
|   |-- preds_test.csv
|   `-- preds_exp2.csv
`-- figures/
    |-- cm_test.png
    |-- cm_exp2_vs_ai.png
    `-- cm_exp2_vs_stars.png
```

## Reproduction

1. Open `bert_finetune.ipynb` in Google Colab and select a GPU runtime.
2. Place the four shared CSV files in `MyDrive/NLP/Final_Project/`.
3. Run all cells.

The notebook writes its runtime artifacts flat into
`MyDrive/NLP/Final_Project/longqi_bert/`, matching the team's Drive workflow.
The files in this repository are sorted into `results/`, `outputs/`, and
`figures/` for submission. Model checkpoints and `best_model/` are intentionally
excluded from GitHub because the reported results can be reproduced from the
notebook and shared data.

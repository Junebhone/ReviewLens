"""Shared data preparation for ReviewLens (all members).

Pipeline, as in the proposal:
  1. remove HTML, links, @ mentions/symbols, # symbols and emojis
  2. keep reviews with 100-300 words, drop duplicate texts
  3. label by stars: 1-2 Negative, 3 Neutral, 4-5 Positive
  4. balanced sample of 50,000 (+200 per class for Experiment 2)
  5. stratified 80/10/10 train/val/test split, seed 42

The cleaning and build code is the code that produced shared_data/, lifted out of section 3 of
quoc_llama_prompting/reviewlens_quoc_llama_prompting_haiku.ipynb so it is not tied to one
member's notebook. Needs: pandas, scikit-learn, emoji.

  python prepare_data.py check ../shared_data
      Verify the committed shared files obey every rule above.

  python prepare_data.py build Cell_Phones_and_Accessories.jsonl out_dir
      Rebuild from the raw file (Hugging Face dataset McAuley-Lab/Amazon-Reviews-2023,
      raw/review_categories/Cell_Phones_and_Accessories.jsonl, ~9.3 GB). Write to a new
      folder, never over shared_data/: every reported result uses the committed split.
"""
import hashlib
import html
import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

import emoji
import pandas as pd
from sklearn.model_selection import train_test_split

SEED = 42
MIN_WORDS, MAX_WORDS = 100, 300
LABELS = ['Negative', 'Neutral', 'Positive']
TARGET_PER_CLASS = {'Negative': 16667, 'Neutral': 16667, 'Positive': 16666}
EXTRA_PER_CLASS = 200
RESERVOIR_PER_CLASS = 40000    # uniform random pool per class kept while streaming the file

URL_RE = re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE)
HTML_TAG_RE = re.compile(r"<[^>]+>")
MENTION_RE = re.compile(r"@\w+")
WS_RE = re.compile(r"\s+")


def clean_text(t):
    t = html.unescape(t or "")
    t = HTML_TAG_RE.sub(" ", t)          # <br />, <a ...>
    t = URL_RE.sub(" ", t)               # links
    t = MENTION_RE.sub(" ", t)           # mentions
    t = t.replace("@", " ").replace("#", "")  # leftover @ symbols, # symbols (keep the word)
    t = emoji.replace_emoji(t, replace=" ")   # emojis
    return WS_RE.sub(" ", t).strip()


def rating_to_label(r):
    r = int(round(float(r)))
    return "Negative" if r <= 2 else ("Neutral" if r == 3 else "Positive")


def make_review_id(rec):
    key = f"{rec.get('user_id')}|{rec.get('parent_asin')}|{rec.get('asin')}|{rec.get('timestamp')}"
    return hashlib.md5(key.encode()).hexdigest()[:16]


def build(raw_path, out_dir):
    rng = random.Random(SEED)
    reservoir = {l: [] for l in LABELS}
    n_seen, stats, seen_hashes = Counter(), Counter(), set()

    with open(raw_path, "rb") as f:
        for line in f:
            stats["total"] += 1
            rec = json.loads(line)
            text = rec.get("text") or ""
            n_raw = len(text.split())
            if n_raw < 80 or n_raw > 400:          # cheap pre-filter; exact rule applied below
                continue
            cleaned = clean_text(text)
            wc = len(cleaned.split())
            if not (MIN_WORDS <= wc <= MAX_WORDS):
                continue
            stats["in_word_range"] += 1
            h = hashlib.md5(cleaned.lower().encode()).digest()
            if h in seen_hashes:                   # drop duplicate review texts
                stats["duplicates"] += 1
                continue
            seen_hashes.add(h)

            label = rating_to_label(rec["rating"])
            row = {"review_id": make_review_id(rec), "rating": int(round(float(rec["rating"]))),
                   "label": label, "text": cleaned, "title": clean_text(rec.get("title") or ""),
                   "word_count": wc, "parent_asin": rec.get("parent_asin")}
            # Reservoir sampling: uniform random sample per class with bounded memory
            n_seen[label] += 1
            res = reservoir[label]
            if len(res) < RESERVOIR_PER_CLASS:
                res.append(row)
            else:
                j = rng.randrange(n_seen[label])
                if j < RESERVOIR_PER_CLASS:
                    res[j] = row

    main_parts, extra_parts = [], []
    for label in LABELS:
        need = TARGET_PER_CLASS[label] + EXTRA_PER_CLASS
        pool = reservoir[label]
        assert len(pool) >= need, f"Not enough {label} reviews: {len(pool)} < {need}"
        random.Random(SEED).shuffle(pool)
        main_parts.append(pd.DataFrame(pool[:TARGET_PER_CLASS[label]]))
        extra_parts.append(pd.DataFrame(pool[TARGET_PER_CLASS[label]:need]))
    df_main = pd.concat(main_parts, ignore_index=True)
    df_extra = pd.concat(extra_parts, ignore_index=True)
    assert not set(df_main.review_id) & set(df_extra.review_id)

    train, temp = train_test_split(df_main, test_size=0.20, stratify=df_main["label"], random_state=SEED)
    val, test = train_test_split(temp, test_size=0.50, stratify=temp["label"], random_state=SEED)

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for name, d in [("train", train), ("val", val), ("test", test), ("extra_600", df_extra)]:
        d.reset_index(drop=True).to_csv(out / f"{name}.csv", index=False)
    card = {"seed": SEED, "source": str(raw_path), "word_range": [MIN_WORDS, MAX_WORDS],
            "scan_stats": dict(stats), "eligible_per_class": dict(n_seen),
            "sizes": {"train": len(train), "val": len(val), "test": len(test), "extra": len(df_extra)}}
    (out / "data_card.json").write_text(json.dumps(card, indent=2))
    print(json.dumps(card, indent=2))


def check(data_dir):
    d = Path(data_dir)
    parts = {n: pd.read_csv(d / f'{n}.csv') for n in ['train', 'val', 'test', 'extra_600']}
    allrows = pd.concat(parts.values(), ignore_index=True)

    assert allrows.text.map(clean_text).eq(allrows.text).all(), 'text is not fully cleaned'
    wc = allrows.text.str.split().str.len()
    assert wc.between(MIN_WORDS, MAX_WORDS).all() and wc.eq(allrows.word_count).all(), 'word count outside 100-300'
    assert allrows.rating.map(rating_to_label).eq(allrows.label).all(), 'label does not match star rating'
    assert allrows.review_id.is_unique and allrows.text.is_unique, 'a review appears in more than one split'

    main = pd.concat([parts['train'], parts['val'], parts['test']])
    assert main.label.value_counts().to_dict() == TARGET_PER_CLASS, 'sample is not balanced'
    assert [len(parts[n]) for n in ['train', 'val', 'test']] == [40000, 5000, 5000], 'split is not 80/10/10'
    for n in ['train', 'val', 'test']:
        c = parts[n].label.value_counts()
        assert c.max() - c.min() <= 1, f'{n} is not stratified'
    assert parts['extra_600'].label.value_counts().eq(EXTRA_PER_CLASS).all()

    ai = d / 'ai_labeled_600.csv'
    if ai.exists():
        a = pd.read_csv(ai)
        assert set(a.review_id) == set(parts['extra_600'].review_id), 'AI-labeled reviews differ from extra_600'
        assert a.ai_label.isin(LABELS).all()
    print(f'OK: {len(allrows)} reviews pass every data-preparation rule')


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('build', 'check'):
        sys.exit(__doc__)
    build(*sys.argv[2:4]) if sys.argv[1] == 'build' else check(sys.argv[2])

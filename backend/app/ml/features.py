import re
import math
import hashlib
from typing import List, Tuple, Dict, Any

def compute_sha256(text: str) -> str:
    """Computes SHA-256 fingerprint for forensic audit trail."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def segment_sentences_with_spans(text: str) -> List[Tuple[str, int, int]]:
    """
    Splits text into sentences while tracking accurate character start and end offsets.
    Essential for Monaco Editor line/span highlighting.
    """
    sentence_regex = re.compile(r'([A-Z0-9][^\.!?\n]*[\.!?]+(?:\s+|$)|[^\n]+(?:\n+|$))')
    spans = []
    
    for match in sentence_regex.finditer(text):
        sentence_str = match.group().strip()
        if not sentence_str:
            continue
        start_char = match.start()
        end_char = match.end()
        spans.append((sentence_str, start_char, end_char))
        
    # Fallback if regex found no punctuation-based sentences
    if not spans and text.strip():
        spans.append((text.strip(), 0, len(text)))
        
    return spans

def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy of character distribution."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    length = len(text)
    entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())
    return round(entropy, 4)

def calculate_burstiness(perplexities: List[float]) -> float:
    """
    Calculates Burstiness: Coefficient of Variation (std_dev / mean) or Fano factor.
    Human text exhibits high burstiness (> 0.45); AI text is uniform (< 0.25).
    """
    if len(perplexities) < 2:
        return 0.20  # Neutral default for single-sentence inputs
    mean = sum(perplexities) / len(perplexities)
    if mean == 0:
        return 0.0
    variance = sum((p - mean) ** 2 for p in perplexities) / (len(perplexities) - 1)
    std_dev = math.sqrt(variance)
    return round(std_dev / mean, 4)

def score_to_color_and_verdict(ai_prob: float) -> Tuple[str, str, str]:
    """
    Maps probability (0.0 - 1.0) to forensic verdict and Monaco heatmap color.
    Colors use dark-theme translucent RGBA tints for premium Monaco highlighting.
    """
    if ai_prob >= 0.70:
        verdict = "likely_ai"
        verdict_label = "Likely AI-Generated"
        color = "rgba(239, 68, 68, 0.28)"  # Soft Crimson
    elif ai_prob <= 0.35:
        verdict = "likely_human"
        verdict_label = "Likely Human-Written"
        color = "rgba(34, 197, 94, 0.22)"   # Soft Emerald
    else:
        verdict = "uncertain"
        verdict_label = "Mixed / Refined"
        color = "rgba(234, 179, 8, 0.25)"  # Soft Amber
    return verdict, verdict_label, color

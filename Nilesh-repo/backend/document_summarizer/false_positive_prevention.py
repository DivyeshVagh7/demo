"""
Generalized False Positive Prevention Framework

This module provides a systematic approach to detect and filter false positives
across all risk categories, not just termination clauses.

Key Principles:
1. Context-aware scoring - balanced language reduces risk
2. Category-specific balancing indicators
3. Multi-layer filtering (pattern, LLM, response)
4. Continuous learning from false positives
"""

from typing import Dict, List, Set, Tuple
from dataclasses import dataclass
import re
from enum import Enum


class BalanceType(Enum):
    """Types of clause balance/fairness"""
    MUTUAL = "mutual"  # Both parties have equal rights
    RECIPROCAL = "reciprocal"  # Each party has corresponding obligations
    QUALIFIED = "qualified"  # Rights are properly limited/conditioned
    ONE_SIDED = "one_sided"  # Only one party benefits
    ASYMMETRIC = "asymmetric"  # Significantly unequal treatment


@dataclass
class BalancingIndicator:
    """
    Indicators that suggest a clause is balanced/fair and should not be flagged.
    
    Examples:
    - "either party", "both parties" = MUTUAL
    - "Customer may also", "Provider shall likewise" = RECIPROCAL
    - "upon 60 days notice", "with reasonable cause" = QUALIFIED
    """
    patterns: List[str]  # Regex patterns or keywords
    balance_type: BalanceType
    risk_reduction: int  # How many points to reduce (1-5)
    confidence_boost: float  # How much to boost confidence (0.0-0.5)
    description: str
    
    
# ============================================================================
# CATEGORY-SPECIFIC BALANCING INDICATORS
# ============================================================================

BALANCING_INDICATORS_BY_CATEGORY = {
    'termination': [
        BalancingIndicator(
            patterns=[r'\beither party\b', r'\bboth parties\b', r'\bmutual\b'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=5,  # Completely balanced - reduce to minimum
            confidence_boost=0.4,
            description="Both parties have equal termination rights"
        ),
        BalancingIndicator(
            patterns=[r'upon.*\d{60,}\s*days', r'\d{60,}\s*days.*notice', r'ninety.*days', r'sixty.*days'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=1,  # Long notice period mitigates somewhat
            confidence_boost=0.1,
            description="Adequate notice period (60+ days) provides protection"
        ),
        BalancingIndicator(
            patterns=[r'for\s+cause', r'material\s+breach', r'with\s+good\s+reason'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.2,
            description="Termination requires valid reason (not at-will)"
        ),
    ],
    
    'liability': [
        BalancingIndicator(
            patterns=[r'mutual\s+(?:liability|indemnification)', r'each\s+party.*indemnify', r'reciprocal'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=5,
            confidence_boost=0.4,
            description="Mutual liability/indemnification obligations"
        ),
        BalancingIndicator(
            patterns=[r'cap(?:ped)?\s+at', r'limited\s+to', r'not\s+to\s+exceed', r'maximum.*amount'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.2,
            description="Liability is capped/limited"
        ),
        BalancingIndicator(
            patterns=[r'except\s+for', r'excluding', r'other\s+than', r'save\s+for'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=1,
            confidence_boost=0.1,
            description="Liability has explicit carve-outs/exceptions"
        ),
    ],
    
    'ip_rights': [
        BalancingIndicator(
            patterns=[r'joint\s+ownership', r'co-own', r'shared\s+(?:rights|ownership)'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=4,
            confidence_boost=0.3,
            description="Joint/shared IP ownership"
        ),
        BalancingIndicator(
            patterns=[r'license\s+back', r'perpetual.*license', r'royalty-free.*license', r'right\s+to\s+use'],
            balance_type=BalanceType.RECIPROCAL,
            risk_reduction=3,
            confidence_boost=0.25,
            description="Creator retains license/usage rights"
        ),
        BalancingIndicator(
            patterns=[r'pre-existing', r'background\s+IP', r'prior.*(?:work|materials)', r'excluding.*existed'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.15,
            description="Pre-existing IP explicitly excluded"
        ),
    ],
    
    'amendment': [
        BalancingIndicator(
            patterns=[r'mutual\s+(?:consent|agreement)', r'both\s+parties.*agree', r'written\s+agreement.*parties'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=5,
            confidence_boost=0.4,
            description="Changes require mutual consent"
        ),
        BalancingIndicator(
            patterns=[r'\d{30,}\s*days.*notice', r'advance\s+notice', r'prior.*notification'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.15,
            description="Adequate notice before changes take effect"
        ),
        BalancingIndicator(
            patterns=[r'opt[\s-]out', r'reject.*changes', r'terminate.*upon.*modification', r'right\s+to\s+cancel'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=3,
            confidence_boost=0.25,
            description="Party can opt-out or terminate if changes unacceptable"
        ),
    ],
    
    'payment': [
        BalancingIndicator(
            patterns=[r'market\s+rate', r'commercially\s+reasonable', r'industry\s+standard', r'fair\s+market\s+value'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.15,
            description="Pricing tied to market/industry standards"
        ),
        BalancingIndicator(
            patterns=[r'not\s+to\s+exceed', r'cap(?:ped)?', r'maximum.*increase', r'\d+%.*per\s+(?:year|annum)'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.2,
            description="Price increases are capped/limited"
        ),
        BalancingIndicator(
            patterns=[r'mutual\s+agreement', r'both\s+parties.*consent', r'negotiated.*good\s+faith'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=3,
            confidence_boost=0.25,
            description="Price changes require mutual agreement"
        ),
    ],
    
    'confidentiality': [
        BalancingIndicator(
            patterns=[r'mutual\s+(?:confidentiality|NDA)', r'each\s+party.*confidential', r'reciprocal'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=4,
            confidence_boost=0.3,
            description="Mutual confidentiality obligations"
        ),
        BalancingIndicator(
            patterns=[r'standard\s+exceptions', r'publicly\s+available', r'independently\s+developed', r'required\s+by\s+law'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=1,
            confidence_boost=0.1,
            description="Standard confidentiality exceptions apply"
        ),
    ],
    
    'dispute_resolution': [
        BalancingIndicator(
            patterns=[r'mutual\s+(?:arbitration|mediation)', r'agreed\s+arbitrator', r'both\s+parties.*consent'],
            balance_type=BalanceType.MUTUAL,
            risk_reduction=3,
            confidence_boost=0.25,
            description="Dispute resolution is mutual/balanced"
        ),
        BalancingIndicator(
            patterns=[r'neutral\s+venue', r'mutually\s+agreed.*location', r'convenient.*both'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=2,
            confidence_boost=0.15,
            description="Neutral venue protects both parties"
        ),
        BalancingIndicator(
            patterns=[r'prevailing\s+party', r'each.*own.*fees', r'costs\s+shared'],
            balance_type=BalanceType.QUALIFIED,
            risk_reduction=1,
            confidence_boost=0.1,
            description="Fair cost allocation (prevailing party or shared)"
        ),
    ],
}


# ============================================================================
# GENERAL RED FLAGS (One-Sided Language)
# ============================================================================

RED_FLAG_PATTERNS = {
    'one_sided_party': [
        r'\b(?:provider|vendor|supplier|company|employer|licensor)\s+(?:may|shall|can|has\s+the\s+right)',
        r'(?:at|in)\s+(?:provider|vendor|company)\'?s?\s+(?:sole\s+)?discretion',
        r'(?:provider|vendor)\s+(?:reserves|retains)\s+(?:all\s+)?rights?',
    ],
    
    'absolute_language': [
        r'\ball\b.*\b(?:liability|risk|responsibility|cost)',
        r'\bany\s+and\s+all\b',
        r'\bwhatsoever\b',
        r'\bunlimited\b',
        r'\bwithout\s+(?:limit|restriction|exception)',
    ],
    
    'unilateral_power': [
        r'unilateral(?:ly)?',
        r'at\s+any\s+time\s+(?:and\s+)?for\s+any\s+reason',
        r'in\s+(?:its|our)\s+sole\s+discretion',
        r'as\s+(?:it|we)\s+(?:deem|determine)',
        r'without\s+(?:notice|consent|approval)',
    ],
}


# ============================================================================
# CORE FUNCTIONS
# ============================================================================

def analyze_clause_balance(
    clause_text: str,
    category: str,
    base_risk_score: int
) -> Tuple[int, float, BalanceType, List[str]]:
    """
    Analyze a clause for balancing indicators and adjust risk score.
    
    Args:
        clause_text: The clause text to analyze
        category: Risk category (termination, liability, etc.)
        base_risk_score: Initial risk score (1-5)
        
    Returns:
        Tuple of (adjusted_score, confidence, balance_type, reasons)
    """
    if not clause_text:
        return base_risk_score, 0.5, BalanceType.ONE_SIDED, []
    
    clause_lower = clause_text.lower()
    
    # Check for balancing indicators
    total_reduction = 0
    confidence_boost = 0.0
    balance_type = BalanceType.ONE_SIDED
    reasons = []
    
    indicators = BALANCING_INDICATORS_BY_CATEGORY.get(category, [])
    
    for indicator in indicators:
        for pattern in indicator.patterns:
            if re.search(pattern, clause_lower):
                total_reduction = max(total_reduction, indicator.risk_reduction)
                confidence_boost = max(confidence_boost, indicator.confidence_boost)
                balance_type = indicator.balance_type
                reasons.append(indicator.description)
                break  # One match per indicator is enough
    
    # Check for red flags that indicate one-sidedness
    red_flag_count = 0
    for flag_category, patterns in RED_FLAG_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, clause_lower):
                red_flag_count += 1
                break
    
    # Adjust score
    adjusted_score = base_risk_score
    
    if balance_type in [BalanceType.MUTUAL, BalanceType.RECIPROCAL]:
        # Strong balancing - drastically reduce risk
        adjusted_score = max(1, base_risk_score - total_reduction)
    elif balance_type == BalanceType.QUALIFIED:
        # Qualified/limited - moderate reduction
        adjusted_score = max(2, base_risk_score - total_reduction)
    
    # Red flags increase score
    if red_flag_count > 0:
        adjusted_score = min(5, adjusted_score + min(red_flag_count, 2))
        balance_type = BalanceType.ONE_SIDED
    
    # Calculate confidence
    base_confidence = 0.5
    confidence = min(1.0, base_confidence + confidence_boost)
    
    return adjusted_score, confidence, balance_type, reasons


def detect_identical_replacement(
    original_clause: str,
    replacement_clause: str,
    threshold: float = 0.90
) -> bool:
    """
    Detect if replacement is essentially identical to original (false positive).
    
    Args:
        original_clause: Original clause text
        replacement_clause: Suggested replacement
        threshold: Word overlap threshold (0.0-1.0)
        
    Returns:
        True if replacement is too similar (likely false positive)
    """
    if not original_clause or not replacement_clause:
        return False
    
    # Normalize
    norm_orig = re.sub(r'\s+', ' ', original_clause.lower()).strip()
    norm_repl = re.sub(r'\s+', ' ', replacement_clause.lower()).strip()
    
    # Too short to compare
    if len(norm_repl) < 50:
        return False
    
    # Check containment
    if norm_repl in norm_orig or norm_orig in norm_repl:
        return True
    
    # Word overlap comparison
    words_orig = set(norm_orig.split())
    words_repl = set(norm_repl.split())
    
    if not words_orig or not words_repl:
        return False
    
    overlap = len(words_orig & words_repl) / min(len(words_orig), len(words_repl))
    
    return overlap > threshold


def should_filter_clause(
    clause: Dict,
    min_risk_score: int = 3,
    min_confidence: float = 0.4
) -> Tuple[bool, str]:
    """
    Determine if a clause should be filtered from results.
    
    Args:
        clause: Clause dict with risk_score, confidence, etc.
        min_risk_score: Minimum score to include (default 3 = medium risk)
        min_confidence: Minimum confidence to include
        
    Returns:
        Tuple of (should_filter, reason)
    """
    risk_score = clause.get('risk_score', 3)
    confidence = clause.get('confidence', 0.5)
    clause_text = clause.get('clause_text', '')
    replacement = clause.get('replacement_clause', '')
    
    # Filter low-risk scores
    if risk_score < min_risk_score:
        return True, f"Low risk score ({risk_score}/{5})"
    
    # Filter low confidence
    if confidence < min_confidence:
        return True, f"Low confidence ({confidence:.2f})"
    
    # Filter identical replacements
    if detect_identical_replacement(clause_text, replacement):
        return True, "Replacement identical to original"
    
    # Filter very short clauses (likely incomplete extraction)
    if len(clause_text.strip()) < 30:
        return True, "Clause text too short"
    
    return False, ""


def validate_category_consistency(clause: Dict) -> bool:
    """
    Validate that clause category matches its content.
    
    Prevents misclassification (e.g., payment clause flagged as termination).
    
    Args:
        clause: Clause dict with category and clause_text
        
    Returns:
        True if category seems consistent with content
    """
    category = clause.get('category') or ''
    clause_text = clause.get('clause_text') or ''
    
    category = category.lower() if category else ''
    clause_text = clause_text.lower() if clause_text else ''
    
    # Category-specific keywords that should appear
    category_keywords = {
        'termination': ['terminat', 'cancel', 'end', 'expire', 'discontinu'],
        'liability': ['liab', 'indemnif', 'hold harmless', 'damages', 'loss'],
        'ip_rights': ['intellectual property', 'copyright', 'patent', 'trademark', 'ownership', 'ip'],
        'payment': ['pay', 'fee', 'price', 'cost', 'invoice', 'compensation'],
        'amendment': ['amend', 'modif', 'change', 'alter', 'revise', 'update'],
        'confidentiality': ['confidential', 'proprietary', 'secret', 'disclosure', 'nda'],
        'dispute_resolution': ['dispute', 'arbitrat', 'litigation', 'court', 'venue', 'jurisdiction'],
        'warranty': ['warrant', 'represent', 'guarantee', 'assurance'],
    }
    
    keywords = category_keywords.get(category, [])
    if not keywords:
        return True  # Unknown category, can't validate
    
    # Check if any category keyword appears in clause
    return any(kw in clause_text for kw in keywords)


# ============================================================================
# INTEGRATION HELPERS
# ============================================================================

def apply_false_positive_filters(
    clauses: List[Dict],
    min_risk_score: int = 3,
    min_confidence: float = 0.4,
    validate_categories: bool = True
) -> Tuple[List[Dict], List[Dict]]:
    """
    Apply all false positive filters to a list of clauses.
    
    Args:
        clauses: List of clause dicts
        min_risk_score: Minimum risk score threshold
        min_confidence: Minimum confidence threshold
        validate_categories: Whether to validate category consistency
        
    Returns:
        Tuple of (filtered_clauses, rejected_clauses)
    """
    filtered = []
    rejected = []
    
    for clause in clauses:
        should_filter, reason = should_filter_clause(clause, min_risk_score, min_confidence)
        
        if should_filter:
            clause['rejection_reason'] = reason
            rejected.append(clause)
            continue
        
        if validate_categories and not validate_category_consistency(clause):
            clause['rejection_reason'] = "Category inconsistent with content"
            rejected.append(clause)
            continue
        
        filtered.append(clause)
    
    return filtered, rejected


def get_balancing_examples_for_prompt(category: str) -> str:
    """
    Generate example text for LLM prompts showing balanced vs one-sided clauses.
    
    Args:
        category: Risk category
        
    Returns:
        Formatted text with examples
    """
    indicators = BALANCING_INDICATORS_BY_CATEGORY.get(category, [])
    if not indicators:
        return ""
    
    examples = []
    examples.append(f"\n**FALSE POSITIVES for {category.upper()} clauses - DO NOT FLAG:**")
    
    for indicator in indicators:
        if indicator.balance_type in [BalanceType.MUTUAL, BalanceType.RECIPROCAL]:
            examples.append(f"- Clauses with: {indicator.description}")
            examples.append(f"  (Contains: {', '.join(indicator.patterns[:2])})")
    
    examples.append(f"\n**TRUE RISKS for {category.upper()} clauses - FLAG THESE:**")
    examples.append("- One-sided language (Provider/Vendor may... but Customer must...)")
    examples.append("- Absolute/unlimited obligations without qualification")
    examples.append("- Unilateral rights without reciprocal obligations")
    
    return "\n".join(examples)


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    # Example 1: Analyze termination clause
    balanced_termination = """
    Either party may terminate this Agreement for convenience upon ninety (90) 
    days' prior written notice to the other party.
    """
    
    score, conf, balance, reasons = analyze_clause_balance(
        balanced_termination, 
        'termination', 
        base_risk_score=5
    )
    
    print("Balanced Termination Clause:")
    print(f"  Score: {score}/5 (base: 5)")
    print(f"  Confidence: {conf:.2f}")
    print(f"  Balance Type: {balance.value}")
    print(f"  Reasons: {reasons}")
    print()
    
    # Example 2: One-sided termination
    one_sided_termination = """
    Provider may terminate this Agreement at any time in its sole discretion 
    without cause or notice. Customer may only terminate for material breach.
    """
    
    score2, conf2, balance2, reasons2 = analyze_clause_balance(
        one_sided_termination,
        'termination',
        base_risk_score=5
    )
    
    print("One-Sided Termination Clause:")
    print(f"  Score: {score2}/5 (base: 5)")
    print(f"  Confidence: {conf2:.2f}")
    print(f"  Balance Type: {balance2.value}")
    print(f"  Reasons: {reasons2}")
    print()
    
    # Example 3: Test identical replacement detection
    original = "Provider shall indemnify Customer for all claims."
    replacement = "Provider shall indemnify Customer for all claims and damages."
    
    is_identical = detect_identical_replacement(original, replacement)
    print(f"Identical replacement? {is_identical}")

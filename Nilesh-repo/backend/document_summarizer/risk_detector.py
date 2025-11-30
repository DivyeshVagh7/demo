"""
Enhanced risk detection engine with improved accuracy and reliability.
This module provides advanced clause extraction, contextual analysis, and
intelligent risk scoring for legal documents.
"""
import re
import logging
from typing import List, Dict, Any, Tuple, Set
from dataclasses import dataclass
from enum import Enum

# Import generalized false positive prevention framework
try:
    from .false_positive_prevention import (
        analyze_clause_balance,
        BalanceType,
        BALANCING_INDICATORS_BY_CATEGORY
    )
    FP_FRAMEWORK_AVAILABLE = True
except ImportError:
    FP_FRAMEWORK_AVAILABLE = False
    logging.warning("False positive prevention framework not available - using legacy logic")

logger = logging.getLogger(__name__)


class RiskCategory(Enum):
    """Risk categories for legal clauses"""
    INDEMNITY = "indemnity"
    LIABILITY = "liability"
    TERMINATION = "termination"
    RENEWAL = "renewal"
    IP_RIGHTS = "intellectual_property"
    DATA_PROTECTION = "data_protection"
    DISPUTE_RESOLUTION = "dispute_resolution"
    PAYMENT = "payment"
    WARRANTY = "warranty"
    CONFIDENTIALITY = "confidentiality"
    NON_COMPETE = "non_compete"
    AMENDMENT = "amendment"
    ASSIGNMENT = "assignment"
    FORCE_MAJEURE = "force_majeure"
    JURISDICTION = "jurisdiction"


@dataclass
class RiskPattern:
    """Enhanced risk pattern with context and scoring"""
    pattern: str
    category: RiskCategory
    base_risk_score: int  # 1-5
    requires_context: List[str]  # Words that must appear nearby to confirm risk
    excludes_context: List[str]  # Words that negate the risk if present
    weight: float
    description: str
    mitigation: str
    case_sensitive: bool = False
    is_regex: bool = False


# Enhanced risk patterns with context awareness
ENHANCED_RISK_PATTERNS: List[RiskPattern] = [
    # INDEMNITY - High Risk
    RiskPattern(
        pattern=r"shall\s+indemnify\s+(?:and\s+)?(?:hold\s+harmless|defend)",
        category=RiskCategory.INDEMNITY,
        base_risk_score=5,
        requires_context=["all", "any", "losses", "damages", "claims"],
        excludes_context=["mutual", "limited to", "except"],
        weight=10.0,
        description="Broad unilateral indemnification obligation without limitations",
        mitigation="Negotiate for mutual indemnity, cap liability, and limit to direct damages from party's own misconduct",
        is_regex=True
    ),
    RiskPattern(
        pattern=r"indemnify.*from\s+(?:any|all)\s+(?:and\s+all\s+)?(?:claims|losses|damages|liabilities)",
        category=RiskCategory.INDEMNITY,
        base_risk_score=5,
        requires_context=[],
        excludes_context=["mutual", "solely", "limited"],
        weight=9.0,
        description="Unlimited indemnity obligation covering all potential losses",
        mitigation="Add caps, carve-outs for third-party claims only, and require causation by indemnifying party",
        is_regex=True
    ),
    RiskPattern(
        pattern="duty to defend",
        category=RiskCategory.INDEMNITY,
        base_risk_score=4,
        requires_context=["indemnify", "claims", "litigation"],
        excludes_context=["reimbursement", "at cost"],
        weight=7.0,
        description="Obligation to bear defense costs in litigation",
        mitigation="Limit to reimbursement of reasonable defense costs after liability is proven",
        is_regex=False
    ),
    
    # LIABILITY CAPS - High Risk
    RiskPattern(
        pattern=r"liability.*(?:shall\s+)?not\s+exceed\s+(?:\$|USD|€)?[\d,]+",
        category=RiskCategory.LIABILITY,
        base_risk_score=4,
        requires_context=["aggregate", "total", "maximum"],
        excludes_context=["except", "excluding", "carve-out"],
        weight=8.0,
        description="Low liability cap may be insufficient for actual damages",
        mitigation="Increase cap to realistic amount (e.g., 12 months fees) and add carve-outs for critical breaches",
        is_regex=True
    ),
    RiskPattern(
        pattern=r"(?:excludes?|disclaim).*(?:all\s+)?(?:consequential|indirect|incidental|special|punitive)\s+damages",
        category=RiskCategory.LIABILITY,
        base_risk_score=4,
        requires_context=[],
        excludes_context=["except for", "excluding"],
        weight=7.0,
        description="Excludes recovery of significant damage types",
        mitigation="Carve out consequential damages from data loss, IP infringement, or confidentiality breaches",
        is_regex=True
    ),
    RiskPattern(
        pattern="as-is",
        category=RiskCategory.WARRANTY,
        base_risk_score=3,
        requires_context=["provided", "delivered", "sold"],
        excludes_context=["except", "warranty", "guarantee"],
        weight=6.0,
        description="No warranties or guarantees on performance or quality",
        mitigation="Negotiate minimum performance standards, acceptance testing, or limited warranty period",
        is_regex=False
    ),
    
    # TERMINATION - Critical Risk (only if truly one-sided)
    RiskPattern(
        pattern=r"terminate.*(?:at\s+any\s+time|for\s+convenience|without\s+cause)",
        category=RiskCategory.TERMINATION,
        base_risk_score=5,
        requires_context=[],
        excludes_context=["either party", "both parties", "mutual"],  # Only strong mutual indicators
        weight=9.0,
        description="Unilateral termination right creates contract instability",
        mitigation="Require minimum term, advance notice (60-90 days), and mutual termination rights",
        is_regex=True,
        case_sensitive=False
    ),
    RiskPattern(
        pattern=r"(?<!either\s)(?<!both\s)(?:provider|vendor|supplier|company|employer)\s+may\s+terminate.*(?:for\s+convenience|without\s+cause)",
        category=RiskCategory.TERMINATION,
        base_risk_score=5,
        requires_context=[],
        excludes_context=["customer may also", "employee may also", "either party", "both parties"],
        weight=8.5,
        description="One-sided termination favors provider",
        mitigation="Add mutual termination rights or minimum commitment period",
        is_regex=True,
        case_sensitive=False
    ),
    RiskPattern(
        pattern=r"early\s+termination\s+(?:fee|penalty|charge)",
        category=RiskCategory.TERMINATION,
        base_risk_score=4,
        requires_context=["pay", "owe", "liable"],
        excludes_context=["waived", "no", "without"],
        weight=7.5,
        description="Financial penalty for early termination may be excessive",
        mitigation="Cap termination fees, allow pro-rated calculation, or negotiate waiver clauses",
        is_regex=True
    ),
    
    # AUTOMATIC RENEWAL - High Risk
    RiskPattern(
        pattern=r"(?:automatic(?:ally)?|auto)(?:\s+|\-)renew",
        category=RiskCategory.RENEWAL,
        base_risk_score=4,
        requires_context=["term", "year", "period"],
        excludes_context=["opt-out", "cancel", "notice"],
        weight=8.0,
        description="Auto-renewal without easy opt-out mechanism",
        mitigation="Shorten auto-renewal notice period to 30 days, require opt-in instead of opt-out",
        is_regex=True
    ),
    RiskPattern(
        pattern=r"successive.*terms?.*unless.*terminat",
        category=RiskCategory.RENEWAL,
        base_risk_score=4,
        requires_context=["renew", "extend"],
        excludes_context=["30 days", "mutual"],
        weight=7.0,
        description="Automatic renewal with long notice period",
        mitigation="Reduce notice period and add renewal reminders before deadline",
        is_regex=True
    ),
    
    # INTELLECTUAL PROPERTY - Critical
    RiskPattern(
        pattern=r"(?:all|any)\s+intellectual\s+property.*(?:shall\s+)?belong\s+to",
        category=RiskCategory.IP_RIGHTS,
        base_risk_score=5,
        requires_context=["created", "developed", "arising"],
        excludes_context=["pre-existing", "background", "separately"],
        weight=9.0,
        description="Broad assignment of IP rights without limitations",
        mitigation="Limit to deliverables created specifically for project, retain background IP, get license-back rights",
        is_regex=True
    ),
    RiskPattern(
        pattern=r"work\s+for\s+hire",
        category=RiskCategory.IP_RIGHTS,
        base_risk_score=4,
        requires_context=["intellectual property", "copyright", "ownership"],
        excludes_context=["excluding", "except"],
        weight=8.0,
        description="Work-for-hire arrangement transfers all IP ownership",
        mitigation="Negotiate joint ownership or perpetual license with right to sublicense",
        is_regex=True
    ),
    
    # UNILATERAL AMENDMENT - High Risk
    RiskPattern(
        pattern=r"(?:may|reserves?\s+the\s+right\s+to)\s+(?:modify|amend|change|alter).*(?:agreement|terms)",
        category=RiskCategory.AMENDMENT,
        base_risk_score=5,
        requires_context=["unilateral", "sole", "discretion", "at any time"],
        excludes_context=["mutual", "consent", "agreement of both"],
        weight=9.0,
        description="Unilateral right to change contract terms",
        mitigation="Require mutual written consent for material changes, or provide opt-out right without penalty",
        is_regex=True
    ),
    
    # MANDATORY ARBITRATION
    RiskPattern(
        pattern=r"(?:mandatory|binding|exclusive)\s+arbitration",
        category=RiskCategory.DISPUTE_RESOLUTION,
        base_risk_score=3,
        requires_context=["dispute", "claim", "controversy"],
        excludes_context=["optional", "may", "at party's election"],
        weight=6.0,
        description="Mandatory arbitration limits access to courts",
        mitigation="Make arbitration mutual, choose neutral venue and rules, preserve injunctive relief rights in court",
        is_regex=True
    ),
    RiskPattern(
        pattern="waiver of jury trial",
        category=RiskCategory.DISPUTE_RESOLUTION,
        base_risk_score=3,
        requires_context=[],
        excludes_context=[],
        weight=6.0,
        description="Waives constitutional right to jury trial",
        mitigation="Remove waiver or ensure it's truly mutual and knowingly agreed",
        is_regex=False
    ),
    
    # CONFIDENTIALITY - Medium Risk
    RiskPattern(
        pattern=r"(?:confidential|proprietary)\s+information.*(?:indefinitely|perpetual|in\s+perpetuity)",
        category=RiskCategory.CONFIDENTIALITY,
        base_risk_score=3,
        requires_context=["obligation", "duty", "maintain"],
        excludes_context=["terminate", "expire", "years"],
        weight=5.0,
        description="Indefinite confidentiality obligation",
        mitigation="Limit confidentiality to 3-5 years post-termination, add standard exceptions",
        is_regex=True
    ),
    
    # NON-COMPETE - High Risk
    RiskPattern(
        pattern=r"(?:shall\s+)?not\s+(?:engage\s+in|conduct|carry\s+on).*(?:competing|competitive)\s+(?:business|activities)",
        category=RiskCategory.NON_COMPETE,
        base_risk_score=4,
        requires_context=["customer", "client", "market", "industry"],
        excludes_context=["limited to", "specific", "narrow"],
        weight=7.0,
        description="Broad non-compete restriction limits future opportunities",
        mitigation="Narrow scope to specific products/services, limit geography and duration (6-12 months max)",
        is_regex=True
    ),
    
    # DATA BREACH - High Risk
    RiskPattern(
        pattern=r"data\s+breach.*(?:liable|responsible|indemnify)",
        category=RiskCategory.DATA_PROTECTION,
        base_risk_score=4,
        requires_context=["all", "any", "costs", "damages"],
        excludes_context=["solely caused by", "limited to"],
        weight=8.0,
        description="Unlimited liability for data breaches",
        mitigation="Define security standards, share breach costs, cap liability, require insurance",
        is_regex=True
    ),
    
    # PAYMENT TERMS
    RiskPattern(
        pattern=r"late\s+(?:payment|fee|charge).*(?:\d+%|percent)",
        category=RiskCategory.PAYMENT,
        base_risk_score=3,
        requires_context=["per", "month", "annually"],
        excludes_context=["maximum", "not to exceed"],
        weight=5.0,
        description="High late payment interest rate",
        mitigation="Cap late fees at statutory maximum, add grace period for payment processing",
        is_regex=True
    ),
    RiskPattern(
        pattern=r"set-?off",
        category=RiskCategory.PAYMENT,
        base_risk_score=3,
        requires_context=["withhold", "deduct", "offset"],
        excludes_context=["prohibited", "not permitted", "undisputed"],
        weight=6.0,
        description="Set-off rights allow withholding payments",
        mitigation="Limit set-off to undisputed amounts with prior written notice",
        is_regex=True
    ),
    
    # ASSIGNMENT
    RiskPattern(
        pattern=r"(?:may\s+)?assign.*without.*consent",
        category=RiskCategory.ASSIGNMENT,
        base_risk_score=3,
        requires_context=["agreement", "rights", "obligations"],
        excludes_context=["prohibited", "not", "except"],
        weight=6.0,
        description="Allows assignment to unknown third parties without approval",
        mitigation="Require prior written consent for assignment, allow only to qualified affiliates",
        is_regex=True
    ),
    
    # FORCE MAJEURE - Medium Risk
    RiskPattern(
        pattern=r"force\s+majeure",
        category=RiskCategory.FORCE_MAJEURE,
        base_risk_score=2,
        requires_context=["excuse", "suspend", "delay"],
        excludes_context=["notice", "mitigation", "terminate"],
        weight=4.0,
        description="Force majeure clause may excuse performance too broadly",
        mitigation="Add notice requirements, mitigation obligations, and termination right after extended period",
        is_regex=True
    ),
]


def extract_clause_with_context(text: str, match_pos: int, context_chars: int = 300) -> str:
    """
    Extract a clause with surrounding context, attempting to capture complete sentences.
    
    Args:
        text: Full document text
        match_pos: Position where risk pattern was found
        context_chars: Number of characters to extend on each side
        
    Returns:
        Extracted clause with complete sentences
    """
    # Find sentence boundaries
    start = max(0, match_pos - context_chars)
    end = min(len(text), match_pos + context_chars)
    
    # Extend to sentence boundaries
    sentence_endings = ['. ', '.\n', '? ', '! ', '.\r']
    
    # Look backwards for sentence start
    for i in range(match_pos, start, -1):
        if i > 1 and text[i-1:i+1] in sentence_endings:
            start = i + 1
            break
        # Also check for paragraph breaks
        if i > 0 and text[i-1:i+1] == '\n\n':
            start = i + 1
            break
    
    # Look forwards for sentence end
    for i in range(match_pos, end):
        if i < len(text) - 1 and text[i:i+2] in sentence_endings:
            end = i + 1
            break
        # Also check for paragraph breaks
        if i < len(text) - 1 and text[i:i+2] == '\n\n':
            end = i
            break
    
    clause = text[start:end].strip()
    
    # Clean up - normalize whitespace but preserve structure
    clause = re.sub(r'[ \t]+', ' ', clause)  # Collapse spaces/tabs
    clause = re.sub(r'\n{3,}', '\n\n', clause)  # Max 2 newlines
    
    # Remove section headers if they're at the very beginning
    # Pattern: "Section 10.1" or "10.1 Assignment" or just "10.1"
    clause = re.sub(r'^(Section|Article|Clause)\s+\d+(\.\d+)*[\.\:]?\s*', '', clause, flags=re.IGNORECASE)
    clause = re.sub(r'^\d+(\.\d+)+\s+[A-Z][a-z]+\s+', '', clause)  # "10.1 Assignment"
    
    return clause.strip()


def calculate_contextual_risk_score(
    base_score: int,
    text: str,
    requires_context: List[str],
    excludes_context: List[str]
) -> Tuple[int, float]:
    """
    Calculate risk score based on contextual analysis.
    
    Returns:
        Tuple of (adjusted_score, confidence_score)
    """
    text_lower = text.lower()
    confidence = 0.5  # Base confidence
    adjusted_score = base_score
    
    # Check required context
    required_found = 0
    if requires_context:
        for req in requires_context:
            if req and req.lower() in text_lower:
                required_found += 1
        context_ratio = required_found / len(requires_context) if requires_context else 1.0
        confidence += context_ratio * 0.3
        
        # Increase score if strong context present
        if context_ratio > 0.7:
            adjusted_score = min(5, base_score + 1)
    else:
        confidence += 0.3
    
    # Check excluding context - be more aggressive in reduction
    excludes_found = 0
    strong_mutual_indicators = ["either party", "both parties", "mutual"]
    has_strong_mutual = False
    
    for excl in excludes_context:
        if excl and excl.lower() in text_lower:
            excludes_found += 1
            # Check if this is a strong mutual indicator
            if excl.lower() in strong_mutual_indicators:
                has_strong_mutual = True
    
    if excludes_found > 0:
        # If strong mutual indicator present (either party/both parties/mutual), drastically reduce
        if has_strong_mutual:
            adjusted_score = 1  # These are balanced clauses - minimal risk
            confidence = max(confidence, 0.95)  # Very high confidence it's not risky
        else:
            # Other mitigating factors (e.g., notice periods) - moderate reduction
            reduction = min(excludes_found, 2)  # Max reduction of 2 points
            adjusted_score = max(1, adjusted_score - reduction)
            confidence += 0.1 * excludes_found
    
    confidence = min(1.0, confidence)
    
    return adjusted_score, confidence


def detect_enhanced_risks(text: str, max_clauses: int = 10) -> List[Dict[str, Any]]:
    """
    Enhanced risk detection using pattern matching with context awareness.
    
    Args:
        text: Document text to analyze
        max_clauses: Maximum number of high-risk clauses to return
        
    Returns:
        List of detected risk clauses with scores and metadata
    """
    detected_risks: List[Dict[str, Any]] = []
    seen_clauses: Set[str] = set()
    seen_positions: List[Tuple[int, int]] = []  # Track (start, end) positions to avoid overlaps
    
    for pattern_obj in ENHANCED_RISK_PATTERNS:
        if pattern_obj.is_regex:
            flags = 0 if pattern_obj.case_sensitive else re.IGNORECASE
            matches = list(re.finditer(pattern_obj.pattern, text, flags))
        else:
            pattern = pattern_obj.pattern if pattern_obj.case_sensitive else pattern_obj.pattern.lower()
            search_text = text if pattern_obj.case_sensitive else text.lower()
            matches = []
            pos = 0
            while True:
                pos = search_text.find(pattern, pos)
                if pos == -1:
                    break
                # Create match-like object
                class SimpleMatch:
                    def __init__(self, pos, length):
                        self.pos = pos
                        self.length = length
                    def start(self):
                        return self.pos
                    def end(self):
                        return self.pos + self.length
                matches.append(SimpleMatch(pos, len(pattern)))
                pos += len(pattern)
        
        for match in matches:
            match_start = match.start()
            match_end = match.end()
            
            # Check if this position overlaps with already detected clauses
            is_overlapping = False
            for seen_start, seen_end in seen_positions:
                # Check for significant overlap (>50% of match length)
                overlap_start = max(match_start, seen_start)
                overlap_end = min(match_end, seen_end)
                overlap_length = max(0, overlap_end - overlap_start)
                match_length = match_end - match_start
                
                if overlap_length > match_length * 0.5:
                    is_overlapping = True
                    break
            
            if is_overlapping:
                continue
            
            # Extract clause with context
            clause_text = extract_clause_with_context(text, match_start, context_chars=350)
            
            # Avoid duplicates - create better fingerprint
            words = [w for w in clause_text.lower().split() if len(w) > 3]
            clause_fingerprint = ' '.join(words[:25])  # First 25 significant words
            
            if clause_fingerprint in seen_clauses:
                continue
            
            # Calculate contextual risk score
            adjusted_score, confidence = calculate_contextual_risk_score(
                pattern_obj.base_risk_score,
                clause_text,
                pattern_obj.requires_context,
                pattern_obj.excludes_context
            )
            
            # Only include if confidence is reasonable
            if confidence < 0.4:
                continue
            
            seen_clauses.add(clause_fingerprint)
            seen_positions.append((match_start, match_end))
            
            risk = {
                'clause_text': clause_text,  # Keep full clause for accurate highlighting
                'clause_text_short': clause_text[:500],  # Shortened for display if needed
                'risk_score': adjusted_score,
                'risk_level': _score_to_label(adjusted_score),
                'category': pattern_obj.category.value,
                'confidence': round(confidence, 2),
                'rationale': pattern_obj.description,
                'mitigation': pattern_obj.mitigation,
                'weight': pattern_obj.weight,
                'pattern_matched': pattern_obj.pattern[:50],
                'position': (match_start, match_end)  # Store position for reference
            }
            
            # Apply generalized framework balance check if available
            if FP_FRAMEWORK_AVAILABLE:
                try:
                    fp_score, fp_confidence, balance_type, reasons = analyze_clause_balance(
                        clause_text,
                        pattern_obj.category.value,
                        adjusted_score
                    )
                    
                    # If framework detects strong balancing, use its analysis
                    if balance_type.value in ['mutual', 'reciprocal'] and fp_score < adjusted_score:
                        risk['risk_score'] = fp_score
                        risk['risk_level'] = _score_to_label(fp_score)
                        risk['confidence'] = max(confidence, fp_confidence)
                        risk['balance_type'] = balance_type.value
                        risk['balance_reasons'] = reasons
                        risk['framework_adjusted'] = True
                except Exception as e:
                    logging.warning(f"Framework balance check failed: {e}")
            
            detected_risks.append(risk)
    
    # Sort by: confidence desc, then risk_score desc, then weight desc
    detected_risks.sort(
        key=lambda x: (x['confidence'], x['risk_score'], x['weight']),
        reverse=True
    )
    
    return detected_risks[:max_clauses]


def _score_to_label(score: int) -> str:
    """Convert numeric risk score to label"""
    return {
        5: 'Critical',
        4: 'High',
        3: 'Medium',
        2: 'Low',
        1: 'Minimal',
    }.get(score, 'Medium')


def merge_llm_and_heuristic_risks(
    llm_clauses: List[Dict[str, Any]],
    heuristic_clauses: List[Dict[str, Any]],
    max_total: int = 8
) -> List[Dict[str, Any]]:
    """
    Intelligently merge LLM-detected and heuristic risks, avoiding duplicates.
    
    Args:
        llm_clauses: Clauses detected by LLM
        heuristic_clauses: Clauses detected by pattern matching
        max_total: Maximum clauses to return
        
    Returns:
        Merged and deduplicated list of risks
    """
    merged: List[Dict[str, Any]] = []
    seen_clauses: Set[str] = set()
    
    def create_fingerprint(text: str) -> str:
        """Create fingerprint from significant words"""
        words = [w for w in text.lower().split() if len(w) > 3]
        return ' '.join(words[:25])
    
    def is_duplicate(clause1: str, clause2: str) -> bool:
        """Check if two clauses are semantically similar"""
        fp1 = create_fingerprint(clause1)
        fp2 = create_fingerprint(clause2)
        
        if fp1 == fp2:
            return True
        
        # Word overlap check
        words1 = set(fp1.split())
        words2 = set(fp2.split())
        
        if not words1 or not words2:
            return False
        
        intersection = len(words1 & words2)
        smaller_set = min(len(words1), len(words2))
        overlap_ratio = intersection / smaller_set if smaller_set > 0 else 0
        
        return overlap_ratio > 0.75
    
    # Process LLM clauses first (higher quality)
    for clause in llm_clauses:
        clause_text = clause.get('clause_text', '')
        if not clause_text:
            continue
        
        fingerprint = create_fingerprint(clause_text)
        if fingerprint not in seen_clauses:
            # Check for semantic duplicates
            is_dup = False
            for existing in merged:
                if is_duplicate(clause_text, existing.get('clause_text', '')):
                    is_dup = True
                    break
            
            if not is_dup:
                clause['source'] = 'llm'
                clause['confidence'] = clause.get('confidence', 0.85)
                merged.append(clause)
                seen_clauses.add(fingerprint)
    
    # Add heuristic clauses if we have room
    for clause in heuristic_clauses:
        if len(merged) >= max_total:
            break
        
        clause_text = clause.get('clause_text', '')
        if not clause_text:
            continue
        
        # Check against all existing
        is_dup = False
        for existing_clause in merged:
            if is_duplicate(clause_text, existing_clause.get('clause_text', '')):
                is_dup = True
                # If heuristic has higher confidence, upgrade the existing one
                if clause.get('confidence', 0) > existing_clause.get('confidence', 0):
                    existing_clause['confidence'] = clause['confidence']
                    existing_clause['category'] = clause.get('category', existing_clause.get('category'))
                break
        
        if not is_dup:
            clause['source'] = 'heuristic'
            merged.append(clause)
    
    # Final sort by priority
    merged.sort(
        key=lambda x: (
            x.get('confidence', 0),
            x.get('risk_score', 0),
            x.get('weight', 0)
        ),
        reverse=True
    )
    
    return merged[:max_total]

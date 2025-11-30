"""
Two-stage solution refinement: Pattern-based enhancement + Gemini tailoring
"""

import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def refine_clause_solutions_with_patterns_and_llm(
    clause: Dict[str, Any],
    doc_type: str,
    structured_llm,
    full_text: str = '',
) -> Dict[str, Any]:
    """
    Two-stage refinement process:
    1. Match clause against risk patterns to get template solutions/alternatives
    2. Use Gemini to tailor the template with clause-specific context
    
    Args:
        clause: Initial clause dict from Gemini with risk identification
        doc_type: Document type (nda, employment, service_agreement, etc.)
        structured_llm: LangChain LLM instance
        full_text: Full document text for context
        
    Returns:
        Enhanced clause dict with refined mitigation and replacement_clause
    """
    from .enhanced_risk_patterns import (
        get_enhanced_risk_patterns_by_type,
        get_type_specific_mitigation_strategies,
    )
    from .document_classifier import DOCUMENT_TYPES
    from langchain_core.prompts import ChatPromptTemplate
    from pydantic import BaseModel, Field
    
    clause_text = clause.get('clause_text', '')
    risk_score = clause.get('risk_score', 3)
    risk_level = clause.get('risk_level', 'Medium')
    rationale = clause.get('rationale', '')
    
    if not clause_text:
        return clause
    
    # Stage 1: Pattern Matching - Find relevant template
    risk_patterns = get_enhanced_risk_patterns_by_type(doc_type)
    mitigation_strategies = get_type_specific_mitigation_strategies(doc_type)
    doc_type_name = DOCUMENT_TYPES.get(doc_type, {}).get('name', 'General Agreement')
    
    matched_pattern = None
    pattern_info = None
    
    # Try to match clause against known risk patterns
    for risk_category, info in risk_patterns.items():
        for pattern in info.get('patterns', []):
            try:
                if re.search(pattern, clause_text, re.IGNORECASE):
                    matched_pattern = risk_category
                    pattern_info = info
                    logger.info(f"Matched pattern '{risk_category}' for refinement")
                    break
            except re.error:
                continue
        if matched_pattern:
            break
    
    # If no pattern matched, use general strategies
    if not pattern_info:
        logger.info("No specific pattern matched, using general strategies")
        pattern_info = {
            'context': 'General contractual risk requiring balanced terms',
            'severity': risk_score,
            'solution_template': mitigation_strategies.get('general', 'Negotiate balanced, mutual terms with clear limits and adequate protections.'),
            'alternative_pattern': 'Revise clause to be mutual, time-limited, and reasonably scoped with clear definitions and adequate protections for both parties.',
        }
    
    # Stage 2: Gemini Tailoring - Use pattern template + clause context
    try:
        class RefinedSolution(BaseModel):
            mitigation: str = Field(
                ..., 
                description="NEGOTIATION STRATEGY ONLY - Bullet-pointed action steps for what to REQUEST/CHANGE during contract negotiation. NOT the actual clause text. Use imperative verbs: 'Request...', 'Negotiate...', 'Insist on...', 'Propose...'. Include 3-5 specific negotiation tactics with concrete numbers/timeframes from the original clause. 50-100 words."
            )
            replacement_clause: str = Field(
                ..., 
                description="COMPLETE CONTRACTUAL TEXT - Ready-to-use alternative clause in formal legal language that can be directly inserted into the contract. Must be a self-contained provision using legal terminology (shall/must/hereby/notwithstanding). Include all necessary definitions, conditions, and limitations. 80-150 words."
            )
        
        refinement_prompt = ChatPromptTemplate.from_messages([
            (
                'system',
                f"You are an expert contract negotiation advisor specializing in {doc_type_name}. "
                "You provide TWO DISTINCT outputs:\n"
                "1. NEGOTIATION STRATEGY - What to request/change during negotiations\n"
                "2. ALTERNATIVE CLAUSE - Ready-to-use contract language"
            ),
            (
                'system',
                "CRITICAL DISTINCTION:\n"
                "- 'mitigation' = NEGOTIATION ADVICE (what to ask for, how to negotiate)\n"
                "- 'replacement_clause' = CONTRACT TEXT (actual legal language to insert)\n\n"
                "These are COMPLETELY DIFFERENT:\n"
                "❌ WRONG mitigation: 'Provider shall indemnify Client...'\n"
                "✅ CORRECT mitigation: 'Request mutual indemnification. Propose liability cap at 12 months fees...'\n\n"
                "❌ WRONG replacement_clause: 'Negotiate for a shorter term'\n"
                "✅ CORRECT replacement_clause: 'Either party may terminate upon 30 days written notice...'"
            ),
            (
                'human',
                "RISKY CLAUSE:\n{clause_text}\n\n"
                "RISK IDENTIFICATION:\n"
                "Risk Level: {risk_level} (Score: {risk_score}/5)\n"
                "Why it's risky: {rationale}\n\n"
                "PATTERN-BASED TEMPLATE:\n"
                "Risk Category: {pattern_category}\n"
                "Template Solution Approach: {template_solution}\n"
                "Template Alternative Pattern: {template_alternative}\n\n"
                "GENERATE TWO DISTINCT OUTPUTS:\n\n"
                "1. 'mitigation' - NEGOTIATION STRATEGY (50-100 words):\n"
                "   Format as bullet points or numbered steps.\n"
                "   Use action verbs: Request, Negotiate, Propose, Insist, Counter-propose.\n"
                "   Reference SPECIFIC terms from the original clause.\n"
                "   Example: 'Request reduction from 5 years to 12 months. Propose mutual termination rights. Insist on written notice requirement.'\n"
                "   This is ADVICE on how to negotiate, NOT contract language.\n\n"
                "2. 'replacement_clause' - ALTERNATIVE CONTRACT TEXT (80-150 words):\n"
                "   Write in formal legal style using: shall, must, hereby, notwithstanding, provided that.\n"
                "   Include specific numbers, timeframes, and conditions.\n"
                "   Make it self-contained and ready to insert into contract.\n"
                "   Example: 'Either party may terminate this Agreement upon thirty (30) days prior written notice...'\n"
                "   This is ACTUAL CONTRACT LANGUAGE, not negotiation advice.\n\n"
                "CRITICAL: No placeholders like [AMOUNT]. Use concrete defaults based on {doc_type_name} best practices.\n\n"
                "Return JSON with 'mitigation' and 'replacement_clause' keys."
            ),
        ])
        
        chain = refinement_prompt | structured_llm.with_structured_output(RefinedSolution)
        
        logger.info(f"Invoking Gemini for tailored refinement (pattern: {matched_pattern or 'general'})")
        result = chain.invoke({
            'clause_text': clause_text[:500],  # Limit length for API
            'risk_level': risk_level,
            'risk_score': risk_score,
            'rationale': rationale,
            'pattern_category': matched_pattern or 'general_risk',
            'template_solution': pattern_info['solution_template'],
            'template_alternative': pattern_info['alternative_pattern'],
            'doc_type_name': doc_type_name,
        })
        
        # Check if result is None before trying to extract data
        if result is None:
            logger.warning("Gemini returned None for refinement - using pattern templates")
            raise ValueError("Gemini returned None")
        
        # Extract data from result with error handling
        try:
            if hasattr(result, 'model_dump'):
                refined = result.model_dump()
            elif hasattr(result, 'dict'):
                refined = result.dict()
            else:
                refined = dict(result) if result is not None else {}
        except (TypeError, ValueError, AttributeError) as extract_error:
            logger.warning(f"Failed to extract data from Gemini result: {extract_error}")
            raise ValueError(f"Failed to extract refinement data: {extract_error}")
        
        logger.info(f"Gemini refinement result - mitigation length: {len(refined.get('mitigation', ''))}, replacement length: {len(refined.get('replacement_clause', ''))}")
        
        # Update clause with refined solutions
        if refined.get('mitigation') and len(refined['mitigation']) > 30:
            clause['mitigation'] = refined['mitigation']
            logger.info(f"✅ Using Gemini negotiation strategy (mitigation): {refined['mitigation'][:80]}...")
        else:
            # Fallback to pattern template
            clause['mitigation'] = pattern_info['solution_template']
            logger.warning(f"⚠️ Gemini negotiation strategy too short ({len(refined.get('mitigation', ''))} chars), using pattern template")
        
        if refined.get('replacement_clause') and len(refined['replacement_clause']) > 50:
            clause['replacement_clause'] = refined['replacement_clause']
            logger.info(f"✅ Using Gemini alternative clause text (replacement): {refined['replacement_clause'][:80]}...")
        else:
            # Fallback to pattern template
            clause['replacement_clause'] = pattern_info['alternative_pattern']
            logger.warning(f"⚠️ Gemini alternative clause too short ({len(refined.get('replacement_clause', ''))} chars), using pattern template")
        
        # Add metadata
        if matched_pattern:
            clause['pattern_matched'] = matched_pattern.replace('_', ' ').title()
            clause['pattern_severity'] = pattern_info['severity']
        
        clause['refinement_method'] = 'pattern_plus_llm' if matched_pattern else 'llm_general'
        
        return clause
        
    except Exception as exc:
        logger.warning(f"Gemini refinement failed, using pattern templates: {exc}")
        
        # Fallback to pattern templates without Gemini refinement
        clause['mitigation'] = pattern_info['solution_template']
        clause['replacement_clause'] = pattern_info['alternative_pattern']
        
        if matched_pattern:
            clause['pattern_matched'] = matched_pattern.replace('_', ' ').title()
            clause['pattern_severity'] = pattern_info['severity']
        
        clause['refinement_method'] = 'pattern_only'
        
        return clause


def batch_refine_clauses(
    clauses: List[Dict[str, Any]],
    doc_type: str,
    structured_llm,
    full_text: str = '',
    max_refine: int = 6,
) -> List[Dict[str, Any]]:
    """
    Refine multiple clauses with rate limiting and error handling
    
    Args:
        clauses: List of clause dicts from initial Gemini analysis
        doc_type: Document type
        structured_llm: LangChain LLM instance
        full_text: Full document text
        max_refine: Maximum number of clauses to refine (highest risk first)
        
    Returns:
        List of enhanced clauses with refined solutions (preserves original order)
    """
    if not clauses:
        return clauses
    
    # Create indexed list to preserve original order
    indexed_clauses = [(idx, clause) for idx, clause in enumerate(clauses)]
    
    # Sort by risk score (highest first) for priority processing
    sorted_indexed = sorted(
        indexed_clauses, 
        key=lambda x: x[1].get('risk_score', 0), 
        reverse=True
    )
    
    # Select top N for refinement
    to_refine_indexed = sorted_indexed[:max_refine]
    
    # Track which indices were refined
    refined_indices = set()
    
    # Refine selected clauses
    for idx, clause in to_refine_indexed:
        try:
            refined = refine_clause_solutions_with_patterns_and_llm(
                clause=clause,
                doc_type=doc_type,
                structured_llm=structured_llm,
                full_text=full_text,
            )
            # Update in original list
            clauses[idx] = refined
            refined_indices.add(idx)
            logger.info(f"Refined clause {idx} (risk_score: {clause.get('risk_score')})")
        except Exception as exc:
            logger.warning(f"Failed to refine clause {idx}, using original: {exc}")
    
    logger.info(f"Refined {len(refined_indices)}/{len(clauses)} clauses")
    
    # Return original list with refined clauses updated in place
    return clauses

"""
Enhanced prompt engineering for legal risk analysis with improved accuracy.
"""

# Improved system prompts with specific examples and failure cases

LEGAL_RISK_ANALYST_SYSTEM_PROMPT = """You are a senior legal risk analyst with 15+ years experience reviewing commercial contracts. Your role is to protect clients by identifying unfavorable, one-sided, or unusually risky contract terms.

CRITICAL INSTRUCTIONS:
1. ONLY flag clauses that create REAL, MATERIAL risk - not standard boilerplate
2. Prioritize clauses that:
   - Transfer unlimited liability to one party
   - Allow unilateral changes/termination
   - Have harsh financial penalties
   - Restrict fundamental business activities
   - Assign away valuable IP rights
   
3. IGNORE standard clauses like:
   - Basic governing law statements (unless unusual venue)
   - Standard confidentiality (unless perpetual/unreasonable)
   - Normal payment terms (unless predatory fees)
   - Typical force majeure language

4. For each risky clause:
   - Extract COMPLETE, COHERENT clauses that form standalone statements
   - Start at the BEGINNING of the clause (not mid-sentence)
   - Include full sentences/paragraphs that relate to ONE specific risk
   - Quote the EXACT problematic text (20-200 words minimum for completeness)
   - Explain the SPECIFIC harm it could cause
   - Provide ACTIONABLE negotiation advice

5. Assign risk scores honestly:
   - 5 (Critical): Could cause business failure or massive loss
   - 4 (High): Significant financial or operational impact
   - 3 (Medium): Moderate impact or unfair but manageable
   - 2 (Low): Minor inconvenience or standard with slight imbalance
   - 1 (Minimal): Noted for completeness but not concerning

DO NOT:
- Flag clauses just because they contain legal keywords
- Treat all indemnities/liabilities as equally risky
- Include boilerplate that any contract would have
- Be overly cautious - clients need accurate risk assessment"""


CHUNK_ANALYSIS_EXAMPLES = [
    {
        "document_type": "SaaS Agreement",
        "chunk": '''5. FEES AND PAYMENT
5.1 Customer shall pay all fees as set forth in the Order Form. All fees are non-refundable.
5.2 Late payments shall accrue interest at 2% per month (24% annually).
5.3 Provider may suspend Services immediately upon any payment default without notice.

6. LIMITATION OF LIABILITY  
Provider's aggregate liability shall not exceed $500 (five hundred dollars), regardless of the fees paid or damages incurred. This cap applies to all claims of any kind.''',
        "expected_output": {
            "summary": "Contains multiple high-risk financial provisions: extremely low liability cap ($500), excessive late payment interest (24% APY), and immediate suspension without notice.",
            "high_risk_clauses": [
                {
                    "clause_text": "Provider's aggregate liability shall not exceed $500 (five hundred dollars), regardless of the fees paid or damages incurred. This cap applies to all claims of any kind.",
                    "risk_score": 5,
                    "risk_level": "Critical",
                    "rationale": "$500 liability cap is absurdly low and bears no relation to actual damages or fees paid. Provides virtually no recourse.",
                    "mitigation": "Increase cap to minimum 12 months of fees paid, with carve-outs for gross negligence, data loss, IP infringement, and confidentiality breaches.",
                    "replacement_clause": "Provider's aggregate liability for any claims under this Agreement shall not exceed the total fees paid by Customer in the twelve (12) months preceding the claim, except that this limitation shall not apply to Provider's obligations under Sections [Indemnity], [Confidentiality], or claims arising from Provider's gross negligence or willful misconduct."
                },
                {
                    "clause_text": "Late payments shall accrue interest at 2% per month (24% annually).",
                    "risk_score": 4,
                    "risk_level": "High",
                    "rationale": "24% annual interest rate is usurious and may exceed statutory limits in many jurisdictions.",
                    "mitigation": "Reduce to statutory maximum (typically 8-12% annually) and add 10-day grace period.",
                    "replacement_clause": "Late payments shall accrue interest at the lesser of (a) one percent (1%) per month or (b) the maximum rate permitted by applicable law, assessed only after a ten (10) day grace period following written notice of non-payment."
                },
                {
                    "clause_text": "Provider may suspend Services immediately upon any payment default without notice.",
                    "risk_score": 3,
                    "risk_level": "Medium",
                    "rationale": "Immediate suspension without notice could disrupt business operations due to payment processing delays or disputes.",
                    "mitigation": "Require 10-day written notice and opportunity to cure before suspension.",
                    "replacement_clause": "Provider may suspend Services if Customer fails to cure any payment default within ten (10) business days after receiving written notice specifying the amount due and payment instructions."
                }
            ]
        }
    },
    {
        "document_type": "Service Agreement",  
        "chunk": '''12. TERM AND TERMINATION
This Agreement shall have an initial term of one (1) year and shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the end of the then-current term.

Customer may terminate for convenience at any time upon 30 days notice.''',
        "expected_output": {
            "summary": "One-sided termination terms: 180-day renewal notice required but provider can terminate on 30 days.",
            "high_risk_clauses": [
                {
                    "clause_text": "This Agreement shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the end of the then-current term.",
                    "risk_score": 4,
                    "risk_level": "High",
                    "rationale": "180-day (6-month) advance notice for renewal is excessive and easy to miss, resulting in unwanted one-year extensions.",
                    "mitigation": "Reduce notice period to 60 days maximum, add automatic renewal reminders 90 days before deadline.",
                    "replacement_clause": "This Agreement shall automatically renew for successive one (1) year periods unless either party provides written notice of non-renewal at least sixty (60) days prior to the end of the then-current term. Provider shall send Customer a renewal reminder at least ninety (90) days before each renewal date."
                }
            ]
        }
    },
    {
        "document_type": "Development Agreement",
        "chunk": '''8. INTELLECTUAL PROPERTY RIGHTS
8.1 All intellectual property rights in any work product, deliverables, inventions, discoveries, and improvements created by Developer under this Agreement, whether alone or jointly with others, shall be the sole and exclusive property of Client.

8.2 Developer hereby irrevocably assigns all right, title and interest in such intellectual property to Client, including all patent rights, copyrights, trade secrets, and moral rights.''',
        "expected_output": {
            "summary": "Extremely broad IP assignment of all work product without limitations or compensation.",
            "high_risk_clauses": [
                {
                    "clause_text": "All intellectual property rights in any work product, deliverables, inventions, discoveries, and improvements created by Developer under this Agreement, whether alone or jointly with others, shall be the sole and exclusive property of Client.",
                    "risk_score": 5,
                    "risk_level": "Critical",
                    "rationale": "Overly broad IP assignment covers anything created 'under this Agreement' including developer's independent innovations, tools, and methods. 'Whether alone or jointly' could claim co-invented IP.",
                    "mitigation": "Limit to deliverables specifically created for Client, exclude pre-existing and independently developed IP, negotiate license-back rights for reusable components.",
                    "replacement_clause": "Client shall own all intellectual property rights in Deliverables (as defined in Exhibit A) that are specifically created by Developer solely for Client pursuant to this Agreement. Developer retains all rights in (i) Developer's pre-existing intellectual property, (ii) Developer's general knowledge, skills, and experience, and (iii) any tools or methodologies developed independently. Developer grants Client a perpetual, royalty-free license to use any Developer background IP incorporated in Deliverables."
                }
            ]
        }
    }
]


def get_enhanced_chunk_prompt() -> str:
    """Returns the improved chunk analysis prompt with examples"""
    return """Analyze this contract section for material risks. Focus on clauses that are:
- One-sided or heavily favor one party
- Contain unusually harsh penalties or unlimited liability
- Restrict business operations significantly  
- Assign valuable rights without fair compensation

CRITICAL: For 'clause_text', extract COMPLETE, WELL-FORMED clauses:
✓ Start at the BEGINNING of the sentence/paragraph (not mid-sentence)
✓ Include the full context needed to understand the risk
✓ Capture complete sentences that form a coherent statement about ONE specific risk
✓ Minimum 20-30 words to ensure completeness
✗ DO NOT start with fragments like "...shall indemnify" or "...upon termination"
✗ DO NOT extract random phrases or partial sentences
✗ DO NOT break in the middle of a thought

Compare each identified risk to these benchmark examples to calibrate your risk scoring:

CRITICAL (5) - Examples:
• Liability cap of $500 for SaaS causing millions in losses
• IP assignment of all work including independent creations
• Indemnify from "any and all" claims with no cap or limitations

HIGH (4) - Examples:
• 24% annual interest on late payments (usurious)
• 180-day renewal notice requirement (unreasonable)
• Termination for convenience without notice or compensation

MEDIUM (3) - Examples:
• Immediate service suspension without cure period
• Mandatory arbitration with vendor-chosen arbitrator
• Non-compete preventing serving any competing client

LOW (2) - Examples:  
• Standard governing law in reasonable jurisdiction
• Mutual confidentiality for 3 years post-termination
• Assignment allowed to affiliates

MINIMAL (1) - Examples:
• Force majeure for natural disasters
• Standard notice provisions
• Typical severability clause

IMPORTANT: Do NOT flag standard contract clauses that appear in most commercial agreements. Only identify genuinely problematic terms."""


def get_enhanced_focus_prompt() -> str:
    """Returns improved focus analysis prompt for high-priority sentences"""
    return """You are reviewing sentences pre-filtered as potentially risky based on keyword analysis. However, many may be false positives.

Your task: Separate genuinely high-risk clauses from standard contract language.

ASK YOURSELF:
1. Is this clause one-sided or mutual?
2. Does it impose unusual/harsh obligations?
3. Could it cause material financial or operational harm?
4. Is there missing protection that should be present?

CRITICAL: These are FALSE POSITIVES - DO NOT FLAG:
- "Either party may terminate for convenience upon 60-90 days notice" (BALANCED - both parties have equal rights)
- "Mutual termination rights with advance notice" (FAIR - not risky)
- "Either party shall indemnify..." (MUTUAL - not risky)
- "Liability cap of $10M annually" (reasonable if fees are $1M+)
- "Confidentiality for 2 years post-termination" (reasonable timeframe)
- "90-day notice period for termination" (standard and fair)

EXAMPLES OF TRUE RISKS (FLAG THESE):
- "Provider may terminate without cause on 10 days notice" (ONE-SIDED - only provider can terminate)
- "Customer may terminate anytime, Provider requires 180 days" (ASYMMETRIC - unfair)
- "Customer liable for all claims regardless of fault" (UNLIMITED liability)
- "Auto-renews unless cancelled 1 year in advance" (UNREASONABLE notice period)
- "All IP becomes vendor's property" (UNFAIR IP grab)
- "Terminate immediately without notice" (NO notice period)

KEY DISTINCTION: "Either party" or "Both parties" = BALANCED = NOT RISKY
                 "Provider may" or "Customer must" = ONE-SIDED = RISKY

Only return 3-6 of the HIGHEST, TRULY RISKY clauses. Quality over quantity."""


def get_improved_system_messages():
    """Returns full improved prompt chain"""
    return {
        "system_prompt": LEGAL_RISK_ANALYST_SYSTEM_PROMPT,
        "chunk_instructions": get_enhanced_chunk_prompt(),
        "focus_instructions": get_enhanced_focus_prompt(),
        "examples": CHUNK_ANALYSIS_EXAMPLES
    }

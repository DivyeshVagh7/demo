"""
Document Type Classification and Type-Specific Prompts
Identifies legal document type and provides tailored analysis prompts
"""

from typing import Dict, List, Tuple, Optional
import re


# Document type definitions with keywords and patterns
DOCUMENT_TYPES = {
    'nda': {
        'name': 'Non-Disclosure Agreement (NDA)',
        'keywords': [
            'non-disclosure', 'confidential information', 'confidentiality agreement',
            'proprietary information', 'trade secret', 'confidential material',
            'disclosing party', 'receiving party', 'confidential data'
        ],
        'patterns': [
            r'non[- ]disclosure',
            r'confidential(?:ity)?\s+agreement',
            r'receiving\s+party.*disclosing\s+party',
        ],
        'description': 'Agreement protecting confidential information shared between parties'
    },
    'employment': {
        'name': 'Employment Agreement',
        'keywords': [
            'employment agreement', 'employee', 'employer', 'employment contract',
            'job title', 'position', 'salary', 'compensation', 'work duties',
            'employment terms', 'termination of employment', 'probation period'
        ],
        'patterns': [
            r'employment\s+(?:agreement|contract)',
            r'employer.*employee',
            r'job\s+title.*position',
            r'salary.*compensation',
        ],
        'description': 'Contract defining employment terms, duties, and compensation'
    },
    'service_agreement': {
        'name': 'Service Agreement / MSA',
        'keywords': [
            'service agreement', 'master service agreement', 'msa', 'statement of work',
            'sow', 'service provider', 'client', 'deliverables', 'scope of work',
            'professional services', 'consulting services'
        ],
        'patterns': [
            r'(?:master\s+)?service\s+agreement',
            r'\bMSA\b',
            r'statement\s+of\s+work',
            r'service\s+provider.*client',
        ],
        'description': 'Agreement between service provider and client for services rendered'
    },
    'lease': {
        'name': 'Rental / Lease Agreement',
        'keywords': [
            'lease agreement', 'rental agreement', 'landlord', 'tenant', 'lessee',
            'lessor', 'premises', 'rent', 'security deposit', 'lease term',
            'residential lease', 'commercial lease'
        ],
        'patterns': [
            r'(?:rental|lease)\s+agreement',
            r'landlord.*tenant',
            r'lessor.*lessee',
            r'rent.*premises',
        ],
        'description': 'Agreement for renting residential or commercial property'
    },
    'purchase': {
        'name': 'Sale / Purchase Agreement',
        'keywords': [
            'purchase agreement', 'sale agreement', 'sales contract', 'buyer',
            'seller', 'purchase price', 'goods', 'merchandise', 'transfer of ownership',
            'bill of sale'
        ],
        'patterns': [
            r'(?:purchase|sale)\s+agreement',
            r'buyer.*seller',
            r'purchase\s+price',
            r'bill\s+of\s+sale',
        ],
        'description': 'Agreement for transferring goods, services, or assets'
    },
    'power_of_attorney': {
        'name': 'Power of Attorney (POA)',
        'keywords': [
            'power of attorney', 'poa', 'attorney-in-fact', 'principal', 'agent',
            'authorize', 'act on behalf', 'grant authority', 'legal authority'
        ],
        'patterns': [
            r'power\s+of\s+attorney',
            r'\bPOA\b',
            r'attorney[- ]in[- ]fact',
            r'principal.*agent.*authority',
        ],
        'description': 'Document authorizing someone to act on behalf of another'
    },
    'partnership': {
        'name': 'Partnership Agreement',
        'keywords': [
            'partnership agreement', 'partners', 'partnership', 'profit sharing',
            'capital contribution', 'management duties', 'partnership interest',
            'general partner', 'limited partner'
        ],
        'patterns': [
            r'partnership\s+agreement',
            r'partners.*profit.*share',
            r'capital\s+contribution',
            r'general\s+partner.*limited\s+partner',
        ],
        'description': 'Agreement defining partnership roles, profits, and governance'
    },
    'loan': {
        'name': 'Loan Agreement',
        'keywords': [
            'loan agreement', 'lender', 'borrower', 'principal amount', 'interest rate',
            'repayment', 'promissory note', 'collateral', 'security interest',
            'default', 'amortization'
        ],
        'patterns': [
            r'loan\s+agreement',
            r'lender.*borrower',
            r'interest\s+rate.*repayment',
            r'promissory\s+note',
        ],
        'description': 'Agreement outlining loan terms, repayment, and interest'
    },
    'privacy_policy': {
        'name': 'Privacy Policy',
        'keywords': [
            'privacy policy', 'personal data', 'data collection', 'data processing',
            'gdpr', 'ccpa', 'user information', 'cookies', 'data protection',
            'personally identifiable information', 'pii'
        ],
        'patterns': [
            r'privacy\s+policy',
            r'personal\s+data.*collection',
            r'GDPR|CCPA',
            r'data\s+protection',
        ],
        'description': 'Policy explaining data collection, use, storage, and sharing'
    },
    'terms_of_service': {
        'name': 'Terms & Conditions / Terms of Service',
        'keywords': [
            'terms of service', 'terms and conditions', 'tos', 'user agreement',
            'acceptable use', 'prohibited activities', 'user obligations',
            'service terms', 'platform rules'
        ],
        'patterns': [
            r'terms\s+(?:of\s+service|and\s+conditions)',
            r'\bToS\b|\bT&C\b',
            r'user\s+agreement',
            r'acceptable\s+use',
        ],
        'description': 'Rules governing use of a website, app, or service'
    },
    'software_license': {
        'name': 'Software License Agreement',
        'keywords': [
            'software license', 'end user license', 'eula', 'licensor', 'licensee',
            'software', 'license grant', 'restrictions', 'intellectual property rights'
        ],
        'patterns': [
            r'software\s+license',
            r'end\s+user\s+license',
            r'\bEULA\b',
            r'licensor.*licensee.*software',
        ],
        'description': 'Agreement granting rights to use software'
    },
    'saas': {
        'name': 'SaaS Agreement',
        'keywords': [
            'saas', 'software as a service', 'subscription', 'cloud service',
            'hosted service', 'platform', 'uptime', 'sla', 'service level'
        ],
        'patterns': [
            r'\bSaaS\b',
            r'software\s+as\s+a\s+service',
            r'subscription.*platform',
            r'service\s+level\s+agreement',
        ],
        'description': 'Agreement for cloud-based software services'
    },
    'generic': {
        'name': 'General Commercial Agreement',
        'keywords': ['agreement', 'contract', 'parties', 'terms'],
        'patterns': [r'agreement', r'contract'],
        'description': 'General commercial or legal agreement'
    }
}


def classify_document(text: str, title: str = '') -> Tuple[str, float]:
    """
    Classify document type based on content and title.
    
    Returns:
        Tuple of (document_type_key, confidence_score)
    """
    text_lower = text.lower()
    title_lower = title.lower() if title else ''
    combined_text = f"{title_lower} {text_lower[:5000]}"  # First 5000 chars
    
    scores = {}
    
    for doc_type, config in DOCUMENT_TYPES.items():
        if doc_type == 'generic':
            continue  # Skip generic for now
        
        score = 0.0
        
        # Check keywords (case-insensitive)
        keyword_matches = 0
        for keyword in config['keywords']:
            if keyword.lower() in combined_text:
                keyword_matches += 1
                # Title matches worth more
                if keyword.lower() in title_lower:
                    keyword_matches += 2
        
        # Keyword score (normalized)
        keyword_score = min(keyword_matches / len(config['keywords']), 1.0) * 0.6
        score += keyword_score
        
        # Check patterns (regex)
        pattern_matches = 0
        for pattern in config['patterns']:
            if re.search(pattern, combined_text, re.IGNORECASE):
                pattern_matches += 1
        
        # Pattern score (normalized)
        pattern_score = min(pattern_matches / len(config['patterns']), 1.0) * 0.4
        score += pattern_score
        
        scores[doc_type] = score
    
    # Find best match
    if not scores or max(scores.values()) < 0.2:
        return 'generic', 0.5
    
    best_type = max(scores, key=scores.get)
    confidence = scores[best_type]
    
    # If confidence is low, fall back to generic
    if confidence < 0.25:
        return 'generic', 0.5
    
    return best_type, confidence


def get_type_specific_system_prompt(doc_type: str) -> str:
    """Get tailored system prompt for specific document type"""
    
    base_prompt = """You are a senior legal risk analyst specializing in {doc_name}. 
You have 15+ years of experience reviewing {doc_name_lower} for Fortune 500 companies and startups.

Your role is to identify MATERIAL RISKS that could cause financial loss, operational disruption, or legal liability.

"""
    
    type_prompts = {
        'nda': base_prompt + """
CRITICAL FOCUS AREAS FOR NDAs:
1. **Overly Broad Definition of Confidential Information**
   - "All information" without limitations
   - No exclusions for publicly available info or independently developed info
   - Perpetual confidentiality obligations

2. **One-Sided Obligations**
   - Only one party bound by confidentiality
   - Asymmetric restrictions or remedies
   - Unilateral right to seek injunctive relief

3. **Unreasonable Duration**
   - Confidentiality exceeding 5 years for standard business info
   - Perpetual obligations for non-trade secrets
   - Survival clauses that never expire

4. **Excessive Remedies**
   - Automatic injunctive relief without notice
   - Unlimited damages without caps
   - One-sided indemnification for breaches

5. **Vague Return/Destruction Obligations**
   - No practical timeline for return
   - Impossible destruction requirements (e.g., from backups)

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Mutual confidentiality obligations
✓ 2-5 year confidentiality for business info
✓ Standard exclusions (public domain, independently developed)
✓ Balanced remedies available to both parties
""",
        
        'employment': base_prompt + """
CRITICAL FOCUS AREAS FOR EMPLOYMENT AGREEMENTS:
1. **Overly Restrictive Non-Compete Clauses**
   - Geographic scope too broad (nationwide/global)
   - Duration exceeding 1 year post-employment
   - Industry restrictions that prevent earning a living
   - No consideration for non-compete

2. **IP Assignment Overreach**
   - Claims ownership of all inventions (even unrelated)
   - No carve-out for prior inventions or personal projects
   - Assignment of work done outside business hours on own equipment

3. **At-Will Employment Loopholes**
   - Employer can terminate immediately without cause
   - Employee requires long notice period
   - Asymmetric termination rights

4. **Compensation Issues**
   - Vague bonus/commission structures with full discretion
   - No expense reimbursement
   - Salary reduction clauses without consent
   - Clawback provisions for unvested equity

5. **Post-Employment Restrictions**
   - Overly broad non-solicitation (all employees/customers)
   - Non-disparagement that limits legal speech
   - Perpetual confidentiality for non-trade secrets

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Reasonable non-compete (1 year, local area, specific competitors)
✓ IP assignment for work-related inventions during employment
✓ Mutual at-will employment terms
✓ Standard confidentiality for proprietary business information
""",
        
        'service_agreement': base_prompt + """
CRITICAL FOCUS AREAS FOR SERVICE AGREEMENTS:
1. **Scope Creep Without Additional Payment**
   - Vague deliverables or "as requested" scope
   - Unlimited revisions without additional fees
   - Unilateral right to expand scope

2. **One-Sided Termination Rights**
   - Client can terminate anytime, provider locked in
   - No notice period or compensation for early termination
   - Termination for convenience without cause (one-sided)

3. **Liability and Indemnification Imbalance**
   - Provider liable for all losses regardless of fault
   - Extremely low liability caps ($100-$500)
   - One-sided indemnification obligations
   - No limitation on consequential damages

4. **IP Ownership Issues**
   - Client owns all work product including pre-existing IP
   - No license back for reusable components
   - Provider assigns rights before full payment
   - Work-for-hire without fair compensation

5. **Payment Terms Risks**
   - Net 90+ day payment terms
   - No deposit or milestone payments
   - Payment contingent on subjective "satisfaction"
   - Late payment without interest or penalties

6. **Warranty Overreach**
   - Unlimited warranties
   - Warranties survive indefinitely
   - Provider warrants client's use/implementation

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Balanced termination rights (both parties can exit with notice)
✓ Liability caps of 12 months fees or greater
✓ Mutual indemnification
✓ Client owns deliverables, provider retains tools/methods
✓ Net 30-45 day payment terms
""",
        
        'lease': base_prompt + """
CRITICAL FOCUS AREAS FOR LEASE AGREEMENTS:
1. **Security Deposit Abuse**
   - Excessive deposit (>3 months rent)
   - Vague conditions for return
   - Landlord can keep deposit for "normal wear and tear"
   - No timeline for return after move-out

2. **Maintenance and Repair Obligations**
   - Tenant responsible for structural repairs
   - Tenant must fix all issues regardless of cause
   - Landlord has no repair obligations
   - No timeline for landlord repairs

3. **Entry and Inspection Rights**
   - Landlord can enter anytime without notice
   - No reasonable hours limitation
   - No emergency-only restriction

4. **Rent Increases**
   - Unlimited rent increases during term
   - Short notice for increases (< 30 days)
   - Increases at landlord's sole discretion

5. **Termination and Eviction**
   - Immediate eviction without cure period
   - Landlord can terminate without cause
   - Tenant responsible for rent through term even if evicted
   - No right to sublease or assign

6. **Liability Shift**
   - Tenant liable for all injuries on premises
   - Tenant must indemnify landlord for everything
   - No landlord liability for property damage

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ 1-2 month security deposit
✓ 24-48 hour notice for non-emergency entry
✓ Tenant responsible for minor repairs/maintenance
✓ Fixed rent with annual CPI adjustments
✓ Ability to sublease with landlord consent
""",
        
        'purchase': base_prompt + """
CRITICAL FOCUS AREAS FOR PURCHASE AGREEMENTS:
1. **Payment Terms Risks**
   - Full payment before delivery
   - No inspection period before payment
   - Non-refundable deposits without delivery guarantees
   - Payment for goods not yet received

2. **Warranty Limitations**
   - "As-is" sale with no warranties
   - Extremely short warranty period (< 30 days)
   - Seller disclaims all implied warranties
   - No remedy if goods are defective

3. **Delivery and Risk of Loss**
   - Buyer bears risk before receiving goods
   - No delivery timeline or "as soon as possible"
   - Seller not responsible for shipping damage
   - Buyer pays shipping but has no recourse for delays

4. **Title and Ownership Issues**
   - Title transfers before payment
   - No guarantee seller owns goods
   - No representation of clear title
   - Buyer responsible for prior liens

5. **Returns and Cancellation**
   - No returns under any circumstances
   - Cancellation fees equal to full purchase price
   - Buyer can't cancel even if seller breaches
   - Restocking fees over 25%

6. **Remedies Limitation**
   - No recourse for non-delivery
   - Buyer's only remedy is partial refund
   - Seller's damages unlimited, buyer's capped at $100

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Payment on delivery or COD
✓ 30-90 day warranty on goods
✓ Risk of loss passes on delivery
✓ 14-30 day return policy with reasonable restocking fee
✓ Balanced cancellation terms for both parties
""",
        
        'loan': base_prompt + """
CRITICAL FOCUS AREAS FOR LOAN AGREEMENTS:
1. **Interest Rate Issues**
   - Usurious rates (>36% APR in most states)
   - Variable rate with no cap
   - Compound interest without disclosure
   - Default rate of 2x+ normal rate

2. **Predatory Default Provisions**
   - Immediate acceleration on any missed payment
   - No grace period or cure rights
   - Default triggers for minor technicalities
   - Cross-default with unrelated obligations

3. **Collateral Overreach**
   - All present and future assets as collateral
   - Personal guarantee for business loan
   - Collateral value far exceeds loan amount
   - Right to seize without notice

4. **Prepayment Penalties**
   - Penalties for early repayment >5% of balance
   - Prepayment locked out for years
   - Penalty calculated on full term interest

5. **Excessive Fees**
   - Origination fees >5% of loan
   - Late fees >5% of payment or $50
   - Multiple fees compound (late + NSF + processing)
   - Servicing fees reduce principal payments

6. **One-Sided Modification Rights**
   - Lender can change terms unilaterally
   - No notice of changes
   - Borrower can't refinance without penalty

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Interest rate <12% APR for personal loans
✓ 10-15 day grace period before late fees
✓ Specific collateral matching loan purpose
✓ Reasonable prepayment (can pay off anytime)
✓ Origination fee <3% of loan amount
""",
        
        'privacy_policy': base_prompt + """
CRITICAL FOCUS AREAS FOR PRIVACY POLICIES:
1. **Overly Broad Data Collection**
   - Collecting sensitive data without clear purpose
   - "All information on your device" collection
   - No limitation on data types collected
   - Sharing with "partners" without disclosure

2. **Consent Issues**
   - No opt-out for data sharing/selling
   - Implied consent by merely visiting site
   - Retroactive consent to policy changes
   - No granular consent options

3. **Data Retention**
   - Indefinite retention without purpose
   - No data deletion rights
   - Retaining after account closure
   - No retention schedule disclosed

4. **Third-Party Sharing**
   - Sharing with unlimited third parties
   - Selling personal data without notice
   - No control over third-party use
   - Transfer to countries with weak protection

5. **Compliance Gaps**
   - No GDPR rights (EU users)
   - No CCPA rights (California users)
   - No data breach notification
   - No contact for privacy inquiries

6. **Unilateral Changes**
   - Can change policy anytime without notice
   - No email notification of changes
   - Continued use = acceptance

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ Collecting data necessary for service function
✓ Opt-out available for marketing
✓ Data retained for legal/operational purposes only
✓ Compliant with GDPR/CCPA
✓ 30-day notice before policy changes
""",
        
        'terms_of_service': base_prompt + """
CRITICAL FOCUS AREAS FOR TERMS OF SERVICE:
1. **Unilateral Modification Rights**
   - Can change terms anytime without notice
   - Continued use = acceptance of changes
   - No email notification of material changes
   - Changes take effect immediately

2. **Content Rights Overreach**
   - Platform owns all user-generated content
   - Perpetual, irrevocable license to user content
   - No attribution required for content use
   - Platform can sell/monetize user content

3. **Liability Disclaimers**
   - No liability for service outages or data loss
   - Disclaims all warranties
   - Not responsible for user interactions/harm
   - Liability cap of $50 or fees paid ($0 for free service)

4. **Termination and Account Control**
   - Can terminate account anytime without reason
   - No notice of termination
   - Lose access to purchased content/data
   - No refund for paid services

5. **Dispute Resolution**
   - Mandatory arbitration with company's chosen arbitrator
   - Class action waiver
   - Venue in inconvenient location
   - User pays arbitration costs

6. **Prohibited Uses (Vague/Overbroad)**
   - Undefined "objectionable content"
   - "Anything that violates any law" (too broad)
   - Platform sole discretion to determine violations
   - Immediate account termination for violations

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ 30-day notice for material terms changes
✓ License to user content limited to operating service
✓ Can terminate with 30 days notice or for cause
✓ Mutual arbitration with cost splitting
✓ Specific prohibited uses list (illegal content, harassment, spam)
""",
        
        'saas': base_prompt + """
CRITICAL FOCUS AREAS FOR SaaS AGREEMENTS:
1. **Service Level and Uptime**
   - No SLA or uptime guarantee
   - Uptime <95% acceptable
   - No credits for downtime
   - Scheduled maintenance unlimited
   - Credits only apply if you file claim within 48 hours

2. **Data Ownership and Portability**
   - Provider owns customer data
   - No data export functionality
   - Data deleted immediately upon termination
   - No transition assistance
   - Proprietary data format, can't export

3. **Subscription and Billing**
   - Auto-renewal without notification
   - Must commit to 3+ years
   - Annual price increases >10% automatic
   - Can't downgrade during term
   - No refund for unused portion

4. **Liability Limitations**
   - Liability cap of $100 regardless of fees paid
   - No liability for data loss/breaches
   - Provider not responsible for backup failures
   - Consequential damages waived even for gross negligence

5. **Data Security and Breaches**
   - No security standards specified
   - No breach notification requirement
   - Customer liable for security incidents
   - No encryption of sensitive data
   - No compliance certifications (SOC 2, ISO 27001)

6. **Termination and Lock-In**
   - Can only terminate at year-end with 180 days notice
   - Early termination fee = all remaining payments
   - Must delete data immediately, no retrieval
   - API access cut off instantly

COMMON FALSE POSITIVES (DO NOT FLAG):
✓ 99.5%+ uptime SLA with credits
✓ Customer owns their data with export
✓ Monthly or annual billing with 30-day notice
✓ Liability cap = 12 months fees
✓ SOC 2 certified with encryption
✓ 30-60 day termination notice with data export period
"""
    }
    
    doc_info = DOCUMENT_TYPES.get(doc_type, DOCUMENT_TYPES['generic'])
    doc_name = doc_info['name']
    doc_name_lower = doc_name.lower()
    
    prompt = type_prompts.get(doc_type, base_prompt)
    return prompt.format(doc_name=doc_name, doc_name_lower=doc_name_lower)


def get_type_specific_examples(doc_type: str) -> List[Dict]:
    """Get example clauses for specific document type"""
    
    examples = {
        'nda': [
            {
                'clause_text': 'All information disclosed by either party, whether written, oral, or in any other form, shall be deemed Confidential Information and subject to perpetual confidentiality obligations.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Overly broad definition with no exclusions and perpetual obligations is unreasonable and unenforceable.',
                'mitigation': 'Add standard exclusions (public domain, independently developed, rightfully received from third parties). Limit duration to 3-5 years.',
                'replacement_clause': '"Confidential Information" means non-public information marked as confidential, excluding information that: (a) is publicly available; (b) was rightfully known prior to disclosure; (c) is independently developed; or (d) is received from a third party without breach. Obligations survive for three (3) years after disclosure.'
            }
        ],
        'employment': [
            {
                'clause_text': 'Employee agrees not to engage in any business competitive with the Company anywhere in the world for a period of five (5) years following termination.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Worldwide 5-year non-compete is likely unenforceable and prevents employee from earning a living.',
                'mitigation': 'Limit to 6-12 months, specific geographic area where company operates, and only direct competitors.',
                'replacement_clause': 'Employee agrees not to directly compete with Company within a 50-mile radius of Company offices for twelve (12) months post-termination, limited to substantially similar products/services.'
            }
        ],
        'service_agreement': [
            {
                'clause_text': 'Provider shall deliver services as Client requests from time to time. Client may terminate this Agreement immediately at any time without cause. Provider aggregate liability shall not exceed $100.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Vague scope with unlimited revisions, one-sided termination, and absurdly low $100 liability cap.',
                'mitigation': 'Define specific deliverables in SOW. Add mutual termination rights with 30 days notice. Increase liability to 12 months fees.',
                'replacement_clause': 'Services defined in executed Statement of Work. Either party may terminate with thirty (30) days written notice. Provider liability shall not exceed fees paid in the prior twelve (12) months.'
            }
        ],
        'lease': [
            {
                'clause_text': "Security deposit of six (6) months rent is due at signing. Landlord may enter premises at any time without notice. Tenant is responsible for all repairs including structural and roof repairs.",
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Excessive deposit, no entry notice, and tenant liable for major structural repairs.',
                'mitigation': 'Reduce deposit to 1-2 months. Require 24-hour notice for entry. Landlord responsible for structural repairs.',
                'replacement_clause': "Security deposit equal to one (1) month rent. Landlord may enter with 24-hour notice for inspections. Landlord responsible for structural, roof, and major system repairs; Tenant responsible for minor maintenance."
            }
        ],
        'purchase': [
            {
                'clause_text': 'Full payment due upon signing. Goods sold AS-IS with NO WARRANTIES. Buyer bears all risk of loss during shipping. No returns or refunds under any circumstances.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Payment before delivery with no warranties, buyer bears shipping risk, and no recourse for defects.',
                'mitigation': 'Payment on delivery. Include 30-day warranty. Seller bears shipping risk. Allow returns within 14 days.',
                'replacement_clause': 'Payment due upon delivery. Goods warranted free from defects for thirty (30) days. Seller bears risk of loss until delivery. Buyer may return within fourteen (14) days for refund less 15% restocking fee.'
            }
        ],
        'loan': [
            {
                'clause_text': 'Interest rate is 48% APR. Entire loan balance becomes immediately due upon any missed payment. Borrower grants security interest in all present and future assets.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Usurious 48% rate, no grace period before acceleration, and blanket lien on all assets.',
                'mitigation': 'Reduce rate to legal maximum (typically 12-18%). Add 15-day grace period. Limit collateral to specific assets.',
                'replacement_clause': 'Interest rate of 12% per annum. If payment not received within fifteen (15) days of due date, a late fee may apply. Borrower grants security interest in [specific collateral] only.'
            }
        ],
        'privacy_policy': [
            {
                'clause_text': 'We collect all information on your device including contacts, photos, and location. We may share this information with any third parties. We may change this policy at any time without notice.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Invasive data collection, unlimited sharing, and unilateral changes without notice violates GDPR/CCPA.',
                'mitigation': 'Collect only data necessary for service. Disclose specific third parties. Provide 30-day notice of changes.',
                'replacement_clause': 'We collect information you provide (name, email) and usage data necessary to provide our services. We do not sell your personal information. Material policy changes require 30 days notice.'
            }
        ],
        'terms_of_service': [
            {
                'clause_text': 'We may terminate your account at any time without reason. You grant us perpetual, irrevocable rights to all content you post. Our liability is limited to $0. You waive all rights to sue us in court.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Arbitrary termination, perpetual content rights, zero liability, and complete waiver of legal rights.',
                'mitigation': 'Add termination notice. Limit content license to operating service. Provide minimum liability. Allow legal recourse for gross negligence.',
                'replacement_clause': 'We may terminate with 30 days notice or immediately for terms violations. You grant us license to content solely to operate the service. Our liability is limited to fees paid in 12 months, except for gross negligence or willful misconduct.'
            }
        ],
        'saas': [
            {
                'clause_text': 'We guarantee 90% uptime with no credits. We own all customer data. You must commit to 3 years with automatic renewal. We are not liable for data loss. Early termination requires payment of all remaining fees.',
                'risk_score': 5,
                'risk_level': 'Critical',
                'rationale': 'Low uptime without SLA credits, provider owns data, multi-year lock-in, no data loss liability, and full early termination penalties.',
                'mitigation': 'Increase to 99.9% with SLA credits. Customer owns data with export rights. Annual terms. Add backup liability. Prorate early termination.',
                'replacement_clause': 'We guarantee 99.9% monthly uptime with service credits. You own all data with export functionality. Annual term with auto-renewal and 60-day opt-out. We maintain backups with restoration support. Early termination fee is prorated remaining term divided by 2.'
            }
        ]
    }
    
    return examples.get(doc_type, examples.get('service_agreement', []))


def get_classification_prompt() -> str:
    """Get prompt for document classification"""
    
    doc_list = "\n".join([
        f"{i+1}. {config['name']}: {config['description']}"
        for i, (key, config) in enumerate(DOCUMENT_TYPES.items())
        if key != 'generic'
    ])
    
    return f"""You are an expert legal document classifier. Analyze the document and identify its type.

DOCUMENT TYPES:
{doc_list}

Analyze the document structure, terminology, party roles, and obligations to determine the most likely document type.

Return ONLY the document type number (1-12) and confidence (0-100), formatted as:
TYPE: <number>
CONFIDENCE: <percentage>

For example:
TYPE: 3
CONFIDENCE: 85
"""

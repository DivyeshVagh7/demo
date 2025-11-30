"""
Enhanced Type-Specific Risk Analysis with Dynamic Pattern Generation
Provides deep type-specific risk identification, solutions, and alternatives
"""

from typing import Dict, List, Tuple
import re


def get_enhanced_risk_patterns_by_type(doc_type: str) -> Dict[str, List[Dict]]:
    """
    Get enhanced risk detection patterns specific to document type
    Returns patterns with context, severity, and solution templates
    """
    
    patterns = {
        'nda': {
            'overly_broad_definition': {
                'patterns': [
                    r'all\s+information',
                    r'any\s+and\s+all\s+information',
                    r'deemed\s+confidential',
                    r'perpetual(?:ly)?\s+confidential',
                ],
                'severity': 5,
                'context': 'Overly broad definition of confidential information without reasonable exclusions',
                'solution_template': 'Limit confidential information to specific categories and add standard exclusions: (a) publicly available information; (b) independently developed; (c) rightfully received from third parties; (d) already known prior to disclosure.',
                'alternative_pattern': 'Confidential Information means non-public information that is: (i) marked as confidential, or (ii) would reasonably be considered confidential, but excludes information that [EXCLUSIONS]. Confidentiality obligations expire [DURATION] after disclosure.'
            },
            'one_sided_obligations': {
                'patterns': [
                    r'receiving\s+party\s+(?:shall|must|agrees?)(?:.*?)(?!disclosing\s+party\s+(?:shall|must|agrees?))',
                    r'(?:only|solely)\s+(?:one\s+party|receiving\s+party)',
                ],
                'severity': 4,
                'context': 'Confidentiality obligations apply to only one party, creating imbalance',
                'solution_template': 'Make confidentiality obligations mutual. Both parties should protect each other\'s confidential information under the same terms and conditions.',
                'alternative_pattern': 'Each party agrees to protect the other party\'s Confidential Information with the same degree of care used to protect its own confidential information, but no less than reasonable care.'
            },
            'excessive_duration': {
                'patterns': [
                    r'perpetual',
                    r'indefinite',
                    r'survive\s+(?:forever|indefinitely)',
                    r'(?:5|five|10|ten)\s+(?:years?|yrs)',
                ],
                'severity': 4,
                'context': 'Confidentiality obligations extend for unreasonably long period',
                'solution_template': 'Limit confidentiality to 2-3 years for general business information, 5 years for trade secrets. Add clear end date.',
                'alternative_pattern': 'Confidentiality obligations survive for three (3) years from the date of disclosure, except for information constituting trade secrets under applicable law, which obligations survive for five (5) years.'
            },
        },
        
        'employment': {
            'overly_broad_noncompete': {
                'patterns': [
                    r'(?:worldwide|globally|anywhere)',
                    r'(?:any|all)\s+(?:business|industry|field)',
                    r'(?:3|three|4|four|5|five)\s+years?',
                ],
                'severity': 5,
                'context': 'Non-compete is overly broad in scope, geography, or duration and may be unenforceable',
                'solution_template': 'Limit non-compete to: (1) specific geographic area where company operates (e.g., 50-mile radius); (2) specific competing products/services only; (3) maximum 12 months duration; (4) ensure adequate consideration provided.',
                'alternative_pattern': 'Employee agrees not to directly compete with Company by [SPECIFIC ACTIVITY] within a [MILES]-mile radius of Company\'s offices for [MONTHS] months following termination. This restriction applies only to [SPECIFIC PRODUCTS/SERVICES].'
            },
            'ip_assignment_overreach': {
                'patterns': [
                    r'all\s+(?:inventions?|intellectual\s+property|work)',
                    r'(?:whether|including).*(?:on|off)\s+(?:company\s+)?(?:time|premises)',
                    r'past,\s+present,\s+and\s+future',
                ],
                'severity': 5,
                'context': 'IP assignment claims ownership of all inventions including those unrelated to employment',
                'solution_template': 'Limit IP assignment to: (1) inventions created during employment; (2) relating to company business; (3) using company resources; (4) carved out prior inventions and personal projects on own time/equipment.',
                'alternative_pattern': 'Employee assigns to Company all intellectual property developed: (a) during employment hours, (b) using Company resources, and (c) relating to Company\'s actual or demonstrably anticipated business. Excluded: [LIST PRIOR IP] and inventions developed entirely on own time without Company resources unrelated to Company business.'
            },
            'asymmetric_termination': {
                'patterns': [
                    r'employer\s+may\s+terminate.*(?:immediately|without\s+(?:cause|notice))',
                    r'employee.*(?:30|sixty|90)\s+days',
                    r'at[- ]will.*(?:but|provided|except)',
                ],
                'severity': 4,
                'context': 'Termination rights heavily favor employer with no notice requirement or severance',
                'solution_template': 'Balance termination rights: (1) mutual at-will provision; (2) require 2-4 weeks notice from both sides; (3) add severance package for termination without cause; (4) ensure continued vesting or pro-rata bonus on termination.',
                'alternative_pattern': 'Either party may terminate employment at any time with [WEEKS] weeks written notice. If Company terminates without Cause, Employee receives [MONTHS] months severance pay and continued benefits, plus pro-rata bonus for completed period.'
            },
        },
        
        'service_agreement': {
            'vague_scope': {
                'patterns': [
                    r'as\s+(?:client|customer)\s+(?:requests?|directs?|requires?)',
                    r'from\s+time\s+to\s+time',
                    r'such\s+(?:services?|work)\s+as',
                    r'unlimited\s+(?:revisions?|changes?)',
                ],
                'severity': 5,
                'context': 'Scope of work is undefined allowing unlimited requests without additional payment',
                'solution_template': 'Define scope precisely: (1) specific deliverables in Statement of Work; (2) limit revisions (e.g., 2 rounds included); (3) change order process for additional work; (4) estimated hours with cap; (5) out-of-scope work billed separately.',
                'alternative_pattern': 'Services limited to those described in executed Statement of Work (SOW). Each SOW specifies: deliverables, timeline, acceptance criteria, and fees. Changes require written change order. Provider includes [NUMBER] rounds of revisions; additional revisions billed at [RATE].'
            },
            'low_liability_cap': {
                'patterns': [
                    r'(?:not\s+exceed|capped\s+at|limited\s+to).*\$?\s*(?:100|500|1,?000)',
                    r'liability.*\$?\s*(?:[1-9]\d{1,2})',
                    r'maximum.*(?:less\s+than|under).*fees',
                ],
                'severity': 5,
                'context': 'Liability cap is absurdly low and provides virtually no recourse for damages',
                'solution_template': 'Increase liability cap to reasonable amount: (1) minimum 12 months of fees paid; (2) carve out unlimited liability for gross negligence, willful misconduct, IP infringement, confidentiality breaches; (3) ensure mutual caps; (4) adequate insurance requirements.',
                'alternative_pattern': 'Each party\'s aggregate liability shall not exceed the total fees paid in the twelve (12) months preceding the claim. This limitation does not apply to: (a) indemnification obligations; (b) confidentiality breaches; (c) IP infringement; (d) gross negligence or willful misconduct; (e) [PARTY] maintains insurance of at least [AMOUNT].'
            },
            'one_sided_termination': {
                'patterns': [
                    r'client\s+may\s+terminate.*(?:any\s+time|immediately|without\s+(?:cause|notice))',
                    r'(?:provider|vendor|supplier).*(?:30|sixty|90|180)\s+days',
                ],
                'severity': 4,
                'context': 'Client can terminate immediately while provider is locked in with long notice period',
                'solution_template': 'Balance termination rights: (1) mutual termination for convenience with equal notice (30-60 days); (2) immediate termination for cause only after cure period; (3) payment for work completed upon termination; (4) reasonable wind-down period.',
                'alternative_pattern': 'Either party may terminate this Agreement: (a) for convenience upon [DAYS] days written notice; (b) for material breach if uncured within [DAYS] days of written notice. Upon termination, Client pays for all work completed, expenses incurred, and [%] of remaining SOW fees as wind-down costs.'
            },
        },
        
        'lease': {
            'excessive_deposit': {
                'patterns': [
                    r'(?:3|three|4|four|5|five|6|six)\s+months?.*(?:rent|deposit)',
                    r'security\s+deposit.*\$?\s*[5-9],?\d{3,}',
                ],
                'severity': 4,
                'context': 'Security deposit exceeds reasonable amount (typically 1-2 months rent)',
                'solution_template': 'Reduce security deposit to 1-2 months rent maximum. Add clear refund conditions: (1) itemized deduction list; (2) normal wear and tear excluded; (3) return within 30 days of move-out; (4) interest paid on deposit where required by law.',
                'alternative_pattern': 'Security Deposit of [1-2] month(s) rent ($ [AMOUNT]) held in [TYPE] account. Deposit refunded within thirty (30) days of move-out, less documented damages beyond normal wear and tear. Landlord provides itemized statement of any deductions.'
            },
            'unlimited_entry_rights': {
                'patterns': [
                    r'(?:any\s+time|at\s+any\s+time)',
                    r'without\s+(?:notice|permission|consent)',
                    r'landlord\s+may\s+enter.*(?!notice)',
                ],
                'severity': 4,
                'context': 'Landlord can enter premises anytime without notice, violating tenant privacy',
                'solution_template': 'Restrict entry rights: (1) require 24-48 hours advance notice; (2) reasonable hours only (e.g., 9am-6pm); (3) tenant consent required except emergencies; (4) maximum frequency limits; (5) immediate entry only for true emergencies.',
                'alternative_pattern': 'Landlord may enter Premises with [24-48] hours advance written notice during reasonable hours ([START]-[END]) for inspections, repairs, or showings. No notice required for emergencies threatening property or safety. Tenant may request alternate date/time with reasonable cause.'
            },
            'tenant_structural_liability': {
                'patterns': [
                    r'tenant.*(?:all\s+repairs?|any\s+damage)',
                    r'tenant.*(?:structural|foundation|roof|HVAC)',
                    r'regardless\s+of\s+cause',
                ],
                'severity': 5,
                'context': 'Tenant responsible for major structural repairs which are typically landlord obligations',
                'solution_template': 'Clarify repair obligations: (1) landlord responsible for structural, roof, major systems, building code compliance; (2) tenant responsible for interior, minor maintenance, tenant-caused damage; (3) define "habitability" standard; (4) timely repair requirements for both parties.',
                'alternative_pattern': 'Landlord maintains structural elements (foundation, roof, exterior walls), major systems (HVAC, plumbing, electrical), and ensures premises meet habitability standards. Tenant responsible for interior maintenance, minor repairs under $[AMOUNT], and damage caused by Tenant or guests beyond normal wear and tear.'
            },
        },
        
        'saas': {
            'low_uptime_sla': {
                'patterns': [
                    r'(?:90|95)(?:\.\d+)?%\s+uptime',
                    r'no\s+(?:guarantee|warranty).*uptime',
                    r'best\s+efforts?.*availability',
                ],
                'severity': 4,
                'context': 'Uptime SLA below industry standard (99.5%+) with no service credits for downtime',
                'solution_template': 'Improve SLA: (1) minimum 99.5% monthly uptime; (2) automatic service credits for breaches (e.g., 5-25% of monthly fees); (3) scheduled maintenance windows clearly defined and limited; (4) transparent status page; (5) incident post-mortems for major outages.',
                'alternative_pattern': 'Provider guarantees [99.5-99.9]% monthly uptime (excluding scheduled maintenance limited to [X] hours/month with [X] days notice). Service Credits: [5%] monthly fee if uptime <99.5%, [10%] if <99%, [25%] if <95%. Credits automatically applied to next invoice.'
            },
            'provider_owns_data': {
                'patterns': [
                    r'provider\s+(?:owns|retains).*(?:data|content)',
                    r'all\s+(?:rights?|ownership).*(?:data|information)',
                    r'license.*perpetual.*irrevocable',
                ],
                'severity': 5,
                'context': 'Provider claims ownership of customer data or requires overly broad license',
                'solution_template': 'Clarify data ownership: (1) customer retains all rights to their data; (2) provider gets limited license only to operate service; (3) customer can export data anytime in standard format; (4) data deleted within [X] days of termination upon request; (5) no provider use of data for other purposes without consent.',
                'alternative_pattern': 'Customer retains all rights to Customer Data. Customer grants Provider limited license to Customer Data solely to provide the Service. Customer may export all data at any time in [FORMAT]. Upon termination, Provider deletes Customer Data within [30-60] days unless legally required to retain.'
            },
            'long_lock_in': {
                'patterns': [
                    r'(?:2|two|3|three)\s+year.*(?:term|commitment)',
                    r'auto(?:matic(?:ally)?)?[- ]renew',
                    r'(?:90|180)\s+days.*(?:notice|cancel)',
                ],
                'severity': 4,
                'context': 'Long minimum commitment with automatic renewal and excessive cancellation notice',
                'solution_template': 'Reduce lock-in: (1) annual terms maximum for new customers; (2) can downgrade tiers mid-term; (3) auto-renewal with 30-60 day opt-out notice; (4) early termination allowed with reasonable fee (e.g., 25-50% of remaining term); (5) breach allows immediate termination.',
                'alternative_pattern': 'Initial term of [12] months. Auto-renews for successive [12]-month periods unless either party provides written notice at least [30-60] days before renewal. Customer may terminate early with [30] days notice and payment of [25-50]% of remaining term fees. Either party may terminate immediately for material uncured breach.'
            },
        },
        
        'loan': {
            'usurious_rate': {
                'patterns': [
                    r'(?:24|36|48)%\s+(?:APR|annual|per\s+year)',
                    r'(?:2|3|4)%\s+per\s+month',
                    r'default.*(?:doubled?|increased?|higher)',
                ],
                'severity': 5,
                'context': 'Interest rate exceeds legal maximum in many jurisdictions (typically 12-18% APR)',
                'solution_template': 'Reduce interest rate to legal and market standards: (1) verify state usury limits; (2) reasonable market rate (6-12% for secured, 12-18% unsecured); (3) cap default rate at 5% above base rate; (4) prohibit compound interest or disclose clearly; (5) APR must include all fees.',
                'alternative_pattern': 'Interest accrues at [8-12]% per annum (APR). Default rate shall not exceed the lesser of: (a) [BASE + 5]% or (b) maximum rate permitted by law. Interest calculated on simple basis unless disclosed otherwise. APR includes all loan fees.'
            },
            'harsh_default_provisions': {
                'patterns': [
                    r'immediate(?:ly)?.*(?:due|payable|acceleration)',
                    r'any\s+(?:missed|late).*payment',
                    r'no\s+(?:cure|grace)\s+period',
                    r'default.*(?:technical|any\s+breach)',
                ],
                'severity': 5,
                'context': 'Entire loan accelerates immediately on any minor default without cure opportunity',
                'solution_template': 'Add borrower protections: (1) 10-15 day grace period for payments; (2) written notice of default required; (3) 30-day cure period before acceleration; (4) limit cross-default to material breaches only; (5) acceleration requires multiple missed payments (e.g., 2-3).',
                'alternative_pattern': 'Default occurs if Borrower: (a) misses [TWO] consecutive payments; (b) materially breaches other terms. Lender must provide written notice specifying default. Borrower has [30] days to cure. Only after failed cure may Lender accelerate unpaid principal. Late fees limited to [5%] of payment or $[AMOUNT], whichever is less.'
            },
            'excessive_collateral': {
                'patterns': [
                    r'all\s+(?:assets?|property)',
                    r'present\s+and\s+future',
                    r'blanket\s+lien',
                    r'personal\s+guarantee.*business\s+loan',
                ],
                'severity': 4,
                'context': 'Lender takes security interest in all assets including those unrelated to loan purpose',
                'solution_template': 'Limit collateral: (1) secure with specific assets related to loan purpose; (2) exclude exempt assets (tools of trade, primary residence, etc.); (3) avoid personal guarantees for business loans if possible; (4) release mechanism as loan pays down; (5) proportionate collateral value to loan amount.',
                'alternative_pattern': 'Borrower grants Lender security interest in [SPECIFIC COLLATERAL] only. Excluded from security interest: [EXCLUDED ASSETS]. Personal guarantee limited to [%] of loan amount. As principal balance reduces below [AMOUNT], Lender releases [SPECIFIC COLLATERAL].'
            },
        },
        
        'privacy_policy': {
            'overly_broad_collection': {
                'patterns': [
                    r'all\s+(?:information|data)',
                    r'any\s+and\s+all',
                    r'everything.*(?:device|browser)',
                    r'contacts?.*photos?.*location',
                ],
                'severity': 4,
                'context': 'Collects excessive personal data beyond what is necessary for service functionality',
                'solution_template': 'Limit data collection to necessary data: (1) collect only data required for specific functionality; (2) explicit opt-in for sensitive data (contacts, location, biometrics); (3) clear purpose for each data type; (4) data minimization principle; (5) provide granular privacy controls.',
                'alternative_pattern': 'We collect: (a) Account Information (name, email) you provide; (b) Usage Data (features accessed, timestamps) for service operation; (c) Technical Data (IP, browser) for security. Optional: location data with explicit consent for [FEATURE]. We do not collect [SENSITIVE DATA] without your opt-in consent.'
            },
            'unlimited_third_party_sharing': {
                'patterns': [
                    r'(?:share|sell).*partners?',
                    r'third[- ]part(?:y|ies)',
                    r'any\s+(?:third\s+part|other\s+compan)',
                    r'affiliates?.*(?:vendors?|processors?)',
                ],
                'severity': 5,
                'context': 'Personal data shared with or sold to unlimited third parties without disclosure or control',
                'solution_template': 'Restrict third-party sharing: (1) name specific categories of third parties; (2) limit to service providers under contract; (3) opt-out for marketing/advertising uses; (4) no sale of data without explicit opt-in; (5) user control over sharing preferences; (6) require third parties maintain same protections.',
                'alternative_pattern': 'We share data only with: (a) Service Providers (hosting, analytics) under confidentiality agreements; (b) as required by law. We do NOT sell personal information. Marketing Communications: opt-out anytime. Third parties must: protect data per our standards, use only for specified purposes, delete after service completion.'
            },
            'unilateral_policy_changes': {
                'patterns': [
                    r'(?:change|modify|update).*(?:any\s+time|without\s+notice)',
                    r'sole\s+discretion',
                    r'continued\s+use.*(?:acceptance|consent)',
                ],
                'severity': 3,
                'context': 'Privacy policy can change anytime without notice and continued use means acceptance',
                'solution_template': 'Add change protections: (1) 30-day advance notice of material changes; (2) email notification to users; (3) clear "what changed" summary; (4) opt-out option if changes unacceptable; (5) no retroactive application to previously collected data without re-consent.',
                'alternative_pattern': 'Material changes require [30] days advance notice via email and prominent site notice. Notice includes summary of changes and effective date. Continued use after effective date constitutes acceptance. You may opt-out by closing account within notice period. Changes do not apply retroactively to data collected under prior policy without re-consent.'
            },
        },
        
        'terms_of_service': {
            'arbitrary_termination': {
                'patterns': [
                    r'(?:any\s+time|sole\s+discretion).*terminate',
                    r'without\s+(?:cause|reason|notice)',
                    r'suspend.*(?:immediately|without\s+warning)',
                ],
                'severity': 4,
                'context': 'Platform can terminate accounts anytime without reason, notice, or refund',
                'solution_template': 'Add termination protections: (1) require specific cause for termination; (2) provide notice and opportunity to cure violations; (3) warning system for minor infractions; (4) appeal process for disputed terminations; (5) pro-rata refunds for paid services; (6) data export period before deletion.',
                'alternative_pattern': 'We may suspend or terminate accounts for: (a) material terms violations; (b) illegal activity; (c) non-payment. We provide [7-30] days notice and opportunity to cure except for immediate threats. Users receive: warning for first minor violation, temporary suspension for second, termination for third or material breach. Pro-rata refunds given for paid periods.'
            },
            'overly_broad_content_license': {
                'patterns': [
                    r'perpetual.*irrevocable',
                    r'worldwide.*(?:royalty[- ]free|transferable)',
                    r'all\s+rights?.*content',
                    r'own.*(?:user[- ]generated|your\s+content)',
                ],
                'severity': 5,
                'context': 'Platform claims perpetual, broad license to all user content including monetization rights',
                'solution_template': 'Limit content license: (1) license only for operating service, not monetization; (2) revocable upon content deletion; (3) user retains ownership; (4) attribution required; (5) no sublicense to third parties without consent; (6) license terminates with account closure.',
                'alternative_pattern': 'You retain ownership of Your Content. You grant us limited, non-exclusive, revocable license to Your Content solely to: (a) display in your account; (b) enable service features; (c) backup/security. We do not use Your Content for advertising without permission. License terminates when you delete content or close account, except cached copies deleted within [30] days.'
            },
            'liability_disclaimer': {
                'patterns': [
                    r'no\s+(?:warranty|liability)',
                    r'as[- ]is.*where[- ]is',
                    r'\$?\s*(?:0|zero|50|100).*liability',
                    r'disclaim\s+all',
                ],
                'severity': 4,
                'context': 'Platform disclaims all liability with zero or minimal damages cap even for negligence',
                'solution_template': 'Establish reasonable liability: (1) cap at fees paid in 12 months (minimum $500-1000 for paid services); (2) carve out unlimited liability for gross negligence, data breaches, IP infringement; (3) maintain basic warranties (legal compliance, security measures); (4) indemnify for platform actions; (5) insurance requirements.',
                'alternative_pattern': 'Our liability limited to greater of: (a) fees you paid in prior [12] months or (b) $[500-1000]. Unlimited liability for: data breaches, IP infringement, gross negligence, willful misconduct. We warrant: service substantially conforms to documentation, we use industry-standard security measures, we comply with applicable laws.'
            },
        },
    }
    
    return patterns.get(doc_type, {})


def generate_dynamic_alternative_clause(
    original_clause: str,
    doc_type: str,
    risk_category: str,
    clause_context: Dict
) -> str:
    """
    Generate a context-aware alternative clause using patterns and context
    """
    patterns = get_enhanced_risk_patterns_by_type(doc_type)
    
    if risk_category in patterns:
        pattern_info = patterns[risk_category]
        template = pattern_info['alternative_pattern']
        
        # Extract key terms from original clause for context
        if doc_type == 'service_agreement':
            # Fill in placeholders based on context
            template = template.replace('[DAYS]', '30')
            template = template.replace('[NUMBER]', '2')
            template = template.replace('[RATE]', 'standard hourly rate')
            template = template.replace('[%]', '50')
            
        elif doc_type == 'nda':
            template = template.replace('[EXCLUSIONS]', 'is publicly available, was independently developed, or was already known to the receiving party')
            template = template.replace('[DURATION]', 'three (3) years')
            
        elif doc_type == 'employment':
            template = template.replace('[MILES]', '50')
            template = template.replace('[MONTHS]', '12')
            template = template.replace('[SPECIFIC ACTIVITY]', 'providing substantially similar services')
            template = template.replace('[SPECIFIC PRODUCTS/SERVICES]', 'Company\'s core products')
            template = template.replace('[WEEKS]', '2')
            
        elif doc_type == 'lease':
            template = template.replace('[24-48]', '24')
            template = template.replace('[START]', '9:00 AM')
            template = template.replace('[END]', '5:00 PM')
            template = template.replace('[AMOUNT]', '250')
            
        return template
    
    # Fallback generic alternative
    return "Revise clause to be mutual, time-limited, and reasonably scoped with clear definitions and adequate protections for both parties."


def get_type_specific_mitigation_strategies(doc_type: str) -> Dict[str, str]:
    """
    Get document-type specific mitigation strategies for common issues
    """
    
    strategies = {
        'nda': {
            'general': 'Request mutual obligations, standard exclusions, and reasonable 2-5 year duration.',
            'definition': 'Narrow definition to specific information types. Add carve-outs for publicly available, independently developed, and pre-existing information.',
            'duration': 'Negotiate 2-3 years for business info, 5 years maximum for trade secrets. Add sunset clause.',
            'remedies': 'Limit remedies to actual damages. Remove automatic injunctive relief. Add mutual indemnification caps.',
        },
        'employment': {
            'general': 'Negotiate fair compensation, clear job duties, mutual termination terms, and reasonable post-employment restrictions.',
            'noncompete': 'Limit to 6-12 months, specific geography (50-mile radius), specific competing products only. Ensure adequate consideration.',
            'ip_assignment': 'Carve out prior IP, personal projects on own time/equipment, and inventions unrelated to company business.',
            'compensation': 'Get guaranteed base salary, clear bonus formula, equity vesting schedule, expense reimbursement, and severance terms.',
        },
        'service_agreement': {
            'general': 'Define clear scope in SOW, limit revisions, set reasonable liability caps, ensure payment for completed work.',
            'scope': 'Specific deliverables list, acceptance criteria, limited revisions (2-3 rounds), change order process for additional work.',
            'liability': 'Increase cap to 12 months fees minimum, carve out unlimited for gross negligence/IP/confidentiality, ensure mutual.',
            'termination': 'Make mutual with 30-60 days notice, payment for completed work, reasonable wind-down period, IP return provisions.',
        },
        'lease': {
            'general': 'Limit security deposit to 1-2 months, require notice for entry, clarify repair responsibilities, allow subleasing.',
            'deposit': 'Maximum 2 months rent, itemized refund list, exclude normal wear and tear, 30-day return timeline, interest on deposit.',
            'repairs': 'Landlord handles structural, roof, systems, code compliance. Tenant handles interior, minor maintenance under $X.',
            'entry': 'Require 24-48 hour notice, reasonable hours only (9am-6pm), tenant consent except emergencies, frequency limits.',
        },
        'saas': {
            'general': 'Ensure 99.5%+ uptime with credits, customer data ownership and export rights, reasonable terms, adequate liability.',
            'sla': 'Minimum 99.5% uptime, automatic service credits (5-25% monthly fee), limited scheduled maintenance, transparent status page.',
            'data': 'Customer owns all data, can export anytime in standard format, deleted within 30-60 days post-termination, no provider use for other purposes.',
            'termination': 'Annual terms maximum, 30-60 day auto-renewal notice, early termination with reasonable fee (25-50% remaining), data export period.',
        },
        'loan': {
            'general': 'Ensure interest rate below usury limits, reasonable collateral, grace periods, cure rights before acceleration.',
            'rate': 'Verify state usury limits, negotiate market rate (8-15% depending on security), cap default rate at base + 5%, simple interest.',
            'default': '10-15 day grace period, written notice required, 30-day cure period, limit cross-default, require 2-3 missed payments before acceleration.',
            'collateral': 'Limit to specific assets related to loan, exclude exempt property, proportionate to loan amount, release mechanism as balance decreases.',
        },
        'privacy_policy': {
            'general': 'Minimize data collection to necessary purposes, provide opt-outs, limit third-party sharing, give notice of changes.',
            'collection': 'Collect only data necessary for service, explicit opt-in for sensitive data (location, contacts, biometrics), clear purpose statements.',
            'sharing': 'Name specific third-party categories, limit to service providers under contract, no sale without opt-in, user controls, GDPR/CCPA rights.',
            'changes': '30-day advance notice of material changes, email notification, clear summary, opt-out option, no retroactive application.',
        },
        'terms_of_service': {
            'general': 'Require specific termination cause, provide notice and cure period, limit content license to operation, reasonable liability.',
            'termination': 'Specific violation list, notice and cure opportunity, warning system, appeal process, pro-rata refunds, data export period.',
            'content': 'License limited to operating service only, revocable on deletion, user retains ownership, attribution required, no monetization without permission.',
            'liability': 'Cap at 12 months fees or $500-1000 minimum, unlimited for data breaches/gross negligence/IP, maintain basic warranties.',
        },
        'generic': {
            'general': 'Negotiate balanced terms with clear limits, mutual obligations, reasonable timeframes, and adequate protections for both parties.',
        },
    }
    
    return strategies.get(doc_type, strategies['generic'])

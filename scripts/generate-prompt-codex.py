#!/usr/bin/env python3
"""Generate The Prompt Codex as a polished, 100-entry PDF."""

from __future__ import annotations

import html
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "AI-Framework-Prompt-Codex.pdf"
VAULT_COPY = ROOT / "vault" / "AI-Framework-Prompt-Codex.pdf"

PAGE_W, PAGE_H = letter
VOID = colors.HexColor("#101317")
PANEL = colors.HexColor("#171b22")
IVORY = colors.HexColor("#ECE7DA")
PAPER = colors.HexColor("#E3DAC7")
INK = colors.HexColor("#272117")
DIM = colors.HexColor("#6C6458")
BRASS = colors.HexColor("#D0AA6D")
BRASS_LIGHT = colors.HexColor("#E6C58F")
LINE = colors.HexColor("#B9A98A")
PURPLE = colors.HexColor("#A77BDD")

pdfmetrics.registerFont(TTFont("DV-Sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DV-Sans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DV-Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("DV-Mono-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFont(TTFont("DV-Serif", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"))


VOLUMES = [
    {
        "roman": "I",
        "title": "Strategy & Decisions",
        "role": "senior strategy advisor",
        "summary": "Turn uncertain goals into explicit choices, tradeoffs, roadmaps, and decision records.",
        "entries": [
            ("Goal Architecture", "convert an ambitious goal into a measurable operating system", ["GOAL", "CURRENT STATE", "DEADLINE", "RESOURCES", "CONSTRAINTS"], ["one-sentence strategy", "stage map with outputs", "weekly scorecard", "first 48-hour actions", "failure-point prevention plan"], "Reject activity that does not move a named outcome."),
            ("Priority Matrix", "rank competing priorities using value, urgency, effort, dependency, and risk", ["CANDIDATE PRIORITIES", "STRATEGIC OBJECTIVE", "AVAILABLE CAPACITY", "FIXED DEADLINES", "NON-NEGOTIABLES"], ["scoring criteria and weights", "ranked priority table", "now/next/later plan", "items to stop or defer", "reconsideration triggers"], "Explain why the top item wins and what is sacrificed."),
            ("Decision Memo", "produce a short decision memo that makes tradeoffs visible", ["DECISION", "OPTIONS", "DECISION OWNER", "DEADLINE", "KNOWN EVIDENCE", "CONSTRAINTS"], ["recommended option", "option comparison", "assumptions and unknowns", "risks and mitigations", "decision and review date"], "Separate evidence, inference, and preference."),
            ("Scenario Planner", "model plausible futures without pretending to predict them", ["DECISION OR PLAN", "TIME HORIZON", "KEY UNCERTAINTIES", "EXTERNAL FORCES", "CURRENT ASSUMPTIONS"], ["base, upside, and downside scenarios", "early indicators", "no-regret moves", "scenario-specific actions", "monitoring cadence"], "Do not assign fake precision to probabilities."),
            ("Resource Allocation", "allocate limited money, time, and people against strategic outcomes", ["OUTCOMES", "BUDGET", "PEOPLE AND SKILLS", "TIME WINDOW", "CURRENT COMMITMENTS"], ["allocation table", "capacity conflicts", "minimum viable funding", "cut list", "reallocation triggers"], "Expose over-allocation and unfunded work."),
            ("90-Day Roadmap", "translate strategy into a realistic 90-day execution roadmap", ["90-DAY OUTCOME", "STARTING POINT", "TEAM", "BUDGET", "DEPENDENCIES", "KNOWN DATES"], ["three 30-day phases", "weekly milestones", "owners and deliverables", "decision gates", "scorecard"], "Limit work in progress and protect the critical path."),
            ("Pre-Mortem", "assume the plan failed and identify preventable causes before launch", ["PLAN", "SUCCESS DEFINITION", "STAKEHOLDERS", "TIMELINE", "DEPENDENCIES"], ["failure stories", "root causes", "warning signals", "prevention controls", "contingency actions"], "Prioritize causes that are both plausible and controllable."),
            ("Risk Appetite", "define which risks can be accepted, reduced, transferred, or avoided", ["INITIATIVE", "OBJECTIVES", "RISK CATEGORIES", "LEGAL OR SAFETY DUTIES", "AVAILABLE CONTROLS"], ["risk appetite statements", "thresholds", "approval rules", "escalation matrix", "review schedule"], "Never treat legal, consent, or safety duties as optional risk appetite."),
            ("Meeting to Decision", "turn a meeting topic into a decision-ready agenda and record", ["MEETING PURPOSE", "PARTICIPANTS", "DECISIONS NEEDED", "PRE-READS", "TIME AVAILABLE"], ["timed agenda", "pre-work", "decision criteria", "facilitation prompts", "decision and action record"], "Remove updates that can be read asynchronously."),
            ("Post-Decision Review", "evaluate a past decision without hindsight bias", ["ORIGINAL DECISION", "INFORMATION AVAILABLE THEN", "EXPECTED OUTCOME", "ACTUAL OUTCOME", "TIME ELAPSED"], ["decision-quality review", "outcome review", "assumption accuracy", "lessons", "process changes"], "Judge the process using information available at the time."),
        ],
    },
    {
        "roman": "II",
        "title": "Market Validation",
        "role": "skeptical market validation lead",
        "summary": "Test demand, customers, pricing, competitors, and channels before investing heavily.",
        "entries": [
            ("Market Reality Scan", "test whether a market is urgent, reachable, and economically attractive", ["IDEA", "TARGET MARKET", "PROBLEM", "GEOGRAPHY", "PRICE RANGE"], ["market assumptions", "demand signals", "existing spend", "barriers", "seven-day evidence plan"], "Do not use market-size numbers without a traceable source and date."),
            ("Ideal Customer Profile", "define the narrowest customer profile with a compelling reason to buy", ["OFFER IDEA", "POSSIBLE CUSTOMERS", "PROBLEM", "BUYING TRIGGER", "ACCESS CHANNELS"], ["best-fit profile", "disqualifiers", "buying committee", "trigger events", "research list"], "Distinguish users, influencers, and budget owners."),
            ("Customer Interview Guide", "design interviews that reveal behavior rather than polite opinions", ["HYPOTHESIS", "INTERVIEWEE", "WORKFLOW", "KNOWN ALTERNATIVES", "SESSION LENGTH"], ["screening questions", "behavioral interview script", "follow-up probes", "evidence capture", "bias warnings"], "Do not pitch the solution during discovery."),
            ("Problem Evidence", "grade the evidence that a problem is frequent, costly, and underserved", ["PROBLEM CLAIM", "CUSTOMER SEGMENT", "INTERVIEWS", "OBSERVED DATA", "CURRENT SOLUTIONS"], ["evidence ladder", "contradicting evidence", "severity and frequency", "confidence rating", "next proof needed"], "Anecdotes are signals, not market proof."),
            ("Competitor Map", "map direct, indirect, manual, and do-nothing alternatives", ["PRODUCT", "CUSTOMER", "JOB TO BE DONE", "KNOWN COMPETITORS", "BUYING CRITERIA"], ["alternative categories", "comparison matrix", "switching costs", "white space", "verification checklist"], "Include spreadsheets, agencies, internal labor, and doing nothing."),
            ("Pricing Experiment", "design a safe pricing test around value and willingness to pay", ["OFFER", "CUSTOMER", "CURRENT PRICE", "DELIVERY COST", "VALUE CREATED"], ["pricing hypotheses", "three test points", "test script", "success thresholds", "ethical guardrails"], "Do not fabricate scarcity, discounts, or customer results."),
            ("Landing Page Test", "create a minimum landing page that tests one value proposition", ["OFFER", "AUDIENCE", "PAIN", "PROMISED DELIVERABLE", "CALL TO ACTION", "PROOF"], ["headline", "problem and outcome copy", "scope", "objection answers", "measurement plan"], "Use a truthful call to action and disclose if the product is not yet available."),
            ("Channel Test", "compare customer acquisition channels using evidence and economics", ["CUSTOMER", "OFFER", "CHANNEL IDEAS", "BUDGET", "TIME", "SALES CYCLE"], ["channel scorecard", "smallest test per channel", "message", "cost assumptions", "stop/scale rules"], "Do not confuse attention with qualified demand."),
            ("Demand Forecast", "build a transparent bottom-up demand forecast", ["TARGET ACCOUNTS OR AUDIENCE", "REACH RATE", "RESPONSE RATE", "CONVERSION RATE", "PRICE", "CAPACITY"], ["funnel math", "base/upside/downside", "capacity limit", "sensitivity analysis", "data collection plan"], "Show formulas and label every unverified assumption."),
            ("Go / No-Go Review", "make a launch, revise, or stop decision from validation evidence", ["HYPOTHESES", "TESTS RUN", "RESULTS", "COST TO CONTINUE", "DECISION DEADLINE"], ["evidence summary", "threshold comparison", "recommendation", "conditions to proceed", "next experiment or shutdown plan"], "Do not move the success threshold after seeing the result."),
        ],
    },
    {
        "roman": "III",
        "title": "Offers & Positioning",
        "role": "product positioning and offer designer",
        "summary": "Package value so the right buyer understands the outcome, scope, proof, and tradeoffs.",
        "entries": [
            ("Value Proposition", "write a value proposition grounded in a specific job and outcome", ["CUSTOMER", "JOB TO BE DONE", "CURRENT ALTERNATIVE", "OUTCOME", "DIFFERENTIATOR", "PROOF"], ["one-sentence proposition", "before/after contrast", "reason to believe", "three message variants", "claims to substantiate"], "Remove vague claims that cannot be demonstrated."),
            ("Productized Service", "turn expertise into a repeatable service with clear boundaries", ["CAPABILITY", "BUYER", "PROBLEM", "DELIVERABLE", "TIMELINE", "PRICE RANGE"], ["offer name", "scope and exclusions", "delivery process", "client responsibilities", "three package options"], "Do not promise outcomes outside the provider's control."),
            ("Three-Tier Package", "design three meaningful tiers without using a fake decoy", ["CORE OFFER", "CUSTOMER TYPES", "DELIVERY COST", "FEATURE OPTIONS", "TARGET MARGINS"], ["tier logic", "deliverables", "price rationale", "best-fit buyer", "upgrade path"], "Every tier must be viable and honestly differentiated."),
            ("Category Design", "choose the clearest category and explain when a new category is justified", ["PRODUCT", "BUYER", "KNOWN CATEGORIES", "ALTERNATIVES", "UNIQUE MECHANISM"], ["category recommendation", "familiar anchor", "differentiation", "education burden", "positioning line"], "Prefer clarity over novelty when buyers already use a useful category."),
            ("Messaging Hierarchy", "organize messages from primary promise to supporting proof", ["OFFER", "AUDIENCE", "TOP PAINS", "BENEFITS", "FEATURES", "PROOF"], ["message hierarchy", "homepage order", "feature-to-benefit mapping", "proof placement", "language to avoid"], "Lead with buyer meaning, not internal product terminology."),
            ("Proof Architecture", "build a truthful proof plan for a new or established offer", ["OFFER", "CLAIMS", "CURRENT PROOF", "CUSTOMER ACCESS", "DATA AVAILABLE"], ["claim-proof matrix", "proof gaps", "case-study plan", "demonstration ideas", "disclosure requirements"], "Never invent testimonials, logos, users, or results."),
            ("Risk Reversal", "reduce buyer uncertainty without guaranteeing what cannot be controlled", ["OFFER", "BUYER RISKS", "DELIVERY CONTROL", "PRICE", "REFUND CAPABILITY"], ["risk inventory", "safe reassurance options", "terms", "eligibility rules", "misuse prevention"], "Avoid earnings guarantees and vague unlimited promises."),
            ("Onboarding Design", "design an onboarding experience that reaches first value quickly", ["OFFER", "CUSTOMER", "REQUIRED INPUTS", "TIME TO VALUE", "COMMON BLOCKERS"], ["welcome sequence", "intake", "first-win milestone", "responsibility map", "escalation path"], "Ask only for information needed to deliver the next step."),
            ("Objection Map", "separate real objections from confusion, risk, and poor fit", ["OFFER", "CUSTOMER", "KNOWN OBJECTIONS", "PRICE", "ALTERNATIVES"], ["objection categories", "truthful responses", "proof needed", "disqualification signals", "FAQ"], "Do not pressure a prospect whose objection reveals poor fit."),
            ("Offer Audit", "audit an existing offer for clarity, credibility, delivery, and economics", ["OFFER PAGE OR DESCRIPTION", "TARGET CUSTOMER", "PRICE", "DELIVERY PROCESS", "RESULTS"], ["audit scorecard", "critical gaps", "quick wins", "rewrite priorities", "30-day test plan"], "Flag claims that require legal review or stronger substantiation."),
        ],
    },
    {
        "roman": "IV",
        "title": "Content & SEO",
        "role": "research-led editorial and search strategist",
        "summary": "Create useful, source-aware content that earns attention and leads readers toward a relevant next step.",
        "entries": [
            ("Topic Authority Map", "build an authority map around audience questions and business value", ["EXPERTISE", "AUDIENCE", "OFFER", "KNOWN QUESTIONS", "COMPETITORS"], ["pillar topics", "supporting clusters", "search intent", "internal links", "90-day sequence"], "Exclude topics that attract traffic but no relevant audience."),
            ("Search Intent Brief", "turn a search query into a writer-ready content brief", ["PRIMARY QUERY", "AUDIENCE", "COUNTRY", "BUSINESS GOAL", "KNOWN SOURCES"], ["intent analysis", "reader questions", "outline", "evidence needs", "conversion path"], "Do not copy competitor structure without improving usefulness."),
            ("Source-Backed Article", "draft an original article that distinguishes fact, inference, and advice", ["TOPIC", "AUDIENCE", "SOURCES WITH DATES", "ANGLE", "CALL TO ACTION"], ["claim outline", "article draft", "source notes", "fact-check list", "meta title and description"], "Never invent a citation, quote, statistic, or test result."),
            ("YouTube Episode", "design an original video with analysis, demonstration, and viewer value", ["TOPIC", "VIEWER", "CHANNEL PROMISE", "SOURCE MATERIAL", "TARGET LENGTH"], ["hook", "beat sheet", "original analysis", "visual plan", "title and thumbnail concepts"], "Avoid repetitive AI-generated narration with no original contribution."),
            ("Newsletter Issue", "turn one important development into a useful, scannable newsletter", ["DEVELOPMENT", "AUDIENCE", "SOURCES", "YOUR VIEW", "CALL TO ACTION"], ["subject lines", "what changed", "why it matters", "what to do", "source shelf"], "State the date and distinguish confirmed change from speculation."),
            ("Content Repurposing", "adapt one source piece into platform-native assets", ["SOURCE CONTENT", "PLATFORMS", "AUDIENCE", "VOICE", "CONVERSION GOAL"], ["core ideas", "platform versions", "hooks", "visual suggestions", "publishing sequence"], "Preserve meaning and do not turn nuance into a false certainty."),
            ("Editorial Calendar", "build a sustainable calendar tied to audience needs and offers", ["CONTENT PILLARS", "AUDIENCE", "OFFER", "CAPACITY", "CHANNELS", "DATES"], ["weekly cadence", "content mix", "briefs", "production workflow", "measurement"], "Plan to available capacity, not idealized output."),
            ("Comparison Page", "create a fair comparison that helps a reader choose", ["OPTIONS", "READER", "DECISION CRITERIA", "CURRENT PRICING SOURCES", "AFFILIATE RELATIONSHIPS"], ["who each option fits", "criteria table", "tradeoffs", "verification date", "disclosure and recommendation"], "Do not rank by commission size or hide a material relationship."),
            ("Case Study", "turn verified project evidence into a credible case study", ["CLIENT OR PROJECT", "STARTING POINT", "WORK PERFORMED", "RESULTS", "EVIDENCE", "PERMISSIONS"], ["context", "constraints", "method", "results", "limits and lessons"], "Do not imply causation that the evidence cannot support."),
            ("Conversion Audit", "improve a content page's path to a relevant next action", ["PAGE", "AUDIENCE", "TRAFFIC SOURCE", "DESIRED ACTION", "CURRENT METRICS"], ["intent match", "friction points", "CTA hierarchy", "trust gaps", "test backlog"], "Protect usefulness; do not bury the answer behind conversion tactics."),
        ],
    },
    {
        "roman": "V",
        "title": "Sales & Acquisition",
        "role": "ethical B2B sales and acquisition advisor",
        "summary": "Research, qualify, communicate, and follow up without spam, pressure, or fabricated personalization.",
        "entries": [
            ("Account Research", "prepare a relevant account brief from verified public information", ["ACCOUNT", "OFFER", "PUBLIC SOURCES", "TARGET ROLE", "TRIGGER EVENT"], ["company context", "likely priorities", "evidence", "fit hypothesis", "questions to validate"], "Do not infer sensitive personal traits or invent private knowledge."),
            ("Prospecting Message", "write a short outreach message based on a real trigger and useful hypothesis", ["PROSPECT", "TRIGGER", "PROBLEM HYPOTHESIS", "OFFER", "PROOF", "CALL TO ACTION"], ["subject lines", "email", "short social message", "follow-up", "personalization checks"], "No fake familiarity, false urgency, or invented compliment."),
            ("Discovery Call", "design a discovery conversation that determines fit before pitching", ["OFFER", "CUSTOMER TYPE", "KNOWN CONTEXT", "SESSION LENGTH", "QUALIFICATION RULES"], ["opening", "current-state questions", "impact questions", "decision process", "next-step criteria"], "Ask permission before moving from discovery to recommendation."),
            ("Qualification Scorecard", "build a transparent qualification method", ["OFFER", "BEST-FIT CUSTOMER", "DISQUALIFIERS", "CAPACITY", "SALES CYCLE"], ["criteria and weights", "evidence required", "score bands", "next actions", "override rules"], "Do not manipulate scores to keep weak opportunities alive."),
            ("Proposal Builder", "create a concise proposal tied to the buyer's stated needs", ["BUYER", "CURRENT STATE", "DESIRED OUTCOME", "SCOPE", "TIMELINE", "PRICE", "ASSUMPTIONS"], ["executive summary", "scope", "plan", "responsibilities", "fees and terms"], "Do not add unverified claims or hide exclusions."),
            ("Follow-Up Sequence", "design respectful follow-up that adds value and stops appropriately", ["CONTEXT", "LAST INTERACTION", "BUYER TIMELINE", "USEFUL RESOURCES", "MAX TOUCHES"], ["sequence timing", "message purpose", "drafts", "stop conditions", "CRM notes"], "Include a graceful close-the-loop message."),
            ("Objection Response", "respond to a sales objection with clarity rather than pressure", ["OBJECTION", "OFFER", "BUYER CONTEXT", "EVIDENCE", "LIMITS"], ["objection diagnosis", "response", "question", "proof", "walk-away condition"], "Acknowledge when the objection is valid."),
            ("CRM Summary", "turn call notes into an accurate, action-oriented CRM record", ["CALL NOTES", "ACCOUNT", "CONTACTS", "OPPORTUNITY STAGE", "NEXT DATE"], ["summary", "needs and impact", "stakeholders", "risks", "next actions"], "Do not add conclusions that were not supported in the call."),
            ("Referral Request", "ask for a specific introduction without burdening the referrer", ["RELATIONSHIP", "RESULT DELIVERED", "IDEAL INTRODUCTION", "WHY NOW", "EASY OUT"], ["request message", "forwardable blurb", "target description", "follow-up", "thank-you"], "Make declining easy and never imply obligation."),
            ("Win / Loss Review", "learn from a closed opportunity using evidence rather than excuses", ["OPPORTUNITY", "TIMELINE", "BUYER FEEDBACK", "COMPETITION", "ACTIVITY", "OUTCOME"], ["decision factors", "process gaps", "message gaps", "controllable lessons", "changes to test"], "Separate buyer-stated reasons from team speculation."),
        ],
    },
    {
        "roman": "VI",
        "title": "Operations & SOPs",
        "role": "operations architect and quality manager",
        "summary": "Make recurring work visible, repeatable, controlled, and easier to improve.",
        "entries": [
            ("SOP Builder", "convert raw notes into a controlled standard operating procedure", ["PROCESS NAME", "RAW NOTES", "OWNER", "SYSTEMS", "APPROVALS"], ["purpose and scope", "prerequisites", "numbered steps", "decision rules", "quality and records"], "Put missing facts in an open-items table instead of inventing them."),
            ("Process Map", "map work from trigger to completed outcome", ["PROCESS", "TRIGGER", "PARTICIPANTS", "SYSTEMS", "CURRENT PAIN"], ["step map", "handoffs", "wait states", "rework loops", "improvement opportunities"], "Distinguish actual current practice from the desired process."),
            ("Operational Checklist", "turn a high-risk or repeatable task into a usable checklist", ["TASK", "USER", "FAILURE MODES", "REQUIRED EVIDENCE", "COMPLETION STANDARD"], ["before/during/after checks", "critical stops", "sign-offs", "exception route", "version control"], "Keep each item observable and binary where possible."),
            ("Handoff Protocol", "design a handoff that prevents lost context and unclear ownership", ["FROM ROLE", "TO ROLE", "WORK ITEM", "REQUIRED DATA", "SERVICE LEVEL"], ["handoff package", "acceptance check", "timing", "rejection reasons", "escalation"], "A handoff is not complete until the receiving party accepts it."),
            ("RACI and Ownership", "clarify accountability without creating a committee for every task", ["PROCESS OR PROJECT", "ACTIVITIES", "ROLES", "DECISION RIGHTS", "APPROVALS"], ["RACI table", "single accountable owner", "decision rights", "conflicts", "simplification"], "Assign only one accountable owner per activity."),
            ("Quality Control Plan", "define how output quality will be checked and accepted", ["DELIVERABLE", "CUSTOMER REQUIREMENTS", "FAILURE MODES", "DATA", "REVIEW CAPACITY"], ["acceptance criteria", "control points", "sample plan", "defect handling", "metrics"], "Controls must detect meaningful failure, not merely document activity."),
            ("Incident Response", "create a calm, accountable response plan for an operational incident", ["INCIDENT TYPE", "SYSTEM OR PROCESS", "SEVERITY LEVELS", "CONTACTS", "LEGAL DUTIES"], ["triage", "containment", "communication", "recovery", "post-incident review"], "Do not delay required emergency, legal, privacy, or security notifications."),
            ("Vendor Evaluation", "compare vendors on fit, risk, total cost, and exitability", ["NEED", "VENDORS", "REQUIREMENTS", "BUDGET", "DATA SENSITIVITY", "CONTRACT TERM"], ["weighted criteria", "evidence requests", "total-cost view", "risk register", "recommendation"], "Include migration, lock-in, support, and termination costs."),
            ("Capacity Plan", "match demand to realistic people and system capacity", ["WORK TYPES", "DEMAND", "SERVICE LEVELS", "PEOPLE", "PRODUCTIVITY", "ABSENCE"], ["capacity math", "bottlenecks", "coverage risk", "options", "trigger thresholds"], "Do not assume 100 percent productive availability."),
            ("Monthly Operations Review", "turn operational data into decisions and improvement actions", ["OBJECTIVES", "METRICS", "INCIDENTS", "BACKLOG", "CUSTOMER FEEDBACK", "CAPACITY"], ["scorecard", "variance explanation", "root causes", "decisions", "owned actions"], "Focus on system causes, not blame."),
        ],
    },
    {
        "roman": "VII",
        "title": "Automation & Agents",
        "role": "automation architect and AI systems evaluator",
        "summary": "Automate the right work with explicit data flows, approvals, evaluations, monitoring, and rollback.",
        "entries": [
            ("Automation Opportunity Ranker", "identify automations worth building and maintaining", ["WORKFLOW", "FREQUENCY", "TIME SPENT", "ERRORS", "TOOLS", "RISK"], ["opportunity list", "value-effort-risk score", "top three", "do-not-automate list", "test sequence"], "Penalize fragile maintenance and privacy risk."),
            ("Workflow Specification", "write a build-ready trigger, action, exception, and ownership specification", ["OUTCOME", "TRIGGER", "INPUTS", "SYSTEMS", "RULES", "OUTPUT"], ["workflow map", "field mapping", "business rules", "exceptions", "test cases"], "Define idempotency and duplicate prevention."),
            ("AI Stack Designer", "choose the smallest reliable tool stack for a workflow", ["OUTCOME", "USERS", "INPUTS", "OUTPUTS", "BUDGET", "SECURITY NEEDS"], ["stage-by-stage tools", "fallbacks", "data movement", "cost", "setup order"], "Flag pricing and features that require current verification."),
            ("Agent Charter", "define a narrow AI agent role with authority limits", ["AGENT PURPOSE", "USERS", "TOOLS", "DATA", "ALLOWED ACTIONS", "PROHIBITED ACTIONS"], ["mission", "inputs and outputs", "permissions", "stop conditions", "owner"], "The agent must not expand its own authority."),
            ("Human Approval Matrix", "decide which automated actions require human review", ["WORKFLOW", "ACTIONS", "IMPACT", "REVERSIBILITY", "DATA SENSITIVITY", "LEGAL DUTIES"], ["risk tiers", "approval rules", "reviewer", "evidence shown", "timeouts"], "Require approval for irreversible, external, financial, legal, or high-impact actions."),
            ("Evaluation Suite", "create representative tests for an AI workflow before release", ["SYSTEM PURPOSE", "USER GROUPS", "INPUT TYPES", "FAILURE MODES", "ACCEPTANCE THRESHOLDS"], ["test dataset plan", "gold examples", "scoring rubric", "red-team cases", "release gate"], "Include minority, edge, ambiguous, and adversarial cases."),
            ("Exception Handling", "design safe behavior when automation encounters uncertainty or failure", ["WORKFLOW", "KNOWN EXCEPTIONS", "SYSTEM LIMITS", "OWNERS", "SERVICE LEVEL"], ["exception taxonomy", "detection rules", "fallbacks", "queue design", "escalation"], "Fail visibly and safely; never silently discard work."),
            ("Data Flow and Privacy", "map what data enters, moves through, and leaves an AI system", ["SYSTEMS", "DATA FIELDS", "USERS", "VENDORS", "RETENTION", "JURISDICTIONS"], ["data-flow map", "purpose per field", "access table", "retention", "risk controls"], "Minimize data and identify sensitive information explicitly."),
            ("Monitoring Plan", "monitor quality, drift, cost, latency, safety, and business outcomes", ["SYSTEM", "BASELINE", "RISKS", "OWNERS", "SERVICE LEVELS", "BUDGET"], ["metrics", "thresholds", "alerts", "review cadence", "response playbook"], "Monitor outcome quality, not just uptime."),
            ("Rollback and Recovery", "prepare a tested path back to safe manual operation", ["AUTOMATION", "DEPENDENCIES", "FAILURE MODES", "MANUAL PROCESS", "RECOVERY OBJECTIVE"], ["rollback triggers", "disable steps", "data reconciliation", "manual fallback", "recovery test"], "Name who has authority to stop the system."),
        ],
    },
    {
        "roman": "VIII",
        "title": "Project Management",
        "role": "senior project controls lead",
        "summary": "Control scope, schedule, risk, decisions, changes, recovery, and closeout.",
        "entries": [
            ("Project Charter", "turn an initiative into an approved, bounded project", ["PROJECT", "SPONSOR", "OUTCOME", "DEADLINE", "BUDGET", "STAKEHOLDERS"], ["purpose", "success measures", "scope and exclusions", "governance", "approval"], "Do not begin with unresolved authority or success criteria."),
            ("Work Breakdown Structure", "decompose a project into deliverable-based work packages", ["PROJECT OUTCOME", "MAJOR DELIVERABLES", "TEAM", "CONSTRAINTS", "KNOWN MILESTONES"], ["WBS", "work-package definitions", "owners", "acceptance criteria", "open scope questions"], "Decompose deliverables, not a random activity list."),
            ("Schedule Logic", "build a dependency-aware schedule with a visible critical path", ["WORK PACKAGES", "DURATIONS", "DEPENDENCIES", "CALENDARS", "FIXED DATES", "RESOURCES"], ["network logic", "critical path", "milestones", "float risks", "schedule checks"], "Do not force dates by hiding impossible logic."),
            ("Risk Register", "create an actionable project risk register", ["PROJECT", "OBJECTIVES", "ASSUMPTIONS", "DEPENDENCIES", "STAKEHOLDERS"], ["risk statements", "probability and impact", "owner", "response", "trigger and due date"], "Write cause-event-impact statements, not vague topics."),
            ("Executive Status Report", "turn project data into a concise decision-ready brief", ["REPORTING PERIOD", "BASELINE", "CURRENT FORECAST", "PROGRESS", "RISKS", "DECISIONS"], ["RAG status", "accomplishments", "milestone variance", "risks", "decisions needed"], "Distinguish actuals, forecasts, and assumptions."),
            ("Decision Meeting", "design a project meeting that closes decisions and actions", ["MEETING PURPOSE", "PARTICIPANTS", "DECISIONS", "PRE-READ", "TIME"], ["agenda", "decision criteria", "facilitation", "parking lot", "record template"], "End with owners, dates, and the recorded decision."),
            ("Change Request", "evaluate a proposed scope, schedule, cost, or quality change", ["CHANGE", "REASON", "BASELINE", "AFFECTED DELIVERABLES", "OPTIONS"], ["impact analysis", "options", "recommendation", "approval route", "baseline update"], "No change is free; show secondary impacts."),
            ("Decision Log", "create a durable record of project decisions and consequences", ["DECISIONS OR NOTES", "DATE", "DECISION MAKERS", "OPTIONS", "RATIONALE"], ["decision entries", "assumptions", "affected work", "actions", "review triggers"], "Record rejected options and why they were rejected."),
            ("Recovery Plan", "stabilize a late or failing project without pretending everything is green", ["CURRENT STATUS", "BASELINE", "ROOT CAUSES", "REMAINING WORK", "CAPACITY", "DEADLINE"], ["stabilization actions", "reforecast", "scope options", "recovery milestones", "executive decisions"], "Protect critical quality and safety requirements from schedule pressure."),
            ("Closeout Review", "close a project with accepted deliverables, records, and transferable learning", ["PROJECT", "DELIVERABLES", "ACCEPTANCE", "CONTRACTS", "OPEN ITEMS", "RESULTS"], ["acceptance record", "open-item disposition", "handover", "financial close", "lessons"], "Separate lessons from blame and assign owners for follow-through."),
        ],
    },
    {
        "roman": "IX",
        "title": "Career & Productivity",
        "role": "evidence-based career and personal operating-system coach",
        "summary": "Target work, demonstrate value, learn deliberately, and control weekly commitments.",
        "entries": [
            ("Role Targeting", "identify roles that fit evidence of skill, motivation, and market demand", ["EXPERIENCE", "SKILLS", "INTERESTS", "CONSTRAINTS", "LOCATION", "TARGET INCOME"], ["role shortlist", "fit evidence", "gaps", "search terms", "30-day test"], "Do not recommend a role based only on a generic personality label."),
            ("Skills Gap Plan", "compare current evidence to a target role and prioritize learnable gaps", ["TARGET ROLE", "JOB DESCRIPTIONS", "CURRENT SKILLS", "PORTFOLIO", "TIME", "BUDGET"], ["skill matrix", "must-have gaps", "proof projects", "learning sequence", "progress checks"], "Prioritize demonstrable capability over collecting certificates."),
            ("Resume Evidence", "rewrite experience into accurate, outcome-oriented resume bullets", ["TARGET ROLE", "CURRENT RESUME", "PROJECTS", "METRICS", "TOOLS"], ["summary", "bullet rewrites", "keyword map", "evidence gaps", "questions"], "Never invent a metric, title, responsibility, or technology."),
            ("Cover Letter", "write a concise letter connecting verified experience to a real need", ["ROLE", "COMPANY", "JOB POSTING", "EXPERIENCE", "WHY THIS ROLE"], ["opening", "two evidence paragraphs", "fit statement", "close", "claims check"], "Avoid flattery unsupported by specific public facts."),
            ("Interview Practice", "run a realistic interview and critique answer quality", ["ROLE", "JOB DESCRIPTION", "EXPERIENCE", "INTERVIEW TYPE", "WEAK AREAS"], ["question set", "follow-up probes", "answer rubric", "model structure", "improvement plan"], "Do not script claims the candidate cannot defend."),
            ("Portfolio Case Study", "turn real work into a clear portfolio story without exposing confidential data", ["PROJECT", "PROBLEM", "ROLE", "PROCESS", "RESULT", "PERMISSIONS"], ["case-study structure", "artifacts", "redactions", "reflection", "presentation"], "Protect client confidentiality and label simulated work."),
            ("Learning Sprint", "design a four-week learning sprint around a demonstrable outcome", ["SKILL", "STARTING LEVEL", "OUTCOME", "TIME PER WEEK", "RESOURCES", "DEADLINE"], ["weekly objectives", "practice tasks", "feedback loop", "capstone", "assessment"], "Favor retrieval, practice, and feedback over passive consumption."),
            ("Weekly Operating System", "convert goals and commitments into a controlled weekly plan", ["GOALS", "CALENDAR", "DEADLINES", "ENERGY PATTERNS", "OPEN TASKS"], ["weekly outcomes", "time blocks", "daily limits", "review ritual", "stop-doing list"], "Plan at less than total capacity to absorb real life."),
            ("Delegation Brief", "delegate an outcome with context, authority, and acceptance criteria", ["OUTCOME", "DELEGATE", "CONTEXT", "DEADLINE", "RESOURCES", "DECISION RIGHTS"], ["brief", "milestones", "check-ins", "acceptance criteria", "escalation"], "Delegate ownership without abandoning support."),
            ("Career Decision", "compare career options using values, evidence, reversibility, and risk", ["OPTIONS", "PRIORITIES", "FINANCIAL NEEDS", "FAMILY OR LOCATION CONSTRAINTS", "EVIDENCE"], ["criteria and weights", "option analysis", "reversible tests", "risk plan", "decision date"], "Expose uncertainty and do not confuse prestige with fit."),
        ],
    },
    {
        "roman": "X",
        "title": "Advanced AI Control",
        "role": "AI reasoning, evaluation, and prompt systems specialist",
        "summary": "Control assumptions, evidence, critique, simulations, reusable assistants, and final quality.",
        "entries": [
            ("Prompt Repair", "diagnose why a prompt produced a weak result and rebuild it", ["ORIGINAL PROMPT", "OUTPUT", "DESIRED RESULT", "CONTEXT", "CONSTRAINTS"], ["failure diagnosis", "missing context", "repaired prompt", "test cases", "iteration rule"], "Change one major variable at a time when testing."),
            ("Assumption Audit", "surface hidden assumptions in a plan, analysis, or recommendation", ["CLAIM OR PLAN", "CONTEXT", "EVIDENCE", "DECISION", "STAKEHOLDERS"], ["assumption inventory", "importance", "confidence", "disconfirming test", "decision impact"], "Treat confident wording as no substitute for evidence."),
            ("Evidence Matrix", "map important claims to source quality, date, and uncertainty", ["DRAFT OR CLAIMS", "SOURCES", "DECISION CONTEXT", "RECENCY NEED"], ["claim table", "source rating", "conflicts", "unsupported claims", "verification plan"], "Never manufacture a source or hide a conflict."),
            ("Structured Debate", "generate the strongest competing cases before a decision", ["PROPOSITION", "CONTEXT", "EVIDENCE", "CONSTRAINTS", "DECISION CRITERIA"], ["case for", "case against", "cross-examination", "common ground", "decision implications"], "Steelman both sides and flag value judgments."),
            ("Red-Team Review", "look for failure, misuse, exclusion, and unintended consequences", ["SYSTEM OR PLAN", "USERS", "DATA", "ACTIONS", "ENVIRONMENT", "SAFEGUARDS"], ["attack surface", "abuse cases", "affected groups", "control gaps", "release blockers"], "Do not provide operational harm instructions; focus on defensive testing."),
            ("Multi-Pass Work", "use staged drafting, critique, and revision for an important deliverable", ["DELIVERABLE", "AUDIENCE", "SOURCE MATERIAL", "CONSTRAINTS", "QUALITY BAR"], ["plan pass", "draft pass", "critique pass", "revision pass", "final check"], "Do not let later prose overwrite verified source facts."),
            ("Reusable Assistant Charter", "create durable instructions for a narrow AI assistant", ["ASSISTANT PURPOSE", "USERS", "KNOWLEDGE", "TOOLS", "OUTPUTS", "BOUNDARIES"], ["mission", "workflow", "style", "authority limits", "evaluation and update rules"], "Require clarification when missing context would change a high-impact result."),
            ("Long-Context Synthesis", "synthesize many documents without losing disagreement or provenance", ["DOCUMENTS", "QUESTION", "DATE RANGE", "AUDIENCE", "OUTPUT"], ["source inventory", "themes", "agreements", "conflicts", "traceable conclusions"], "Cite which document supports each consequential conclusion."),
            ("Decision Simulation", "simulate stakeholder reactions to reveal second-order effects", ["PROPOSED DECISION", "STAKEHOLDERS", "INCENTIVES", "CONSTRAINTS", "TIME HORIZON"], ["stakeholder models", "likely responses", "feedback loops", "surprises", "mitigations"], "Label the simulation as hypotheses, not predictions or real testimony."),
            ("Final Quality Gate", "review a high-stakes draft before it is published, sent, or approved", ["DRAFT", "PURPOSE", "AUDIENCE", "SOURCES", "POLICIES", "DEADLINE"], ["accuracy check", "risk and rights check", "clarity check", "missing evidence", "release recommendation"], "Recommend hold when a critical claim, consent, approval, or safety control is missing."),
        ],
    },
]


class Rule(Flowable):
    def __init__(self, width, color=LINE, thickness=0.7):
        super().__init__()
        self.width = width
        self.height = 8
        self.color = color
        self.thickness = thickness
        self.hAlign = "CENTER"

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 4, self.width, 4)


def page_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VOID)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(BRASS)
    canvas.setLineWidth(1)
    canvas.rect(0.42 * inch, 0.42 * inch, PAGE_W - 0.84 * inch, PAGE_H - 0.84 * inch, stroke=1, fill=0)
    canvas.setStrokeColor(PURPLE)
    canvas.setLineWidth(0.35)
    canvas.rect(0.54 * inch, 0.54 * inch, PAGE_W - 1.08 * inch, PAGE_H - 1.08 * inch, stroke=1, fill=0)
    canvas.restoreState()


def page_divider(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VOID)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(BRASS)
    canvas.setLineWidth(0.8)
    canvas.line(0.72 * inch, 0.7 * inch, PAGE_W - 0.72 * inch, 0.7 * inch)
    canvas.restoreState()


def page_body(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#F4EFE5"))
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.45)
    canvas.line(0.72 * inch, PAGE_H - 0.55 * inch, PAGE_W - 0.72 * inch, PAGE_H - 0.55 * inch)
    canvas.line(0.72 * inch, 0.52 * inch, PAGE_W - 0.72 * inch, 0.52 * inch)
    canvas.setFillColor(DIM)
    canvas.setFont("DV-Sans", 7)
    canvas.drawString(0.72 * inch, PAGE_H - 0.42 * inch, "AI FRAMEWORK  /  THE PROMPT CODEX")
    canvas.drawRightString(PAGE_W - 0.72 * inch, 0.33 * inch, f"{doc.page - 1:03d}")
    canvas.restoreState()


def prompt_text(volume, entry):
    title, objective, inputs, deliverables, control = entry
    input_lines = "\n".join(f"{name}: [{name.lower().replace('_', ' ')}]" for name in inputs)
    deliverable_lines = "\n".join(f"{idx}. {item.capitalize()}." for idx, item in enumerate(deliverables, 1))
    return (
        f"You are a {volume['role']}. Your objective is to {objective}.\n\n"
        f"INPUTS\n{input_lines}\n\n"
        "WORKING METHOD\n"
        "1. Restate the decision, outcome, or deliverable in one sentence.\n"
        "2. Identify missing information that would materially change the result. Ask no more than three questions if essential; otherwise continue and label assumptions.\n"
        "3. Analyze the inputs using the specific constraints and stakeholders provided. Do not rely on generic best practices when the facts point elsewhere.\n"
        "4. Make tradeoffs visible. Separate verified facts, calculations, assumptions, inferences, and recommendations.\n"
        "5. Produce the deliverable below in a form that can be used immediately.\n\n"
        f"DELIVERABLE\n{deliverable_lines}\n\n"
        "QUALITY CONTROL\n"
        f"- {control}\n"
        "- Flag information that may have changed and requires current verification.\n"
        "- Do not invent facts, sources, quotes, people, prices, policies, results, or certainty.\n"
        "- End with the most important risk, the smallest useful next action, and the evidence that would change the recommendation."
    )


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    VAULT_COPY.parent.mkdir(parents=True, exist_ok=True)

    body_frame = Frame(
        0.72 * inch,
        0.68 * inch,
        PAGE_W - 1.44 * inch,
        PAGE_H - 1.34 * inch,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="body",
    )
    full_frame = Frame(
        0.72 * inch,
        0.72 * inch,
        PAGE_W - 1.44 * inch,
        PAGE_H - 1.44 * inch,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="full",
    )

    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        title="The Prompt Codex: 100 Entries in 10 Volumes",
        author="AI Framework",
        subject="A practical prompt encyclopedia for strategy, operations, content, sales, automation, projects, career, and advanced AI control.",
        creator="AI Framework",
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.68 * inch,
        bottomMargin=0.68 * inch,
    )
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[full_frame], onPage=page_cover),
            PageTemplate(id="divider", frames=[full_frame], onPage=page_divider),
            PageTemplate(id="body", frames=[body_frame], onPage=page_body),
        ]
    )

    styles = getSampleStyleSheet()
    cover_eyebrow = ParagraphStyle("cover-eyebrow", parent=styles["Normal"], fontName="DV-Mono-Bold", fontSize=8, leading=11, textColor=BRASS, alignment=TA_CENTER, spaceAfter=22, uppercase=True)
    cover_title = ParagraphStyle("cover-title", parent=styles["Title"], fontName="DV-Sans-Bold", fontSize=42, leading=40, textColor=IVORY, alignment=TA_CENTER, spaceAfter=17)
    cover_sub = ParagraphStyle("cover-sub", parent=styles["Normal"], fontName="DV-Serif", fontSize=15, leading=21, textColor=BRASS_LIGHT, alignment=TA_CENTER)
    cover_small = ParagraphStyle("cover-small", parent=styles["Normal"], fontName="DV-Mono", fontSize=8, leading=13, textColor=colors.HexColor("#AAB0BA"), alignment=TA_CENTER)
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontName="DV-Sans-Bold", fontSize=26, leading=29, textColor=INK, spaceAfter=10)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontName="DV-Sans-Bold", fontSize=16, leading=20, textColor=INK, spaceAfter=6)
    kicker = ParagraphStyle("kicker", parent=styles["Normal"], fontName="DV-Mono-Bold", fontSize=7.5, leading=10, textColor=BRASS, spaceAfter=8)
    intro = ParagraphStyle("intro", parent=styles["BodyText"], fontName="DV-Serif", fontSize=11.5, leading=17, textColor=DIM, spaceAfter=10)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontName="DV-Sans", fontSize=9.2, leading=13.5, textColor=INK, spaceAfter=8)
    small = ParagraphStyle("small", parent=styles["BodyText"], fontName="DV-Sans", fontSize=7.8, leading=11, textColor=DIM)
    prompt_style = ParagraphStyle("prompt", parent=styles["BodyText"], fontName="DV-Mono", fontSize=7.15, leading=9.6, textColor=INK)
    divider_roman = ParagraphStyle("divider-roman", parent=styles["Title"], fontName="DV-Sans-Bold", fontSize=90, leading=85, textColor=BRASS, alignment=TA_CENTER, spaceAfter=18)
    divider_title = ParagraphStyle("divider-title", parent=styles["Title"], fontName="DV-Sans-Bold", fontSize=30, leading=33, textColor=IVORY, alignment=TA_CENTER, spaceAfter=18)
    divider_body = ParagraphStyle("divider-body", parent=styles["BodyText"], fontName="DV-Serif", fontSize=13, leading=20, textColor=BRASS_LIGHT, alignment=TA_CENTER)
    toc_title = ParagraphStyle("toc-title", parent=h1, alignment=TA_CENTER, spaceAfter=20)
    toc_range = ParagraphStyle("toc-range", parent=kicker, fontSize=6.5, leading=8, spaceAfter=0)

    story = []
    story += [
        Spacer(1, 1.15 * inch),
        Paragraph("AI FRAMEWORK REFERENCE LIBRARY  /  FIRST EDITION", cover_eyebrow),
        Paragraph("THE PROMPT<br/>CODEX", cover_title),
        Rule(3.4 * inch, BRASS, 1),
        Spacer(1, 10),
        Paragraph("100 practical entries in 10 bound volumes", cover_sub),
        Spacer(1, 0.72 * inch),
        Paragraph("CONTEXT  /  CONSTRAINTS  /  DELIVERABLE  /  QUALITY CONTROL", cover_small),
        Spacer(1, 0.25 * inch),
        Paragraph("Find the right AI tools. Build a working AI system.", cover_small),
        NextPageTemplate("body"),
        PageBreak(),
        Paragraph("THE REFERENCE SHELF", kicker),
        Paragraph("Ten Volumes. One Working System.", toc_title),
        Paragraph("Each entry is a complete prompt architecture, not a one-line idea. Replace the bracketed inputs, use only information you are permitted to share, and review every important output before relying on it.", intro),
        Spacer(1, 8),
    ]

    toc_rows = []
    for index, volume in enumerate(VOLUMES, 1):
        toc_rows.append(
            [
                Paragraph(f"VOLUME {volume['roman']}", kicker),
                Paragraph(volume["title"], h2),
                Paragraph(volume["summary"], small),
                Paragraph(f"{(index - 1) * 10 + 1:03d}-{index * 10:03d}", toc_range),
            ]
        )
    toc = Table(toc_rows, colWidths=[0.82 * inch, 1.75 * inch, 3.26 * inch, 0.70 * inch], repeatRows=0)
    toc.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(toc)
    story += [
        Spacer(1, 18),
        Paragraph("<b>Use responsibly.</b> Do not include passwords, government identifiers, private medical records, confidential client data, or information you are not authorized to share. AI output can be wrong. Verify current and high-stakes claims with authoritative sources and qualified professionals.", small),
    ]

    global_entry = 0
    for volume_index, volume in enumerate(VOLUMES):
        story += [
            NextPageTemplate("divider"),
            PageBreak(),
            Spacer(1, 1.48 * inch),
            Paragraph(f"VOLUME {volume['roman']}", divider_roman),
            Paragraph(volume["title"].upper(), divider_title),
            Rule(3.2 * inch, BRASS, 0.8),
            Spacer(1, 16),
            Paragraph(volume["summary"], divider_body),
            NextPageTemplate("body"),
            PageBreak(),
        ]
        for entry_index, entry in enumerate(volume["entries"], 1):
            global_entry += 1
            title, objective, _, deliverables, _ = entry
            entry_number = f"{volume_index + 1:02d}.{entry_index:02d}"
            prompt = prompt_text(volume, entry)
            prompt_markup = html.escape(prompt).replace("\n", "<br/>")
            card = Table(
                [[Paragraph(prompt_markup, prompt_style)]],
                colWidths=[PAGE_W - 1.62 * inch],
            )
            card.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                        ("LEFTPADDING", (0, 0), (-1, -1), 14),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                        ("TOPPADDING", (0, 0), (-1, -1), 13),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
                    ]
                )
            )
            story += [
                Paragraph(f"ENTRY {entry_number}  /  {volume['title'].upper()}", kicker),
                Paragraph(title, h1),
                Paragraph(f"Use this entry to {objective}.", intro),
                Rule(PAGE_W - 1.44 * inch, LINE, 0.5),
                Spacer(1, 7),
                card,
                Spacer(1, 9),
                Paragraph("<b>Operator note:</b> Replace every bracketed field. If a field does not apply, say so rather than deleting a constraint the model may need.", small),
            ]
            if entry_index < len(volume["entries"]):
                story.append(PageBreak())

    doc.build(story)
    shutil.copy2(OUTPUT, VAULT_COPY)
    return OUTPUT


if __name__ == "__main__":
    path = build_pdf()
    print(path)

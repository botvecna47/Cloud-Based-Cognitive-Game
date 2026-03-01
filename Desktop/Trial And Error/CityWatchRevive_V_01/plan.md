Here is your **detailed Markdown documentation draft** for the CityWatch mini project.

You can copy this into a `.md` file directly.

---

# CityWatch

## A Distributed Civic Complaint Monitoring & Facilitation Platform

---

# 1. Introduction

CityWatch is a web-based civic issue reporting and monitoring platform designed to improve transparency, structured complaint handling, and accountability within limited urban areas.

The system introduces a controlled intermediary layer (field coordinators) between citizens and government departments to ensure complaints are validated, tracked, and resolved within defined timelines.

This project is initially designed as a **college mini project**, with potential pilot deployment in 3–4 local areas after proper consultation and approval.

---

# 2. Problem Statement

Urban civic complaint systems often suffer from:

* Lack of structured accountability
* Delayed or untracked resolutions
* Fake or spam complaints
* No priority classification for clustered issues
* Weak transparency mechanisms
* No structured escalation logic

Additionally, direct interaction with government officials through independent platforms may not be feasible without formal approval.

There is a need for a controlled, validated, and moderated civic complaint facilitation system that:

* Validates complaint authenticity
* Prevents spam and abuse
* Prioritizes issues based on intensity
* Tracks resolution progress
* Requires geo-verified proof of completion
* Operates within legal and ethical boundaries

---

# 3. Project Objectives

1. Build a city-restricted complaint management platform.
2. Implement a multi-coordinator validation model (3–5 per area).
3. Design a moderated complaint intensity model.
4. Implement SLA-based resolution tracking.
5. Integrate geo-verified proof-of-completion system.
6. Avoid unhealthy competition and corruption risk.
7. Maintain fairness and legal safety.

---

# 4. Scope (Mini Project Phase)

Initial deployment will include:

* 1 city
* 3–4 areas/zones
* 3–5 coordinators per area
* Limited complaint categories (e.g., potholes, garbage, streetlight)

Out of scope for mini project:

* Full-scale city-wide deployment
* AI-based automation
* Political performance dashboards
* Direct government system integration
* Public ranking systems

---

# 5. Stakeholders / Actors

## 5.1 Citizens

* Register with city verification
* Submit geo-tagged complaints
* View complaint status
* Add comments
* Confirm or reject resolution

## 5.2 Field Coordinators (Middlemen)

* Offline hired and verified
* Assigned specific zones
* Validate complaints (voting system)
* Coordinate offline with departments
* Upload live geo-verified completion proof
* Update status

## 5.3 Admin

* Creates coordinator accounts
* Defines zones and SLAs
* Monitors system integrity
* Reviews escalations
* Handles abuse cases

---

# 6. System Workflow

### Step 1: Complaint Submission

Citizen submits:

* Category
* Description (minimum length enforced)
* Live image (mandatory)
* GPS location (auto-captured)

System performs:

* Basic spam validation
* Duplicate detection (within radius)
* Assigns complaint to area

Status: Pending Review

---

### Step 2: Coordinator Validation (Distributed Voting)

Each complaint is visible to 3–5 coordinators in that zone.

Each coordinator votes:

* Valid
* Invalid
* Needs clarification

If:

* Majority Valid → Complaint Approved
* Majority Invalid → Complaint Rejected
* Tie → Admin review

---

### Step 3: Intensity Calculation

If similar complaints exist within defined radius:

Intensity Score = log(1 + weighted_similar_complaints)

Where weight depends on citizen trust level.

Priority classification:

* Low
* Medium
* High
* Critical

This ensures moderate escalation without hype.

---

### Step 4: SLA Tracking

Each category has predefined SLA:

| Category | SLA    |
| -------- | ------ |
| Garbage  | 3 days |
| Pothole  | 7 days |
| Drainage | 4 days |

Deadline auto-calculated.

If deadline exceeded:

* Status → Delayed
* Admin notified

---

### Step 5: Completion Proof

Coordinator must:

* Visit site
* Capture live image via browser camera
* GPS auto-detected
* System validates distance from original complaint

No file upload allowed for closure.

Status → Awaiting Citizen Confirmation

---

### Step 6: Citizen Confirmation

Citizen:

* Accept resolution → Closed
* Reject → Reopen

Reopened cases:

* Escalation triggered
* Coordinator reassigned

---

# 7. Reputation / Trust System (Non-Competitive)

No public ranking.

Instead:

### Citizen Trust Level

* Normal
* Under Review
* Restricted

### Coordinator Status

* Active
* Warning
* Suspended

Reputation used internally to:

* Adjust complaint weight
* Trigger manual review
* Identify abuse patterns

No leaderboard to avoid unhealthy competition.

---

# 8. Complaint Management Modules

## 8.1 Citizen Dashboard

* Submit Complaint
* View My Complaints
* Area Complaint Map
* Notifications
* Comment Section

## 8.2 Coordinator Dashboard

* Pending Reviews
* Assigned Complaints
* SLA Tracker
* Upload Proof
* Comment Thread

## 8.3 Admin Dashboard

* Area Management
* User Management
* Escalation Panel
* Audit Logs
* Performance Metrics

---

# 9. Comment System

Each complaint includes:

* Threaded discussion
* Citizen updates
* Coordinator updates
* Admin moderation capability
* Profanity filtering

---

# 10. Anti-Abuse Mechanisms

1. Rate limiting complaint submissions.
2. Minimum description length.
3. Mandatory live image.
4. Duplicate detection within radius.
5. Citizen strike count for rejected complaints.
6. Coordinator vote auditing.
7. Geo-verification for closure.
8. Audit logs for every action.

---

# 11. Technical Stack Recommendation

Frontend:

* React

Backend:

* Spring Boot (Java)

Database:

* PostgreSQL

Reasoning:

* Strong relational structure
* Good for learning OOP & backend architecture
* Suitable for geo-based queries
* Academic value

Optional:

* PostGIS extension for geo queries

---

# 12. Database Core Tables

* Users
* Areas
* Complaints
* ComplaintClusters
* Votes
* Proofs
* Comments
* Escalations
* Notifications
* AuditLogs

---

# 13. Legal & Ethical Considerations

Before any real deployment:

1. Obtain written approval from:

   * Local municipal authority OR
   * College administration

2. Include:

   * Disclaimer
   * Privacy Policy
   * Terms of Use

3. Avoid:

   * Public ranking of officials
   * Defamatory statements
   * Exposing personal data

4. Ensure:

   * Masked user details
   * Secure authentication
   * Data protection practices

---

# 14. Survey & Research Requirements

Before pilot implementation, conduct:

### 14.1 Citizen Survey

* Current complaint experience
* Average resolution time
* Common issues
* Trust level in existing system

### 14.2 Coordinator Feasibility Survey

* Willingness to act as intermediary
* Time availability
* Understanding of local governance process

### 14.3 Government Interaction Research

* Existing complaint channels
* Legal boundaries
* Escalation structure

Document findings in project report.

---

# 15. What To Do

* Keep scope limited
* Build structured workflow
* Implement audit logging
* Ensure geo-verification
* Use clean database design
* Document architecture clearly

---

# 16. What NOT To Do

* Do not gamify with leaderboards
* Do not publicly shame departments
* Do not deploy without consultation
* Do not over-engineer AI features
* Do not collect unnecessary personal data
* Do not scale before validating pilot

---

# 17. Future Expansion Plan

Phase 1:

* Pilot in 3–4 areas
* Manual coordinator supervision

Phase 2:

* Formal municipal consultation
* Expand area coverage

Phase 3:

* Mobile PWA
* Advanced analytics
* Automated clustering improvements

---

# 18. Conclusion

CityWatch proposes a structured, moderated, and legally cautious civic complaint facilitation system designed for controlled deployment. By combining distributed coordinator validation, intensity-based prioritization, SLA tracking, geo-verified proof-of-completion, and anti-abuse mechanisms, the platform aims to improve transparency and operational accountability while avoiding unhealthy competition and corruption risks.

---

If you want, next I can:

* Add System Architecture Diagram description
* Add ER Diagram structure
* Add API endpoint documentation
* Or convert this into full academic report format (with chapters)

Perfect. Now we’re going to design this properly — like a system architect, not a hobby coder.

Below is a **complete, structured, loophole-resistant Markdown document** including:

* Detailed workflows
* Actor permissions
* Authority boundaries
* Status lifecycle
* No-loophole control logic
* Required tech stack
* 8-week learning + implementation roadmap
* Clear task division for a duo team

---

# CityWatch

## A Structured Civic Complaint Facilitation & Monitoring Platform

---

# 1. Executive Summary

CityWatch is a city-restricted civic issue reporting and monitoring platform designed to introduce:

* Structured complaint validation
* Distributed coordinator review
* Controlled escalation
* SLA-based tracking
* Geo-verified proof-of-completion
* Anti-abuse enforcement

The system is designed as a **college mini project** with potential pilot deployment in 3–4 controlled areas after institutional consultation.

---

# 2. Core Design Philosophy

This system is built on five non-negotiable principles:

1. No gamified competition.
2. No public shaming.
3. No uncontrolled authority.
4. No single-point manipulation.
5. No legal overreach.

---

# 3. Actors & Authority Model

---

## 3.1 Citizen

### Permissions

* Register/login
* Submit complaint
* View complaints in their area
* Comment on complaints
* Confirm or reject resolution
* View status updates
* Edit complaint (only before approval)

### Restrictions

* Cannot delete complaint after approval
* Cannot assign coordinator
* Cannot see coordinator internal votes
* Cannot escalate manually (system-controlled)
* Cannot modify intensity

### Authority Level: LOW

---

## 3.2 Field Coordinator

### Permissions

* View complaints in assigned zone
* Vote during validation stage
* View assigned complaints
* Update complaint progress
* Upload live geo-verified completion proof
* Comment on complaint

### Restrictions

* Cannot modify complaint description
* Cannot delete complaint
* Cannot override majority vote
* Cannot close complaint without geo-proof
* Cannot view other coordinators’ votes before voting
* Cannot handle reopened complaint if previously assigned

### Authority Level: MEDIUM (Operational, not administrative)

---

## 3.3 Admin

### Permissions

* Create/disable coordinator accounts
* Define zones
* Define SLA per category
* View audit logs
* Handle escalations
* Review tie votes
* Suspend users
* Modify trust levels

### Restrictions

* Cannot alter historical audit logs
* Cannot edit complaint content
* Cannot manually inflate intensity

### Authority Level: HIGH (System governance only)

---

# 4. Complaint Status Lifecycle (No Loopholes)

Status transitions must be strictly controlled.

---

## 4.1 Status States

1. Draft
2. Pending Review
3. Rejected
4. Approved
5. Assigned
6. In Progress
7. Delayed
8. Completed (Awaiting Confirmation)
9. Closed
10. Reopened
11. Escalated

---

## 4.2 Valid Transitions

Draft → Pending Review
Pending Review → Approved
Pending Review → Rejected
Approved → Assigned
Assigned → In Progress
In Progress → Completed
Completed → Closed
Completed → Reopened
Reopened → Assigned
Any non-closed → Delayed (system triggered)
Delayed → Escalated (system triggered)

No backward transitions allowed unless explicitly defined.

---

# 5. Full Workflow

---

## 5.1 Complaint Submission Workflow

1. Citizen logs in.
2. Selects category.
3. Enters description (min length validation).
4. Captures live photo.
5. GPS auto-detected.
6. System checks:

   * Duplicate within radius
   * User trust level
   * Rate limit
7. Complaint stored.
8. Status → Pending Review.
9. Coordinators notified.

---

## 5.2 Validation Workflow

1. 3–5 coordinators vote independently.
2. Votes hidden until submission.
3. Majority logic:

   * ≥60% valid → Approved
   * ≥60% invalid → Rejected
   * Tie → Admin review
4. Status updated.
5. Citizen notified.

---

## 5.3 Intensity Calculation Workflow

If complaint approved:

1. Find similar complaints within radius.
2. Compute weighted sum.
3. Apply diminishing log formula.
4. Assign priority level.
5. Update area heatmap.

---

## 5.4 Assignment Workflow

1. System randomly assigns coordinator.
2. Coordinator cannot self-assign.
3. Assignment logged.
4. SLA timer starts.

---

## 5.5 Progress Update Workflow

Coordinator updates status:

* In Progress
* Waiting for Department
* Scheduled Work

Each update:

* Timestamped
* Logged
* Visible to citizen

---

## 5.6 Completion Workflow

1. Coordinator visits location.
2. Captures live image via WebRTC.
3. GPS auto-captured.
4. System verifies:

   * Within allowed radius
   * Timestamp current
5. Status → Completed (Awaiting Confirmation)

---

## 5.7 Citizen Confirmation Workflow

Citizen can:

* Accept → Closed
* Reject → Reopened

If Reopened:

* Escalation level increases
* Coordinator reassigned

---

## 5.8 Escalation Workflow

Triggered automatically when:

Current date > SLA AND not completed.

Escalation Levels:

Level 1 → Admin notified
Level 2 → Marked High Attention
Level 3 → Review Required

No manual escalation by citizen.

---

# 6. Anti-Abuse System

---

## 6.1 Citizen Abuse Controls

* Max complaints per day
* Repeated rejection → Trust downgrade
* Suspicious cluster spam detection
* IP logging

---

## 6.2 Coordinator Abuse Controls

* Random audit of 5% completed cases
* Reopen rate threshold
* SLA violation tracking
* Vote anomaly detection

---

## 6.3 System Integrity Controls

* Full audit logging
* JWT authentication
* Role-based authorization
* No direct DB access

---

# 7. Database Schema Core

Tables:

Users
Areas
Complaints
Votes
Proofs
Comments
Escalations
Notifications
AuditLogs

---

# 8. Tech Stack & Technologies To Learn

---

## Core Stack

Frontend:

* React
* React Router
* Axios
* Google Maps API
* WebRTC (camera)

Backend:

* Spring Boot
* REST APIs
* JWT Authentication
* Role-based access
* Scheduled tasks (for SLA)

Database:

* PostgreSQL
* Basic indexing
* Optional PostGIS

---

## Extra Technologies To Learn

* Docker (optional deployment)
* Nginx (basic hosting knowledge)
* Git (collaboration)
* API documentation (Swagger)
* Basic security practices (CORS, CSRF)

---

# 9. 8-Week Implementation & Learning Plan

---

## Week 1 – Planning & Learning Foundations

* Finalize system architecture
* Learn Spring Boot basics
* Setup PostgreSQL
* Setup React project
* Design ER diagram

---

## Week 2 – Authentication & Roles

* Implement user registration/login
* JWT authentication
* Role-based access control
* Basic UI layouts

---

## Week 3 – Complaint Module

* Complaint submission API
* Image upload
* GPS capture
* Complaint list display

---

## Week 4 – Validation System

* Voting API
* Majority logic
* Status transitions
* Notification system (basic)

---

## Week 5 – SLA & Assignment Logic

* Random coordinator assignment
* Deadline tracking
* Scheduled job for delay detection

---

## Week 6 – Completion & Geo Verification

* WebRTC integration
* GPS verification logic
* Completion proof API

---

## Week 7 – Escalation & Anti-Abuse

* Escalation logic
* Trust system
* Rate limiting
* Audit logging

---

## Week 8 – Testing & Deployment

* Bug fixing
* UI improvements
* Security review
* Documentation
* Demo preparation

---

# 10. Duo Task Division

---

# 🔵 Frontend Responsibilities (Person A)

* UI layout
* Authentication forms
* Complaint submission form
* Camera integration
* Map view
* Dashboard design
* Status badges
* Comment UI
* Notification UI
* API integration

Must learn:

* React hooks
* State management
* Form validation
* WebRTC basics
* Map integration

---

# 🔴 Backend & Database Responsibilities (Person B)

* DB schema design
* Spring Boot setup
* JWT implementation
* Complaint APIs
* Voting logic
* SLA scheduler
* Escalation logic
* Trust calculation
* Geo radius verification
* Audit logs

Must learn:

* Spring Security
* JPA/Hibernate
* PostgreSQL queries
* Scheduled tasks
* REST design

---

# Final Advice

Keep it:

* Structured
* Controlled
* Legally neutral
* Scope-limited
* Cleanly documented

Do NOT try to impress by adding 20 features.

Impress by making 10 features robust.

---

If you want next, I can:

* Create ER Diagram structure in text form
* Provide API endpoint documentation
* Or simulate viva questions your professor might ask

Your move.

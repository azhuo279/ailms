# User Stories & Acceptance Criteria

A user story is the smallest unit of value-bearing work, told from the user's perspective. It is not a mini-spec and not a sliced-up requirements document — it exists to carry _user value_ into delivery. The **3 C's** keep it honest: **Card** (the brief written promise), **Conversation** (the detail is refined collaboratively, not stuffed into the card), **Confirmation** (acceptance criteria prove it's done). Write stories only after the user problem and interaction model are clear enough — if they aren't, go back to a journey or flow first.

## Hierarchy

- **Epic** — a large body of work delivering a user and business outcome; spans multiple stories.
- **Feature story** — a user-facing capability, estimable within a sprint.
- **Task story** — a smaller, localized action, often internal or admin-facing.

## Writing workflow

1. Confirm the value is clear before writing (Working Backwards discipline: don't jump to build definitions before clarifying customer value).
2. Use the template: **As a [user], I want [goal], so that [benefit].**
3. Keep it small enough to estimate and deliver measurable value; push detail into conversation, not the title.
4. Add acceptance criteria that are **clear, concise, independent, measurable, and testable.**
5. Where behavior matters, express critical scenarios in **Given / When / Then** (Gherkin) form for shared comprehension and executable testing.
6. Link each story to its flow, mockups, research evidence, and metric.

## Pitfalls

- Mechanically decomposing a requirements document into "stories" while losing user value.
- Acceptance criteria written as vague aspirations rather than verifiable conditions.
- Overly broad criteria, or confusing acceptance criteria with the broader Definition of Done.

## Readiness bar

Actor, goal, and benefit explicit; small enough to estimate; acceptance criteria testable; dependencies and non-goals known; linked designs/flows attached.

## Handoff checklist (per story)

Linked design source, linked flow, acceptance criteria, analytics events, accessibility notes, technical dependencies, copy/content dependencies, rollback/fallback behavior if relevant, named owner.

## Templates

```text
EPIC
Title:
User outcome:
Business outcome:
Success metrics (>=1 HEART-aligned user metric + 1 operational metric):
In scope:
Out of scope:
Linked journey(s):
Linked flows:
Risks / dependencies:

FEATURE STORY
As a [persona / role],
I want [capability / goal],
so that [benefit / outcome].

Acceptance criteria:
- Given ... When ... Then ...
- Given ... When ... Then ...

Links: Flow / Designs / Research / Analytics (HEART) metric

TASK STORY
As a [persona / internal user],
I want [specific action],
so that [localized benefit].

Acceptance criteria:
-
-
```

## Worked examples (B2B SaaS workspace-invite scenario)

**Epic** — _As a workspace admin, I want teammate onboarding to be fast and trustworthy, so that invited users activate quickly without support intervention._

- Activation rate from valid invite to first successful session is measurable and reported weekly.
- The onboarding sequence supports both SSO and email/password paths.
- The top three failure points in the current onboarding journey have named design or product remedies.
- Success metrics include at least one HEART-aligned user metric and one operational metric.

**Feature story** — _As a newly invited teammate, I want to accept a workspace invitation in a clear guided flow, so that I can access my workspace confidently on the first attempt._

- **Given** a valid invite link, **when** the user opens it, **then** the landing page shows workspace name, inviter identity, and a clear next step.
- **Given** the user has an account, **when** they sign in, **then** the system routes them to the invited workspace and confirms access.
- **Given** the user has no account, **when** they choose SSO and the domain is recognized, **then** SSO completes without local password setup.
- **Given** the invite link is expired, **when** the user opens it, **then** the product offers a recovery path to request a new invite.
- **Given** access is pending or blocked, **when** the user finishes authentication, **then** the system explains the state and the next action.

**Task story** — _As a workspace admin, I want to resend an expired invite from the members screen, so that I can recover onboarding without contacting support._

- The resend action is visible only for pending or expired invitations.
- Resending creates a new valid invite and invalidates the old one.
- A success message confirms the resend and destination email.
- The event is logged for analytics and audit history.

Notice each story names actor/goal/benefit, has testable criteria, covers failure and edge states, and carries a measurement hook.

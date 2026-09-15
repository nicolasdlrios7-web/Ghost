# Ghost

## One-line pitch

**Ghost watches how you work, discovers what shouldn't require you, and turns it into automation.**

## Short description

Ghost quietly detects repetitive desktop workflows, explains the evidence, and helps you turn them into approved automations. Local-first, transparent, and designed to give your time back.

## Inspiration

AI can do more every month, but most people still have to identify the task, write the prompt, and design the workflow. The hardest question often comes before the prompt: “What could I stop doing myself?” We built Ghost to answer that question.

## What it does

Ghost observes lightweight macOS app activity and finds repeated sequences. It might notice that you repeatedly move from an analytics dashboard to customer email to a weekly report. It shows the sessions behind that conclusion and estimates the time involved.

You review the opportunity, inspect a proposed workflow, edit it, and activate it. The prototype persists that workflow and can generate a local report draft from supplied context. Its sample workday reproduces the discovery loop immediately, without pretending sample activity is live.

## How we built it

Electron provides the macOS shell, menu bar, secure credential storage, and a narrowly scoped bridge to the UI. React, TypeScript, and Vite power the interface. macOS NSWorkspace supplies the foreground app; optional System Events access supplies window titles.

A deterministic sequence detector anchors every opportunity to actual session IDs. Optional OpenAI reasoning improves the interpretation, with strict schema validation and a local fallback. Atomic JSON persistence keeps the architecture small and explainable. Playwright drives the real Electron app through the complete demo.

## Challenges

The challenge was making a proactive product credible. A sequence of apps can suggest reporting, but it cannot prove what someone did inside those apps. We expose the evidence, label confidence and savings as estimates, and make approval explicit.

We also needed a demo that works before Ghost has observed a full workweek. Clearly labeled sample activity goes through the same detector as real activity. It proves the product loop without inventing live observation or unsupported integrations.

## Accomplishments

- An end-to-end discovery-to-workflow experience that works offline.
- Real macOS foreground observation with local storage and pause/delete controls.
- Transparent evidence and programmatic savings calculations.
- Optional structured AI interpretation that can fail without breaking the product.
- A saved workflow that produces a real, editable local report draft.
- A polished desktop experience and reproducible automated demo test.

## What we learned

The most valuable automation interface may start before a user knows they need one. Discovery requires restraint: explain why a pattern matters, show enough evidence to challenge it, and leave the person in control.

## What's next

Connect approved workflows to actual data sources, introduce scheduled execution with review gates, distinguish genuine recurring tasks from coincidental app switching, and replace estimated savings with measured outcomes.

Ghost's ambition is simple: make unnecessary work easier to notice—and easier to leave behind.

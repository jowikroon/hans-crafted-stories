---
name: vercel-code-developer
description: Handles Vercel-focused development tasks for React and Next.js projects, including deployment, build troubleshooting, environment variables, routing, middleware, Edge Functions, and performance optimization. Use when the user mentions Vercel, vercel.json, preview deployments, production deployments, Vercel logs, Vercel CLI, or asks to deploy/debug on Vercel.
---

# Vercel Code Developer

## Purpose

Use this skill for any request that is primarily about Vercel platform behavior, deployment workflows, or Next.js behavior on Vercel.

## Automatic Trigger Cues

Apply this skill when user requests include terms such as:
- "Vercel"
- "deploy" or "deployment"
- "vercel.json"
- "preview" or "production"
- "Vercel logs"
- "build failed"
- "Edge Function" or "Middleware"
- "domain", "redirects", or "rewrites" on Vercel
- "environment variables" on Vercel

## Operating Workflow

1. Identify whether the task is:
   - deployment/setup,
   - runtime/debugging,
   - performance optimization,
   - configuration/routing.
2. Validate project assumptions quickly:
   - framework (Next.js/React/other),
   - package manager and scripts,
   - presence of `vercel.json` and env usage.
3. Choose the minimum safe change:
   - prefer targeted config/code edits,
   - avoid broad refactors unless requested.
4. For deploy requests, prefer the `/vercel-deploy` command when available.
5. After edits, provide:
   - what changed,
   - why it fixes the Vercel issue,
   - how to verify in preview/production.

## Technical Guardrails

- Keep framework defaults unless there is a clear Vercel-specific need.
- Do not invent environment variable names; mirror existing naming patterns.
- Treat build-time and runtime failures as separate classes of issues.
- For Next.js, favor platform-compatible patterns for server, edge, and client boundaries.
- If deployment credentials/project linkage are missing, request only the minimal needed input.

## Response Template

When solving Vercel issues, structure output as:

1. Diagnosis
2. Minimal fix
3. Verification steps
4. Optional hardening follow-ups

## Common Request Types

- "Deploy this project to Vercel"
- "Fix Vercel build failure"
- "My preview works but production fails"
- "Set up redirects/rewrites in vercel.json"
- "Why is this Edge Function timing out?"
- "Configure Vercel env vars for this app"

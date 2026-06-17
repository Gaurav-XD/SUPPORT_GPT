# SupportGPT - Project Overview

## Executive Summary

SupportGPT is a production-style AI customer support SaaS designed to demonstrate senior full-stack engineering skill across product, architecture, implementation, testing, and deployment.

The platform combines:

- Multi-tenant organization management
- AI-assisted customer support
- Knowledge base ingestion and retrieval
- Ticketing and escalation workflows
- Real-time collaboration features
- Auditability and operational visibility

## Product Vision

The goal is to model a support platform that would feel credible to paying customers and hiring teams alike. It should look and behave like a business-critical SaaS, not a toy demo.

## Core Value Propositions

1. AI-powered support responses grounded in organization knowledge
2. Tenant isolation with explicit organization boundaries
3. Team management with invitations and role-based permissions
4. Document processing for PDFs, DOCX files, and text sources
5. Conversation history with citations and escalation paths
6. Ticket workflows for unresolved or high-priority issues
7. Analytics and audit logs for operational trust

## Feature Summary

### Authentication

- Register and login with email/password
- Refresh token flow
- Google OAuth entry points
- Password reset workflow

### Organizations

- Organization creation and membership
- Invitations for teammates
- Role-based access control
- Organization-scoped resources

### Knowledge Base

- PDF, DOCX, and TXT uploads
- Document parsing and chunking
- Embedding generation
- Vector-ready storage

### AI Agents

- Custom agent creation
- System prompt configuration
- Knowledge base assignment
- Model and temperature controls

### AI Chat

- Conversational UI
- Streaming-style responses
- Citation support
- Conversation history

### Tickets

- Ticket creation and updates
- Priority and status tracking
- Assignment and escalation
- Comment timeline

### Real-Time Features

- Live chat readiness
- Typing indicators
- Notifications

### Analytics

- Resolution rate
- Ticket volume
- Agent performance
- AI response quality

### Audit Logs

- Action history
- Organization-level traceability

### Admin Dashboard

- Global overview
- Operational visibility

## Technology Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style component primitives
- TanStack Query
- React Hook Form

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Socket.IO
- OpenAI API integration

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions

## Implementation Status

### Completed

- Architecture documentation
- Database design and ERD
- API design
- Deployment guide
- Interview preparation guide
- Backend scaffold and build validation
- Frontend scaffold and build validation
- Docker and CI assets
- Backend smoke tests

### In Progress / Extendable

- Full persistence of auth state in the frontend
- Live OpenAI streaming and production file storage
- Expanded analytics and admin controls
- Integration and E2E test coverage

## Repository Structure

```text
SupportGPT/
├─ backend/
├─ frontend/
├─ docs/
├─ docker/
└─ docker-compose.yml
```

## Why This Project Matters

SupportGPT is intentionally shaped to show the things senior engineers talk about in interviews:

- clear system boundaries
- multi-tenant thinking
- data modeling rigor
- async processing
- secure by default APIs
- deployment discipline
- documentation that tells the product story

## Success Signals

- Backend builds successfully
- Frontend builds successfully
- API routes match organization-scoped SaaS workflows
- Docker and CI/CD assets are present
- Documentation supports both handoff and interviews

## Last Updated

2026-06-17


# SupportGPT Database Design

## Table of Contents

1. [Database Overview](#database-overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Schema Design](#schema-design)
4. [Relationships & Constraints](#relationships--constraints)
5. [Indexing Strategy](#indexing-strategy)
6. [Performance Considerations](#performance-considerations)

---

## Database Overview

### Technology Stack
- **DBMS**: PostgreSQL 14+
- **ORM**: Prisma
- **Vector Extension**: pgvector (for semantic search)
- **Backup Strategy**: Automated daily backups with point-in-time recovery

### Database Initialization
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create database
CREATE DATABASE supportgpt;

-- Connect to database
\c supportgpt

-- Set up connection pooling
-- (Handled by Prisma in production)
```

---

## Entity-Relationship Diagram

### ASCII ERD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER MANAGEMENT DOMAIN                              │
├─────────────────────────────────────────────────────────────────────────────┤

                              ┌──────────────┐
                              │    users     │
                              ├──────────────┤
                              │ id (PK)      │
                              │ email        │◄──────────┐
                              │ password     │           │ (unique)
                              │ name         │           │
                              │ avatar_url   │           │
                              │ google_id    │           │
                              │ status       │           │
                              │ created_at   │           │
                              │ updated_at   │           │
                              └──────┬───────┘           │
                                     │                   │
                    ┌────────────────┼───────────────────┴──────┐
                    │                │                         │
              ┌─────▼──────┐  ┌─────▼──────────┐     ┌────────▼─────┐
              │org_members │  │refresh_tokens  │     │user_sessions │
              ├────────────┤  ├────────────────┤     ├──────────────┤
              │ id (PK)    │  │ id (PK)        │     │ id (PK)      │
              │ user_id(FK)│  │ user_id (FK)   │     │ user_id(FK)  │
              │ org_id(FK) │  │ token          │     │ token        │
              │ role       │  │ expires_at     │     │ ip_address   │
              │ status     │  │ created_at     │     │ user_agent   │
              │ joined_at  │  └────────────────┘     │ expires_at   │
              │ updated_at │                         │ created_at   │
              └────────────┘                         └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORGANIZATION DOMAIN                                    │
├─────────────────────────────────────────────────────────────────────────────┤

              ┌──────────────────┐
              │  organizations   │
              ├──────────────────┤
              │ id (PK)          │
              │ name             │
              │ slug             │◄──────────┐
              │ description      │           │ (unique)
              │ logo_url         │           │
              │ owner_id (FK)    │───────┐   │
              │ subscription_tier│      │   │
              │ status           │      │   │
              │ created_at       │      │   │
              │ updated_at       │      │   │
              └────────┬─────────┘      │   │
                       │                │   │
           ┌───────────┼────────┐       │   │
           │           │        │       │   │
      ┌────▼─────┐ ┌──▼──────────┴──┐  │   │
      │org_invites  │departments    │  │   │
      ├──────────┤  ├──────────────┤  │   │
      │ id (PK) │  │ id (PK)      │  │   │
      │ org_id  │  │ org_id (FK)  │  │   │
      │ email   │  │ name         │  │   │
      │ role    │  │ description  │  │   │
      │ token   │  │ created_at   │  │   │
      │ expires │  └──────────────┘  │   │
      │ created │                    │   │
      └────────┘                     │   │
                                     │   │
                                  ┌──┴───▼──┐
                                  │team_    │
                                  │members  │
                                  ├─────────┤
                                  │id (PK)  │
                                  │user_id  │
                                  │dept_id  │
                                  │joined_at│
                                  └─────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤

           ┌────────────────────┐
           │   knowledge_bases  │
           ├────────────────────┤
           │ id (PK)            │
           │ org_id (FK)        │────────┐
           │ name               │        │
           │ description        │        │
           │ status             │        │
           │ created_at         │        │
           │ updated_at         │        │
           └────────┬───────────┘        │
                    │                    │
           ┌────────▼────────┐           │
           │   documents     │           │
           ├─────────────────┤           │
           │ id (PK)         │           │
           │ kb_id (FK)      │           │
           │ org_id (FK)     │───────┐   │
           │ name            │       │   │
           │ file_path       │       │   │
           │ file_size       │       │   │
           │ file_type       │       │   │
           │ total_chunks    │       │   │
           │ status          │       │   │
           │ parsed_at       │       │   │
           │ created_at      │       │   │
           │ updated_at      │       │   │
           └────────┬────────┘       │   │
                    │                │   │
           ┌────────▼──────────┐    │   │
           │document_chunks    │    │   │
           ├───────────────────┤    │   │
           │ id (PK)           │    │   │
           │ document_id(FK)   │    │   │
           │ chunk_index       │    │   │
           │ content           │    │   │
           │ embedding         │◄───┼───┘ (vector type)
           │ tokens            │    │
           │ metadata          │    │
           │ created_at        │    │
           └───────────────────┘    │
                                    │
                          ┌─────────▼──────┐
                          │document_access │
                          ├────────────────┤
                          │ id (PK)        │
                          │ doc_id (FK)    │
                          │ user_id (FK)   │
                          │ accessed_at    │
                          └────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI AGENTS DOMAIN                                        │
├─────────────────────────────────────────────────────────────────────────────┤

           ┌──────────────────┐
           │   ai_agents      │
           ├──────────────────┤
           │ id (PK)          │
           │ org_id (FK)      │────────┐
           │ name             │        │
           │ description      │        │
           │ system_prompt    │        │
           │ kb_id (FK)       │        │
           │ model            │        │
           │ temperature      │        │
           │ max_tokens       │        │
           │ status           │        │
           │ created_by(FK)   │        │
           │ created_at       │        │
           │ updated_at       │        │
           └────────┬─────────┘        │
                    │                  │
           ┌────────▼───────┐          │
           │agent_settings  │          │
           ├────────────────┤          │
           │ id (PK)        │          │
           │ agent_id(FK)   │          │
           │ key            │          │
           │ value          │          │
           │ created_at     │          │
           └────────────────┘          │
                                       │
                          ┌────────────▼─────┐
                          │agent_analytics   │
                          ├──────────────────┤
                          │ id (PK)          │
                          │ agent_id (FK)    │
                          │ date             │
                          │ conversations    │
                          │ avg_response_time│
                          │ satisfaction_rate│
                          │ created_at       │
                          └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHAT DOMAIN                                            │
├─────────────────────────────────────────────────────────────────────────────┤

           ┌───────────────────┐
           │  conversations    │
           ├───────────────────┤
           │ id (PK)           │
           │ agent_id (FK)     │────────┐
           │ user_id (FK)      │        │
           │ org_id (FK)       │        │
           │ title             │        │
           │ status            │        │
           │ satisfaction      │        │
           │ created_at        │        │
           │ updated_at        │        │
           │ ended_at          │        │
           └────────┬──────────┘        │
                    │                   │
           ┌────────▼──────────┐        │
           │  messages         │        │
           ├───────────────────┤        │
           │ id (PK)           │        │
           │ conversation(FK)  │        │
           │ role              │        │
           │ content           │        │
           │ citations         │        │
           │ model_used        │        │
           │ tokens_used       │        │
           │ created_at        │        │
           └───────────────────┘        │
                                        │
                          ┌─────────────▼──────┐
                          │message_citations   │
                          ├────────────────────┤
                          │ id (PK)            │
                          │ message_id (FK)    │
                          │ document_id (FK)   │
                          │ chunk_id (FK)      │
                          │ quote              │
                          │ relevance_score    │
                          │ created_at         │
                          └────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       TICKET DOMAIN                                          │
├─────────────────────────────────────────────────────────────────────────────┤

           ┌──────────────────┐
           │     tickets      │
           ├──────────────────┤
           │ id (PK)          │
           │ org_id (FK)      │───────┐
           │ conversation(FK) │       │
           │ title            │       │
           │ description      │       │
           │ status           │       │
           │ priority         │       │
           │ assigned_to(FK)  │       │
           │ created_by(FK)   │       │
           │ sla_expires_at   │       │
           │ created_at       │       │
           │ updated_at       │       │
           │ resolved_at      │       │
           └────────┬─────────┘       │
                    │                 │
           ┌────────▼────────┐        │
           │ticket_comments  │        │
           ├─────────────────┤        │
           │ id (PK)         │        │
           │ ticket_id(FK)   │        │
           │ author_id(FK)   │        │
           │ content         │        │
           │ is_internal     │        │
           │ created_at      │        │
           │ updated_at      │        │
           └─────────────────┘        │
                                      │
                     ┌────────────────▼──────────┐
                     │ ticket_activity_logs      │
                     ├───────────────────────────┤
                     │ id (PK)                   │
                     │ ticket_id (FK)            │
                     │ user_id (FK)              │
                     │ action                    │
                     │ old_value                 │
                     │ new_value                 │
                     │ created_at                │
                     └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUDIT & LOGGING DOMAIN                                    │
├─────────────────────────────────────────────────────────────────────────────┤

           ┌───────────────────┐
           │  audit_logs       │
           ├───────────────────┤
           │ id (PK)           │
           │ org_id (FK)       │
           │ user_id (FK)      │
           │ action            │
           │ resource_type     │
           │ resource_id       │
           │ old_values        │
           │ new_values        │
           │ ip_address        │
           │ user_agent        │
           │ created_at        │
           └───────────────────┘

           ┌───────────────────┐
           │  api_logs         │
           ├───────────────────┤
           │ id (PK)           │
           │ org_id (FK)       │
           │ api_key_id (FK)   │
           │ method            │
           │ path              │
           │ status_code       │
           │ response_time     │
           │ ip_address        │
           │ created_at        │
           └───────────────────┘

           ┌───────────────────┐
           │  api_keys         │
           ├───────────────────┤
           │ id (PK)           │
           │ org_id (FK)       │
           │ created_by (FK)   │
           │ name              │
           │ key_hash          │
           │ scopes            │
           │ last_used_at      │
           │ expires_at        │
           │ created_at        │
           └───────────────────┘
```

---

## Schema Design

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

#### 2. Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
```

#### 3. Organization Members Table
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'agent',
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_org_members_user_org ON org_members(user_id, org_id);
CREATE INDEX idx_org_members_org_role ON org_members(org_id, role);
```

#### 4. Departments Table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_org_id ON departments(org_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
```

#### 5. Knowledge Bases Table
```sql
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_bases_org_id ON knowledge_bases(org_id);
```

#### 6. Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  total_chunks INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing',
  parsed_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_kb_id ON documents(kb_id);
CREATE INDEX idx_documents_org_id ON documents(org_id);
CREATE INDEX idx_documents_status ON documents(status);
```

#### 7. Document Chunks Table
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

#### 8. AI Agents Table
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  kb_id UUID REFERENCES knowledge_bases(id) ON DELETE SET NULL,
  model VARCHAR(50) DEFAULT 'gpt-4-turbo',
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_agents_org_id ON ai_agents(org_id);
CREATE INDEX idx_ai_agents_kb_id ON ai_agents(kb_id);
```

#### 9. Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  satisfaction_score SMALLINT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
CREATE INDEX idx_conversations_status ON conversations(status);
```

#### 10. Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  citations JSONB,
  model_used VARCHAR(50),
  tokens_used INTEGER,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### 11. Tickets Table
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sla_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_tickets_org_id ON tickets(org_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
```

#### 12. Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Relationships & Constraints

### Primary Relationships

1. **Users → Organizations** (Many-to-Many via org_members)
   - One user can belong to multiple organizations
   - One organization has multiple users
   - Role-based access control at org_members level

2. **Organizations → Knowledge Bases** (One-to-Many)
   - One organization can have multiple knowledge bases
   - Each knowledge base belongs to exactly one organization

3. **Knowledge Bases → Documents** (One-to-Many)
   - One knowledge base contains multiple documents
   - Each document belongs to one knowledge base

4. **Documents → Document Chunks** (One-to-Many)
   - One document has multiple chunks (embeddings)
   - Each chunk belongs to one document

5. **Organizations → AI Agents** (One-to-Many)
   - One organization can have multiple AI agents
   - Each agent serves one organization

6. **AI Agents → Conversations** (One-to-Many)
   - One agent handles multiple conversations
   - Each conversation is with one specific agent

7. **Conversations → Messages** (One-to-Many)
   - One conversation has multiple messages
   - Each message belongs to one conversation

8. **Conversations → Tickets** (One-to-Many)
   - One conversation can spawn multiple tickets
   - Each ticket relates to one conversation

### Data Integrity

1. **Cascade Deletes**
   - Deleting an organization cascades to all org data
   - Deleting a document cascades to all chunks
   - Deleting a conversation cascades to all messages

2. **Restrict Deletes**
   - Cannot delete users with active memberships
   - Cannot delete organization owners
   - Cannot delete agents with active conversations

3. **Unique Constraints**
   - Email addresses are unique across system
   - Organization slugs are unique
   - Each user appears once per org (user_id, org_id)

---

## Indexing Strategy

### Query Patterns & Indexes

| Query Pattern | Indexes | Benefit |
|---|---|---|
| Find user by email | `idx_users_email` | Fast authentication |
| List org members | `idx_org_members_org_id`, `idx_org_members_org_role` | Fast permission checks |
| Find documents in KB | `idx_documents_kb_id`, `idx_documents_status` | Fast retrieval |
| Semantic search | `idx_document_chunks_embedding` (ivfflat) | Nearest neighbor search |
| List conversations | `idx_conversations_agent_id`, `idx_conversations_status` | Fast filtering |
| Find tickets | `idx_tickets_org_id`, `idx_tickets_status`, `idx_tickets_priority` | Fast queries |
| Audit trail | `idx_audit_logs_org_id`, `idx_audit_logs_created_at` | Compliance queries |

### Vector Index Configuration

```sql
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Recommended for 1M+ vectors, use exact search for smaller sets
```

---

## Performance Considerations

### Query Optimization

1. **Pagination**
   - Always paginate large result sets
   - Use cursor-based pagination for consistent results
   - Limit: 50 records by default

2. **Selective Loading**
   - Only fetch needed columns
   - Use Prisma `select` to limit fields
   - Avoid N+1 queries with `include`

3. **Connection Pooling**
   - Prisma handles pooling automatically
   - Configure pool size based on expected load
   - Default: 20 connections

### Caching Strategy

1. **Redis Cache Layers**
   - User sessions (15 min TTL)
   - Organization metadata (1 hour TTL)
   - Agent configurations (30 min TTL)
   - Analytics results (1 hour TTL)

2. **Query Result Caching**
   - Cache expensive aggregations
   - Invalidate on data changes
   - Background refresh for popular queries

### Partitioning Strategy (Future)

For very large tables (100M+ rows):

```sql
-- Partition by organization for multi-tenant isolation
CREATE TABLE messages_partitioned (...)
PARTITION BY HASH (org_id) PARTITIONS 100;

-- Partition by date for time-series data
CREATE TABLE audit_logs_partitioned (...)
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026)
);
```

### Storage Estimation

Estimated storage for 100,000 active users:
- Users: ~20 MB
- Organizations: ~5 MB
- Documents (1000 @ 5MB avg): ~5 GB
- Document chunks (500K chunks): ~2 GB
- Messages (10M messages): ~5 GB
- Audit logs (50M logs): ~10 GB

**Total**: ~22.5 GB (with 2x replication = 45 GB)

---

## Data Migration Strategy

### Initial Setup

```bash
# 1. Generate Prisma migrations
npx prisma migrate dev --name init

# 2. Seed development data
npx prisma db seed

# 3. Verify indexes
\d+ documents_chunks
```

### Production Deployment

```bash
# 1. Backup existing database
pg_dump supportgpt > backup.sql

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM documents;

# 4. Rebuild indexes if needed
REINDEX DATABASE supportgpt;
```

---

## Conclusion

The SupportGPT database design emphasizes:
- **Scalability**: Partitioning ready, optimized indexing
- **Security**: Row-level security via org_id, audit trails
- **Performance**: Strategic indexing, caching layers, vector search
- **Reliability**: Referential integrity, constraint enforcement
- **Flexibility**: JSONB for metadata, extensible schema

This design supports enterprise-scale operations while maintaining application simplicity through Prisma ORM.

---

**Version**: 1.0
**Last Updated**: 2026-06-17
**Status**: Ready for Implementation

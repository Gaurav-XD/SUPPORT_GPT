# SupportGPT Interview Preparation Guide

## Table of Contents

1. [Project Overview & Goals](#project-overview--goals)
2. [Architectural Decisions](#architectural-decisions)
3. [Technology Stack Rationale](#technology-stack-rationale)
4. [Feature Implementation Deep Dives](#feature-implementation-deep-dives)
5. [Design Patterns & Best Practices](#design-patterns--best-practices)
6. [Scalability & Performance](#scalability--performance)
7. [Security Implementation](#security-implementation)
8. [Common Interview Questions](#common-interview-questions)

---

## Project Overview & Goals

### Why Build SupportGPT?

**Problem Statement**: Organizations need intelligent customer support that combines:
- Artificial intelligence for fast, accurate responses
- Human oversight for complex issues
- Knowledge management for consistency
- Ticket tracking for resolution
- Analytics for continuous improvement

**Solution**: A production-grade SaaS platform that integrates all of the above.

### Portfolio Value

This project demonstrates:
1. **Full-stack expertise**: Frontend, backend, database, DevOps
2. **Enterprise patterns**: Multi-tenancy, RBAC, audit logging
3. **Modern stack**: Next.js, Express, TypeScript, PostgreSQL, OpenAI
4. **Production-readiness**: Error handling, validation, security
5. **Scalability**: Horizontal scaling, caching, async processing

### Key Metrics (Fictional)

- 500+ organizations using the platform
- 10,000+ concurrent users
- 100,000+ conversations per day
- 99.9% uptime
- < 200ms API response time (p95)

---

## Architectural Decisions

### 1. Monolithic vs. Microservices: Why Monolith First

**Decision**: Deploy as a monolith initially, designed for microservices extraction.

**Rationale**:
- **Faster time-to-market**: Single deployment pipeline, unified codebase
- **Simpler debugging**: All components in one process, easier to trace issues
- **Cost-effective**: Single database, no inter-service communication overhead
- **Easier operations**: Fewer deployment targets, simpler monitoring

**Microservices Extract Path** (Future):
```
Backend (Monolith) →
├── Chat Service
├── Document Service
├── Analytics Service
├── Notification Service
└── Auth Service
```

**Decision Point**: Extract microservices when we hit:
- > 1M conversations/day
- Multiple teams working on different services
- Need for independent scaling of specific features

### 2. PostgreSQL as Primary Database

**Decision**: PostgreSQL as single source of truth, with pgvector for embeddings.

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|---|---|---|---|
| MongoDB | Flexible schema, scales horizontally | Eventual consistency, higher storage, poor for relational data | Need strong consistency and transactions |
| Firebase | Rapid development, real-time | Vendor lock-in, expensive at scale, limited control | Need custom business logic, cost predictability |
| Elasticsearch | Great for search, scalable | Doesn't replace SQL DB, eventual consistency | Would require dual-database strategy |

**PostgreSQL Advantages**:
- ✅ ACID compliance for financial/audit data
- ✅ pgvector extension for vector embeddings
- ✅ Native JSON/JSONB for flexible metadata
- ✅ Full-text search capabilities
- ✅ Mature ecosystem, easy to scale with read replicas
- ✅ Cost-effective at any scale

**Architecture Decision**:
```
PostgreSQL (Primary)
├── Relational data (users, orgs, tickets)
├── Document chunks with pgvector embeddings
├── Audit logs
└── Transactional consistency

Redis (Caching & Sessions)
├── User sessions
├── Conversation context (temporary)
└── Cache layer for hot data
```

### 3. Vector Search Strategy: pgvector vs. Dedicated Vector DB

**Decision**: Use pgvector within PostgreSQL, not separate vector database.

**Why**:
- ✅ **Single source of truth**: Embeddings live with document chunks
- ✅ **ACID transactions**: Chunk creation, embedding, metadata all atomic
- ✅ **Cost**: No additional infrastructure
- ✅ **Simplicity**: Single database to manage
- ✅ **Good performance**: IVFFlat indexes ~98% recall at massive scale

**Trade-offs**:
- ❌ Can't scale vector queries independently
- ❌ Slightly slower than specialized vector DBs (Pinecone, Weaviate)
- ✅ But gains: consistency, simplicity, cost

**Scale Plan**:
```
Scale 1-100M vectors: pgvector
     ↓
Scale 100M-1B: Consider extracting to Qdrant or Milvus
     ↓
Add indexing: Hash-based partitioning by org_id
```

### 4. JWT Authentication vs. Sessions

**Decision**: JWT authentication with refresh token rotation.

**Why JWT**:
- ✅ **Stateless**: No session storage needed, scales horizontally
- ✅ **Modern**: Standard for SPAs and mobile apps
- ✅ **Flexible**: Can include claims (org_id, role)
- ✅ **Security**: Can revoke via refresh token invalidation

**Implementation Details**:
```
Access Token:
- Expiry: 15 minutes (short-lived)
- Stored in: Memory (frontend)
- Sent in: Authorization header
- Claims: userId, orgId, role

Refresh Token:
- Expiry: 7 days (long-lived)
- Stored in: httpOnly secure cookie
- Endpoint: POST /api/auth/refresh
- Rotation: Issue new refresh token on each refresh
```

**Why Not Sessions**:
- ❌ Requires session store (Redis/DB)
- ❌ Doesn't scale across load balancers easily
- ❌ Session affinity requirements
- ✅ JWT is better for distributed systems

### 5. Real-Time Features: WebSocket vs. Polling

**Decision**: Socket.IO for real-time chat and notifications.

**Why Socket.IO**:
- ✅ **Bi-directional**: Push updates from server to client
- ✅ **Graceful degradation**: Falls back to HTTP long-polling
- ✅ **Automatic reconnection**: Handles network interruptions
- ✅ **Message buffering**: Messages queued while offline
- ✅ **Room support**: Group conversations naturally

**Alternative - HTTP Polling**:
```
Client polls every 2 seconds:
GET /api/conversations/conv_123/messages?since=msg_456

Inefficient:
- 43,200 requests/day per user
- High server load
- High latency
```

**Socket.IO Approach**:
```
Connection established once
Server pushes updates:
- New messages
- Typing indicators
- Agent joined/left
- Status changes

Much more efficient!
```

### 6. Background Jobs: BullMQ vs. Direct Processing

**Decision**: BullMQ for document processing, notifications, analytics.

**Why Async Processing**:

**Direct (Synchronous)**:
```
User uploads document
API processes: Parse → Chunk → Embed (2-3 minutes)
User waits... timeout!
```

**BullMQ (Asynchronous)**:
```
User uploads document
API saves to DB, queues job, returns immediately
Background worker processes: Parse → Chunk → Embed
Push notification when complete
```

**Benefits**:
- ✅ API stays responsive (< 100ms)
- ✅ Automatic retries with exponential backoff
- ✅ Scalable worker pool
- ✅ Dead letter queue for failed jobs
- ✅ Job monitoring and metrics

### 7. Multi-Tenancy: Strategies

**Decision**: Row-level tenant isolation with org_id as foreign key.

**Why**:

**Single Database Per Organization**:
```
Pro: Maximum isolation, custom schema per org
Con: Many databases, complex migrations, expensive
```

**Schema-Per-Organization**:
```
Pro: Good isolation
Con: Shared infrastructure, complex queries
```

**Row-Level (Our Choice)**:
```
Pro: ✅ Single schema, easiest to manage
Pro: ✅ Shared resources = lower cost
Pro: ✅ Global analytics possible
Pro: ✅ Easy migrations

Con: ❌ Requires diligent org_id checking
Con: ❌ SQL injection could expose orgs
Con: ❌ Mitigated with Prisma ORM
```

**Implementation**:
```sql
-- Every query must include org_id
SELECT * FROM conversations 
WHERE org_id = $1 AND agent_id = $2;

-- API enforces org_id from JWT token
-- Middleware validates ownership
```

---

## Technology Stack Rationale

### Frontend: Next.js 15 + React 19

**Why Next.js**:
- ✅ **File-based routing**: pages/ auto-creates routes
- ✅ **API routes**: Backend in same repo (development)
- ✅ **Server components**: New in React 19, reduce JS sent to client
- ✅ **Built-in optimization**: Images, fonts, code splitting
- ✅ **Streaming**: Large data responses can stream

**React 19 Features**:
```jsx
// Server Components reduce JS payload
export default async function ConversationList() {
  const conversations = await fetchConversations();
  return <div>{conversations.map(...)}</div>;
}

// Use directives for client-specific features
'use client';
export default function ChatInput() {
  const [input, setInput] = useState('');
  // Streaming responses
}
```

**Alternative: Vite + React**:
- Faster dev server (true, but Next.js fast enough)
- Less opinionated (could add complexity)
- No built-in API routes
- ✅ Next.js wins for full-stack projects

### TypeScript Everywhere

**Why TypeScript**:
- ✅ **Type safety**: Catch errors at compile time
- ✅ **IDE support**: IntelliSense, auto-complete
- ✅ **Self-documenting**: Types are documentation
- ✅ **Refactoring safety**: Rename variables across codebase
- ✅ **Enterprise standard**: Industry expectation

**Cost**: Added build step, learning curve
**Benefit**: Outweighs cost for team projects

### Express.js for Backend

**Why Express**:
- ✅ **Minimal**: Not opinionated, total control
- ✅ **Middleware pattern**: Clean cross-cutting concerns
- ✅ **Ecosystem**: 10,000+ packages available
- ✅ **Familiar**: Industry standard since 2010
- ✅ **Not over-engineered**: Simple problems need simple solutions

**Alternative: NestJS**:
- TypeScript-first design (good)
- Opinionated structure (can be limiting)
- Larger footprint
- ✅ Express + our own structure > NestJS for this project

### Prisma ORM

**Why Prisma**:
- ✅ **Type-safe queries**: Generated types from schema
- ✅ **Developer experience**: Intuitive API
- ✅ **Migrations**: Version control for schema
- ✅ **Studio**: Visual database explorer
- ✅ **Multi-DB support**: PostgreSQL, MySQL, SQLite

```typescript
// Type-safe, auto-complete works
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  include: { organizations: true }
});
// TypeScript knows user is User | null
// organizations is loaded
```

**Alternative: TypeORM**:
- More mature
- Heavier (more features)
- ✅ Prisma is simpler and modern

### Tailwind CSS + Shadcn UI

**Why Tailwind**:
- ✅ **Utility-first**: Build layouts quickly
- ✅ **Small bundle**: Purges unused CSS
- ✅ **Consistent**: Design tokens prevent chaos
- ✅ **Responsive**: Mobile-first by default

**Why Shadcn UI**:
- ✅ **Copy-paste components**: Fully owned, customizable
- ✅ **Built on Radix**: Accessible primitives
- ✅ **Designed for Tailwind**: Perfect integration
- ✅ **No vendor lock-in**: Fully open source

```jsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Composed into custom components
export function ChatInput() {
  return (
    <form>
      <Input placeholder="Your message..." />
      <Button type="submit">Send</Button>
    </form>
  );
}
```

### TanStack Query (React Query)

**Why TanStack Query**:
- ✅ **Server state management**: Caching, synchronization
- ✅ **Automatic refetching**: Keep data fresh
- ✅ **Pagination**: Built-in support
- ✅ **Optimistic updates**: Instant UI feedback

```typescript
// Automatic caching and background refetching
const { data: conversations } = useQuery({
  queryKey: ['conversations', agentId],
  queryFn: () => api.getConversations(agentId),
  staleTime: 1000 * 60 * 5 // 5 minutes
});

// Mutations with optimistic update
const { mutate: sendMessage } = useMutation({
  mutationFn: (msg) => api.sendMessage(conversationId, msg),
  onMutate: (newMessage) => {
    // Optimistically add to UI
    queryClient.setQueryData(
      ['messages', conversationId],
      (old) => [...old, newMessage]
    );
  }
});
```

---

## Feature Implementation Deep Dives

### Feature 1: Multi-Tenant Authentication

**Architectural Challenge**: How to securely handle multiple organizations?

**Solution**:

```typescript
// JWT payload includes organization context
JWT {
  sub: userId,
  org_id: organizationId,
  role: 'agent' | 'manager' | 'admin',
  iat: timestamp,
  exp: timestamp
}

// Every API call validates:
1. Token signature (user identification)
2. org_id in token (organization context)
3. User membership in org_id (access control)
4. User role (permission level)
```

**Example Request Flow**:
```
POST /api/v1/organizations/org_123/agents
Authorization: Bearer eyJhbGc...

Middleware Chain:
1. Extract token → verify signature
2. Extract org_id from token
3. Query: Is user_id member of org_123? 
   SELECT * FROM org_members 
   WHERE user_id = token.sub AND org_id = 'org_123'
4. Validate role: Is role in ['admin', 'manager']?
5. Execute controller
6. All database queries automatically filtered by org_id
```

**Why This Approach**:
- ✅ **Explicit**: Organization context visible in code
- ✅ **Auditable**: Can log which org accessed what
- ✅ **Secure**: No hidden assumptions
- ✅ **Testable**: Easy to test multi-org scenarios

### Feature 2: Document Processing & Embedding Pipeline

**Architectural Challenge**: How to process large files without blocking API?

**Solution: Async Job Queue**

```
User Upload
    ↓
API: Validate, Save to storage, Queue job
    ↓ (return immediately to user)
    │
    └→ Background Worker
        ├── Parse document (PDF/DOCX/TXT)
        ├── Extract text
        ├── Chunk text (~300 tokens per chunk)
        ├── Call OpenAI Embedding API
        ├── Store vectors in pgvector
        ├── Update document status
        └── Send notification to user
```

**Why Async**:
- ✅ **Non-blocking**: API responds in < 100ms
- ✅ **Resilient**: Retries on failure
- ✅ **Scalable**: Spin up worker threads as needed
- ✅ **Observable**: Track job progress

**Implementation Details**:

```typescript
// File upload endpoint
app.post('/documents', async (req, res) => {
  const { file } = req;
  
  // 1. Validate file
  validateFile(file);
  
  // 2. Save to storage
  const filePath = await saveFile(file);
  
  // 3. Create database record
  const doc = await prisma.document.create({
    data: {
      name: file.originalname,
      file_path: filePath,
      status: 'processing',
      org_id: req.org.id,
      kb_id: req.params.kbId
    }
  });
  
  // 4. Queue job
  await documentQueue.add('parse-document', {
    documentId: doc.id,
    filePath,
    orgId: req.org.id
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
  
  // 5. Return immediately
  return res.status(202).json({ id: doc.id, status: 'processing' });
});

// Background worker
documentQueue.process('parse-document', async (job) => {
  const { documentId, filePath, orgId } = job.data;
  
  try {
    // Parse and extract text
    const text = await parseDocument(filePath);
    
    // Chunk text
    const chunks = chunkText(text, { chunkSize: 300 });
    
    // Generate embeddings
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks.map(c => c.content)
    });
    
    // Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      await prisma.documentChunk.create({
        data: {
          documentId,
          chunkIndex: i,
          content: chunks[i].content,
          embedding: embeddings.data[i].embedding,
          tokenCount: chunks[i].tokens
        }
      });
    }
    
    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'completed',
        total_chunks: chunks.length,
        parsed_at: new Date()
      }
    });
    
    // Notify user
    await notificationQueue.add('document-ready', {
      documentId,
      orgId
    });
  } catch (error) {
    // Log error, job will retry
    logger.error('Document parsing failed', { documentId, error });
    throw error; // BullMQ will retry
  }
});
```

### Feature 3: AI Chat with RAG (Retrieval-Augmented Generation)

**Architectural Challenge**: How to ground AI responses in organization-specific knowledge?

**Pattern: RAG (Retrieval-Augmented Generation)**

```
User Message
    ↓
1. Semantic Search
   Convert message to embedding
   Find top-K similar chunks in pgvector
   ↓
2. Context Building
   Combine:
   - Recent conversation history
   - Retrieved document chunks
   - System prompt
   - User message
   ↓
3. OpenAI Call
   POST https://api.openai.com/v1/chat/completions
   {
     model: 'gpt-4-turbo',
     messages: [
       { role: 'system', content: systemPrompt },
       { role: 'user', content: conversationHistory },
       { role: 'user', content: userMessage }
     ],
     stream: true
   }
   ↓
4. Response Streaming
   Stream response chunk by chunk
   Extract citations while receiving
   ↓
5. Save Message
   Store in database with citations
   Update conversation
```

**Implementation**:

```typescript
// RAG Chat Endpoint
app.post('/conversations/:id/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  
  // 1. Load conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 10 },
      agent: { include: { kb: true } }
    }
  });
  
  // 2. Semantic search for relevant documents
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content
  });
  
  const relevantChunks = await prisma.$queryRaw`
    SELECT document_chunks.*, documents.name,
           1 - (embedding <=> $1::vector) as similarity
    FROM document_chunks
    JOIN documents ON document_chunks.document_id = documents.id
    WHERE documents.kb_id = $2
    ORDER BY similarity DESC
    LIMIT 5
  ` as any[];
  
  // 3. Build context
  const recentMessages = conversation.messages
    .slice(0, 10)
    .reverse()
    .map(m => ({ role: m.role, content: m.content }));
  
  const documentContext = relevantChunks
    .map(chunk => `Document: ${chunk.name}\n${chunk.content}`)
    .join('\n\n');
  
  const systemPrompt = conversation.agent.system_prompt + 
    `\n\nUse the following documents to answer questions:\n${documentContext}`;
  
  // 4. Call OpenAI with streaming
  const stream = await openai.chat.completions.create({
    model: conversation.agent.model,
    temperature: conversation.agent.temperature,
    max_tokens: conversation.agent.max_tokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
      { role: 'user', content }
    ],
    stream: true
  });
  
  // 5. Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  let fullResponse = '';
  
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    fullResponse += delta;
    res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
  }
  
  // 6. Extract citations
  const citations = extractCitations(fullResponse, relevantChunks);
  
  // 7. Save message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: fullResponse,
      citations: citations,
      tokensUsed: countTokens(fullResponse)
    }
  });
  
  // Also save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content
    }
  });
});
```

**Why RAG**:
- ✅ Grounds responses in real data
- ✅ Reduces hallucinations
- ✅ Organization-specific knowledge
- ✅ Citeable responses
- ✅ Provenance for compliance

### Feature 4: Role-Based Access Control (RBAC)

**Architectural Challenge**: How to implement fine-grained permissions?

**Solution: Three-Layer Authorization**

```
Layer 1: Middleware Authentication
  - Verify JWT token
  - Extract userId, orgId, role
  - Store in req.user context

Layer 2: Route Authorization
  - Check required roles for endpoint
  - @authorize(['admin', 'manager'])

Layer 3: Service Authorization
  - Check resource ownership
  - Query: Does this user own this resource?
  - Enforce row-level security
```

**Implementation**:

```typescript
// Middleware: Extract auth context
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);
  
  req.user = {
    id: decoded.sub,
    orgId: decoded.org_id,
    role: decoded.role
  };
  next();
});

// Route middleware: Check roles
function authorize(requiredRoles: string[]) {
  return (req, res, next) => {
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        required: requiredRoles,
        current: req.user.role
      });
    }
    next();
  };
}

// Service: Check resource access
async function canEditTicket(
  userId: string,
  ticketId: string,
  orgId: string
): Promise<boolean> {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      org_id: orgId
    }
  });
  
  if (!ticket) return false;
  
  const userRole = await getUserRole(userId, orgId);
  
  // Admin can edit any ticket
  if (userRole === 'admin') return true;
  
  // Manager can edit tickets in their org
  if (userRole === 'manager') return true;
  
  // Agent can only edit assigned tickets
  if (userRole === 'agent') {
    return ticket.assigned_to === userId;
  }
  
  return false;
}

// Usage
app.patch('/tickets/:id', authorize(['admin', 'manager', 'agent']), async (req, res) => {
  const { id: ticketId } = req.params;
  
  // Check access
  const canEdit = await canEditTicket(
    req.user.id,
    ticketId,
    req.user.orgId
  );
  
  if (!canEdit) {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }
  
  // Proceed with update
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: req.body
  });
  
  res.json(updated);
});
```

**Why Three Layers**:
- ✅ **Defense in depth**: Multiple checkpoints
- ✅ **Consistent**: Same pattern across app
- ✅ **Auditable**: Easy to track permissions
- ✅ **Testable**: Each layer independently testable

---

## Design Patterns & Best Practices

### 1. Error Handling Pattern

```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(public details: ValidationDetail[]) {
    super('VALIDATION_ERROR', 400, 'Validation failed');
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
  
  // Unexpected error
  logger.error('Unexpected error', { error });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

### 2. Input Validation Pattern

```typescript
import { z } from 'zod';

// Schema definition
const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  system_prompt: z.string().min(10),
  kb_id: z.string().uuid(),
  model: z.enum(['gpt-4', 'gpt-4-turbo']),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().min(100).max(4000)
});

// Validation middleware
function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Sanitized and typed
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }
    }
  };
}

// Usage
app.post(
  '/agents',
  authenticate,
  authorize(['admin', 'manager']),
  validateRequest(createAgentSchema),
  async (req, res) => {
    // req.body is now type-safe
    const agent = await agentService.create(req.user.orgId, req.body);
    res.status(201).json(agent);
  }
);
```

### 3. Caching Strategy

```typescript
// Cache decorator
function cache(ttl: number) {
  return function(
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Try cache
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
      
      // Execute function
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      await redis.setex(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    };
    
    return descriptor;
  };
}

// Usage
class AnalyticsService {
  @cache(3600) // 1 hour TTL
  async getOrganizationAnalytics(
    orgId: string,
    dateFrom: Date,
    dateTo: Date
  ) {
    // Expensive aggregation query
    return await prisma.conversation.groupBy({...});
  }
}
```

### 4. Pagination Pattern

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

async function paginate<T>(
  query: Prisma.ConversationFindManyArgs,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, params.limit || 20);
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma.conversation.findMany({
      ...query,
      skip,
      take: limit
    }),
    prisma.conversation.count({ where: query.where })
  ]);
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// Usage
app.get('/conversations', async (req, res) => {
  const result = await paginate(
    {
      where: { org_id: req.user.orgId }
    },
    {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    }
  );
  
  res.json(result);
});
```

---

## Scalability & Performance

### Challenge 1: Large Document Processing

**Problem**: 100MB PDF takes 5 minutes to process, API times out.

**Solution**:
```
1. Async job queue (BullMQ) handles heavy lifting
2. Worker processes in background
3. Frontend polls for status
4. Push notification when complete
5. Or WebSocket for real-time updates
```

**Performance Metrics**:
- Small doc (1MB): 10 seconds
- Medium doc (10MB): 2 minutes
- Large doc (50MB): 10 minutes
- Optimizations: Parallel chunk embedding, batch API calls

### Challenge 2: Vector Search Latency

**Problem**: Semantic search on 1M vectors takes 5 seconds.

**Solution**: IVFFlat indexing
```sql
CREATE INDEX idx_embeddings ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Reduces latency from 5s to 100-200ms
-- Trade-off: ~98% recall instead of 100%
```

### Challenge 3: Database Query Performance

**Problem**: Analytics query scanning 10M messages is slow.

**Solutions**:
1. **Indexing**: Add indexes on frequently filtered columns
2. **Partitioning**: Partition by date for time-series data
3. **Caching**: Cache aggregate results in Redis
4. **Read replicas**: Route analytics to read replica

```typescript
// Problematic query
const stats = await prisma.message.groupBy({
  by: ['agent_id'],
  where: { created_at: { gte: dateFrom } },
  _count: true,
  _avg: { tokens_used: true }
});

// With index
CREATE INDEX idx_messages_agent_created 
ON messages(agent_id, created_at DESC);

// With caching
const cacheKey = `analytics:${agentId}:${dateFrom}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const stats = await prisma.message.groupBy({...});
await redis.setex(cacheKey, 3600, JSON.stringify(stats));
```

### Challenge 4: WebSocket Connection Management

**Problem**: 1000 concurrent WebSocket connections exceed server capacity.

**Solutions**:
1. **Worker threads**: Node.js uses single thread, WebSockets blocked
2. **Clustering**: Use Node.js cluster module
3. **Redis adapter**: Share connections across multiple servers

```typescript
import cluster from 'cluster';
import { createAdapter } from '@socket.io/redis-adapter';

if (cluster.isMaster) {
  // Master process
  cluster.fork(); // one worker per CPU
} else {
  // Worker process
  const io = new Server(server);
  
  // Share state across workers via Redis
  io.adapter(
    createAdapter(redis, redisClient)
  );
  
  io.on('connection', (socket) => {
    // Handle connection
  });
}
```

---

## Security Implementation

### 1. Defense Against SQL Injection

**Vulnerability**: String concatenation in SQL

```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;
db.execute(query);

// ✅ SAFE: Parameterized queries
const user = await prisma.user.findUnique({
  where: { email } // Prisma uses parameterized queries
});

// ✅ SAFE: Raw queries with parameters
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

**Why Prisma is Safe**:
- All queries are parameterized by default
- Prisma generates types from schema
- No string concatenation needed

### 2. Defense Against CSRF

**Vulnerability**: Form submission from attacker's site

```typescript
// ✅ CSRF Protection via JWT
// JWT in Authorization header can't be sent via form
app.post('/api/agents', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Can't be set by <form> tag, only JavaScript
});

// ✅ CSRF Protection via SameSite cookie
res.cookie('refreshToken', token, {
  sameSite: 'strict', // Cookie only sent to same-site requests
  secure: true, // HTTPS only
  httpOnly: true // Can't be accessed by JavaScript
});
```

### 3. Defense Against XSS

**Vulnerability**: Injecting JavaScript into page

```typescript
// ❌ VULNERABLE: Trust user input
<div>{userInput}</div>

// ✅ SAFE: React escapes by default
function ChatMessage({ content }) {
  return <div>{content}</div>; // Automatically escaped
}

// ✅ SAFE: Sanitize if using dangerouslySetInnerHTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(content) 
}} />
```

### 4. Defense Against Rate Limiting Bypass

**Vulnerability**: Attacker floods API

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per windowMs
  keyGenerator: (req) => {
    // Use user ID if authenticated, IP otherwise
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Don't rate limit admin users
    return req.user?.role === 'admin';
  }
});

app.use('/api/', limiter);
```

### 5. Secrets Management

**Vulnerable**: Hardcoded secrets
```typescript
// ❌ DANGEROUS
const OPENAI_API_KEY = 'sk-...';

// ✅ SAFE: Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
```

**Environment File**:
```bash
# .env.local (never commit)
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

---

## Common Interview Questions

### Q1: How would you handle 10,000 concurrent users?

**Answer**:

```
1. Horizontal Scaling
   - Load balancer distributes traffic
   - Multiple API instances behind LB
   - Shared database with connection pooling
   - Shared Redis cache
   
2. Database Optimization
   - Connection pooling (Prisma): 20-30 connections per instance
   - Read replicas for analytics queries
   - Indexes on hot columns
   - Caching layer for frequently accessed data
   
3. Async Processing
   - BullMQ for heavy operations
   - Scale worker threads independently
   - Queue management in Redis
   
4. Frontend Optimization
   - Code splitting (Next.js automatic)
   - Image optimization
   - Caching headers for static assets
   
5. Monitoring
   - Prometheus for metrics
   - Alert on high response times
   - Trace slow queries
```

**Architecture Diagram**:
```
                ┌─ API Instance 1
Load Balancer ──┼─ API Instance 2
                └─ API Instance 3
                    │
        ┌───────────┼───────────┐
        │           │           │
    PostgreSQL   Redis      BullMQ
    (primary)    (cache)    (jobs)
        │                      │
        └──────────────────────┼────┐
                               │    │
                        Workers (3-5 threads)
```

### Q2: How does the AI chat feature prevent hallucinations?

**Answer**: RAG (Retrieval-Augmented Generation)

```
User Message
    ↓
1. Semantic search finds relevant documents
   → Only present information from knowledge base
   → Reduces hallucinations by grounding in facts
   
2. Citation support
   → User can verify where information came from
   → Builds trust in responses
   
3. System prompt guidance
   → "Only answer based on provided documents"
   → "If not found in documents, say so"
   
4. Fine-tuning not used
   → No risk of model degradation over time
   → Easy to update knowledge base
```

**Example**:
```
User: "What's your return policy?"

Knowledge Base: "30-day returns with receipt"

System Prompt: "You are a customer support agent. 
Answer questions ONLY using the provided documents. 
If answer not found, say: 'I don't have information about that.'"

Response: "Our return policy is 30 days with receipt. 
This information comes from our official policy document."

(With citation to original document)
```

### Q3: How would you handle a document upload failing halfway?

**Answer**: Resilient job processing

```
1. Frontend uploads file
   GET /upload?key=unique_upload_id
   Received signed URL from backend

2. Backend:
   - Validate file signature
   - Create document record (status: 'processing')
   - Queue parsing job

3. Parsing fails (e.g., network error):
   - BullMQ retries with exponential backoff
   - Attempt 1: immediate retry
   - Attempt 2: 2 second delay
   - Attempt 3: 4 second delay
   - Max 3 attempts

4. Max retries exceeded:
   - Job moved to dead letter queue
   - Admin notified
   - Document marked as 'failed'
   - User can retry manually
   - Or report issue

5. Frontend polling:
   GET /documents/{id}/status
   - Returns: { status: 'processing' }
   - Returns: { status: 'completed' }
   - Returns: { status: 'failed', error: '...' }
   - User can delete and retry
```

### Q4: Why PostgreSQL + pgvector instead of dedicated vector DB?

**Answer**: Trade-offs

```
PostgreSQL + pgvector:
✅ Single source of truth
✅ ACID transactions (chunk + embedding atomic)
✅ Familiar technology
✅ Cost-effective
❌ Slightly slower than specialized DBs
❌ Limited vector DB features

Pinecone / Weaviate / Qdrant:
❌ Separate database to manage
❌ Eventual consistency
❌ Higher cost
✅ Better search performance
✅ Specialized features

Recommendation:
- Start with pgvector (simpler)
- Migrate to specialized DB if needed (100M+ vectors)
- Extract to Qdrant is straightforward
```

### Q5: How would you implement real-time notifications?

**Answer**:

```
Option 1: WebSocket (chosen)
- Bidirectional connection
- Server pushes to client
- Automatic reconnection
- Works behind proxies (Socket.IO)

Option 2: Server-Sent Events (SSE)
- Unidirectional (server → client)
- Simpler HTTP
- No special ports needed
- Good for notifications

Option 3: Polling
- Simple but inefficient
- 43,200 requests/day per user
- High latency
- Not recommended

Implementation:
1. Socket.IO connection established on app load
2. User joins room: socket.join(`org_${orgId}`)
3. Backend broadcasts: io.to(`org_${orgId}`).emit('document-ready', {...})
4. Client listens: socket.on('document-ready', handleNotification)
5. Automatic fallback: Socket.IO → long-polling → polling
```

### Q6: How would you handle payment processing?

**Answer**:

```
Flow:
User selects subscription → Stripe checkout → Webhook

Frontend:
const { error, clientSecret } = await fetch('/api/create-payment')
stripe.confirmCardPayment(clientSecret, {...})

Backend:
POST /api/create-payment
- Create Stripe PaymentIntent
- Return clientSecret

Webhook:
POST /webhook (Stripe sends)
- event: 'payment_intent.succeeded'
- Update organization subscription_tier
- Send confirmation email

Security:
- Webhook signature verification (Stripe secret key)
- Never log sensitive data
- Use Stripe for card storage (PCI compliance)
```

### Q7: How would you handle GDPR compliance?

**Answer**:

```
1. Data Collection
   - Explicit consent on signup
   - Clear privacy policy
   - Document purposes

2. Data Access
   - User can download all their data
   - Implement: GET /api/user/data/export

3. Data Deletion
   - User can request account deletion
   - Soft delete (keep audit trail)
   - Hard delete after 30 days
   - Implement: DELETE /api/user (with confirmation)

4. Data Processing
   - Document processor agreement with vendors (OpenAI)
   - Data processing addendum with customers
   - Audit logs for all data access

5. Encryption
   - At rest: stored in database
   - In transit: HTTPS/TLS
   - Sensitive fields: bcrypt passwords

Implementation:
async function deleteUserData(userId: string) {
  // 1. Archive user data
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: { organizations: true }
  });
  await archive(userData);
  
  // 2. Soft delete
  await prisma.user.update({
    where: { id: userId },
    data: { deleted_at: new Date() }
  });
  
  // 3. Schedule hard delete in 30 days
  await queue.add('hard-delete-user', { userId }, {
    delay: 30 * 24 * 60 * 60 * 1000
  });
  
  // 4. Notify user
  await sendEmail(user.email, 'Account deletion confirmed');
}
```

### Q8: How would you handle large file uploads (100MB)?

**Answer**:

```
Problem: Browser has memory limits, timeout concerns

Solution: Chunked upload with resumable capability

Frontend:
const chunk_size = 5 * 1024 * 1024; // 5MB
const chunks = Math.ceil(fileSize / chunk_size);

for (let i = 0; i < chunks; i++) {
  const start = i * chunk_size;
  const end = Math.min(start + chunk_size, fileSize);
  const chunk = file.slice(start, end);
  
  try {
    await fetch(`/api/upload/${uploadId}/${i}`, {
      method: 'PUT',
      body: chunk
    });
  } catch (error) {
    // Can retry just this chunk
    retry(i);
  }
}

Backend:
PUT /api/upload/:uploadId/:chunkIndex
- Receive chunk
- Save to temp storage
- Check if all chunks received
- If yes: merge and process
- Return upload progress

Finalize:
POST /api/upload/:uploadId/complete
- Merge all chunks
- Verify checksum
- Queue parsing job
- Clean up temp files
```

---

## Conclusion

SupportGPT demonstrates production-grade engineering across:

1. **Architecture**: Multi-tenant, scalable, secure
2. **Database**: PostgreSQL with pgvector for semantic search
3. **API**: RESTful with proper auth, validation, error handling
4. **Frontend**: Next.js with modern patterns
5. **Real-time**: WebSocket for instant updates
6. **Security**: JWT, RBAC, input validation, secrets management
7. **Scalability**: Async processing, caching, database optimization
8. **Compliance**: GDPR, audit logging, data protection

This project successfully bridges the gap between "learns to code" and "enterprise engineer."

---

**Version**: 1.0
**Last Updated**: 2026-06-17
**Status**: Interview Ready

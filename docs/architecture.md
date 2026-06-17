# SupportGPT Architecture Documentation

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Architectural Patterns](#architectural-patterns)
3. [Component Overview](#component-overview)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability Strategy](#scalability-strategy)
7. [Error Handling & Resilience](#error-handling--resilience)

---

## System Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Web Browser (Next.js Frontend)                          ││
│  │  - React Components                                      ││
│  │  - TanStack Query (Server State)                         ││
│  │  - Socket.IO Client (Real-time)                          ││
│  └─────────────────────────────────────────────────────────┘│
└──────┬──────────────────────────────────────────────────────┘
       │ HTTPS / WebSocket
       ├────────────────────────────────────────────────────────┐
       │                                                          │
┌──────▼──────────────────────────────────────────────────────┐│
│             API Gateway & Load Balancing                     ││
└──────┬──────────────────────────────────────────────────────┘│
       │                                                          │
┌──────▼────────────────────────────────────────────────────────┐
│           Application Layer (Express.js)                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ API Routes & Controllers                                 │ │
│ │ - Auth Routes                                            │ │
│ │ - Organization Routes                                   │ │
│ │ - Knowledge Base Routes                                 │ │
│ │ - Chat Routes                                           │ │
│ │ - Ticket Routes                                         │ │
│ │ - Analytics Routes                                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ Service Layer (Business Logic)                        │    │
│ │ - AuthService                                         │    │
│ │ - OrganizationService                                 │    │
│ │ - ChatService                                         │    │
│ │ - DocumentService                                     │    │
│ │ - TicketService                                       │    │
│ │ - AnalyticsService                                    │    │
│ └───────────────────────────────────────────────────────┘    │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │                   │                   │
┌───────▼──────┐  ┌────────▼────────┐ ┌───────▼────────┐
│ PostgreSQL   │  │  Redis Cache    │ │  External APIs │
│ - Users      │  │  - Sessions     │ │  - OpenAI      │
│ - Orgs       │  │  - Cache        │ │  - OAuth       │
│ - Documents  │  │                 │ │                │
│ - pgvector   │  │                 │ │                │
└──────────────┘  └─────────────────┘ └────────────────┘

┌────────────────────────────────────────────────────────────┐
│           Background Job Processing (BullMQ)               │
│  - Document Parsing & Embedding                            │
│  - Email Notifications                                     │
│  - Analytics Calculation                                   │
│  - Data Cleanup                                            │
└────────────────────────────────────────────────────────────┘
```

### Layered Architecture

SupportGPT follows a **three-tier layered architecture**:

#### 1. **Presentation Layer** (Frontend)
- **Technology**: Next.js 15, React 19, TypeScript
- **Responsibility**: User interface rendering, client-side validation, state management
- **Components**:
  - Pages and routes
  - Reusable React components
  - Forms and input handling
  - Real-time UI updates via WebSocket

#### 2. **Business Logic Layer** (Backend)
- **Technology**: Express.js, Node.js, TypeScript
- **Responsibility**: API endpoints, authentication, authorization, business rule enforcement
- **Components**:
  - **Controllers**: Handle HTTP requests/responses
  - **Services**: Implement business logic, orchestrate operations
  - **Middleware**: Cross-cutting concerns (auth, logging, validation)
  - **Utils**: Helper functions and shared utilities

#### 3. **Data Layer** (Database)
- **Technology**: PostgreSQL with Prisma ORM, Redis, pgvector
- **Responsibility**: Data persistence, retrieval, and integrity
- **Components**:
  - PostgreSQL database
  - Vector store (pgvector)
  - Redis cache
  - Prisma data access layer

---

## Architectural Patterns

### 1. **Service-Oriented Architecture (SOA)**

The application is organized around core business services:

```typescript
// Example service pattern
class ChatService {
  async createConversation(userId: string, agentId: string): Promise<Conversation> {
    // Business logic
  }
  
  async generateResponse(
    conversationId: string,
    userMessage: string
  ): Promise<AIResponse> {
    // Orchestrate document retrieval, OpenAI call, citation generation
  }
  
  async saveMessage(conversationId: string, message: Message): Promise<void> {
    // Persist to database
  }
}
```

**Benefit**: Clear separation of concerns, testable, maintainable code.

### 2. **Repository Pattern**

Data access is abstracted through repositories:

```typescript
// Prisma acts as our ORM/repository
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { organizations: true }
});
```

**Benefit**: Decouples business logic from data access, easier testing with mocks.

### 3. **Dependency Injection**

Services are instantiated with their dependencies:

```typescript
// Express middleware or constructor injection
const chatService = new ChatService(
  prisma,
  openaiClient,
  vectorStore,
  documentService
);
```

**Benefit**: Loose coupling, easier to test, flexible composition.

### 4. **Middleware Pattern**

Express middleware handles cross-cutting concerns:

```typescript
app.use(requestLogger);           // Logging
app.use(authenticate);             // Authentication
app.use(authorize);                // Authorization
app.use(validateRequest);          // Input validation
app.use(errorHandler);             // Error handling
```

**Benefit**: Clean separation of concerns, reusable middleware.

### 5. **Observer Pattern (Event-Driven)**

Using BullMQ job queues for async operations:

```typescript
// Emit event when document uploaded
await documentQueue.add('parse-document', {
  documentId,
  filePath,
  organizationId
});

// Listen for the event
documentQueue.process('parse-document', async (job) => {
  // Parse, chunk, embed, store
});
```

**Benefit**: Decoupled async operations, scalable processing, retry mechanisms.

### 6. **RBAC (Role-Based Access Control)**

Permission checking at multiple levels:

```typescript
// Route-level authorization
app.post('/api/agents', authorize(['admin', 'manager']), createAgent);

// Service-level authorization
async canEditAgent(userId: string, agentId: string): Promise<boolean> {
  const userRole = await getUserRole(userId, agentId);
  return ['admin', 'manager'].includes(userRole);
}
```

**Benefit**: Fine-grained control, security, audit trail.

---

## Component Overview

### Backend Components

#### Authentication Service
- Handles user registration, login, logout
- Manages JWT tokens and refresh tokens
- Integrates with Google OAuth
- Password reset workflows

```
Request → AuthController → AuthService → UserRepository → Database
                            ↓
                       JWTGenerator
```

#### Organization Service
- Creates and manages organizations
- Handles team member invitations
- Manages roles and permissions
- Enforces tenant isolation

#### Document Service
- Handles file uploads
- Parses documents (PDF, DOCX, TXT)
- Chunks text for optimal embeddings
- Coordinates embedding generation
- Stores vectors in pgvector

```
PDF Upload → FileValidator → DocumentParser → TextChunker → EmbeddingGenerator → pgvector
```

#### Chat Service
- Manages conversations
- Retrieves relevant documents via semantic search
- Calls OpenAI API with context
- Streams responses back to client
- Captures citations and metadata

```
User Message → ChatController → ChatService
                                    ↓
                            SemanticSearch (pgvector)
                                    ↓
                            OpenAI API Call
                                    ↓
                            Citation Extraction
                                    ↓
                            Stream Response
```

#### Ticket Service
- Creates and manages support tickets
- Handles assignment and escalation
- Tracks status and SLA
- Manages comments and attachments

#### Analytics Service
- Aggregates metrics
- Computes performance indicators
- Provides time-series data
- Caches results for performance

### Frontend Components

#### Authentication Pages
- Login page with email/password
- Google OAuth integration
- Registration form
- Password reset flow

#### Dashboard
- Organization overview
- Key metrics
- Quick actions
- Recent activity

#### Chat Interface
- Conversation list
- Message display with citations
- Input form with file attachment
- Real-time typing indicators
- Conversation history

#### Knowledge Base Management
- Document upload interface
- Document list with metadata
- Search functionality
- Document versioning

#### Agent Management
- Agent creation form
- Configuration interface
- Knowledge source assignment
- Performance metrics

#### Ticket System
- Ticket list with filters
- Ticket detail view
- Comments and timeline
- Assignment and status updates

#### Analytics Dashboard
- Charts and graphs
- Time range selection
- Export functionality
- Custom report builder

---

## Data Flow

### 1. Document Upload & Embedding Flow

```
1. User uploads document (PDF/DOCX/TXT)
   ↓
2. Frontend sends POST /api/documents/upload
   ↓
3. Backend validates file
   ↓
4. Backend saves file to storage
   ↓
5. Backend queues job: 'parse-document'
   ↓
6. BullMQ worker processes:
   a. Parse document → Extract text
   b. Chunk text → ~300 token chunks with overlap
   c. Generate embeddings → OpenAI API
   d. Store vectors → pgvector
   ↓
7. Mark document as ready in database
   ↓
8. Frontend notified via notification system
```

### 2. AI Chat Query Flow

```
1. User sends message in chat
   ↓
2. Frontend sends message via WebSocket
   ↓
3. Backend receives message, validates
   ↓
4. Semantic search in pgvector
   → Find top-K similar document chunks
   ↓
5. Build context:
   - Conversation history
   - Retrieved documents
   - System prompt
   - User message
   ↓
6. Call OpenAI API with streaming enabled
   ↓
7. Extract citations from response
   ↓
8. Stream response back to frontend in real-time
   ↓
9. Store message and response in database
   ↓
10. Frontend displays with citations
```

### 3. User Authentication Flow

```
1. User submits login credentials
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend verifies credentials
   ↓
4. Generate JWT token (15 min expiry)
   ↓
5. Generate refresh token (7 days expiry)
   ↓
6. Store refresh token in Redis + database
   ↓
7. Return tokens to frontend
   ↓
8. Frontend stores JWT in memory, refresh token in httpOnly cookie
   ↓
9. Include JWT in Authorization header for API requests
   ↓
10. On token expiry, use refresh token to get new JWT
```

### 4. Ticket Creation Flow

```
1. Chat conversation resolved
   ↓
2. User creates ticket from conversation
   ↓
3. Frontend sends POST /api/tickets
   ↓
4. Backend creates ticket record
   ↓
5. Link conversation and relevant documents
   ↓
6. Assign based on routing rules
   ↓
7. Queue notification job
   ↓
8. Return ticket details to frontend
```

---

## Security Architecture

### Authentication

1. **JWT-Based Authentication**
   - Short-lived access tokens (15 minutes)
   - Refresh tokens stored securely
   - Token revocation capability
   - Refresh token rotation

2. **OAuth Integration**
   - Google OAuth 2.0
   - Secure callback handling
   - Session management

3. **Password Security**
   - Bcrypt hashing with salt rounds
   - Password reset via secure email links
   - Rate limiting on login attempts

### Authorization

1. **Role-Based Access Control (RBAC)**
   - Admin: Full access
   - Manager: Organization-level management
   - Agent: Limited to assigned tickets and conversations
   - Viewer: Read-only access

2. **Tenant Isolation**
   - Database row-level filtering by organization_id
   - Middleware enforces organization context
   - Cross-tenant requests rejected

3. **API Key Management**
   - API keys for service-to-service communication
   - Scoped permissions
   - Key rotation capability

### Data Protection

1. **Encryption**
   - HTTPS/TLS for data in transit
   - Sensitive fields encrypted at rest (bcrypt for passwords)
   - Environment variables for secrets (never in code)

2. **Input Validation**
   - Zod schemas for request validation
   - Type checking at TypeScript level
   - SQL injection prevention via Prisma ORM

3. **Rate Limiting**
   - Global rate limit: 1000 requests/hour per IP
   - Per-user rate limit: 100 requests/minute
   - API endpoint-specific limits

### Audit & Logging

1. **Audit Trails**
   - Log all user actions
   - Track configuration changes
   - Document access logs
   - API request/response logging

2. **Structured Logging**
   - Timestamp, level, message, context
   - User ID and organization ID
   - Request ID for tracing
   - Error stack traces in development

---

## Scalability Strategy

### Horizontal Scaling

1. **Stateless API Design**
   - No in-memory state
   - All state in database or cache
   - Sessions stored in Redis
   - Multiple API instances behind load balancer

2. **Database Scaling**
   - Connection pooling via Prisma
   - Read replicas for analytics queries
   - Database sharding ready (by organization)
   - Indexes on frequently queried columns

3. **Caching Strategy**
   - Redis for session management
   - Cached computation results
   - API response caching
   - Document metadata caching

### Vertical Scaling

1. **Resource Optimization**
   - Pagination for large result sets
   - Field selection/projection
   - Async operations via BullMQ
   - Streaming for large responses

2. **Performance Optimizations**
   - Database query optimization
   - Proper indexing
   - N+1 query prevention
   - Lazy loading with GraphQL-ready architecture

### Async Processing

1. **Job Queue (BullMQ)**
   - Document parsing and embedding
   - Email notifications
   - Analytics aggregation
   - Data cleanup tasks

2. **Benefits**
   - Non-blocking user requests
   - Retry mechanisms
   - Delayed processing
   - Scalable worker pool

---

## Error Handling & Resilience

### Error Categories

1. **Client Errors (4xx)**
   - 400: Bad Request (validation error)
   - 401: Unauthorized (missing auth)
   - 403: Forbidden (insufficient permissions)
   - 404: Not Found
   - 429: Too Many Requests (rate limit)

2. **Server Errors (5xx)**
   - 500: Internal Server Error
   - 503: Service Unavailable
   - 504: Gateway Timeout

### Error Handling Pattern

```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  } else if (error instanceof AuthorizationError) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  } else if (error instanceof NotFoundError) {
    return res.status(404).json({ error: 'Resource not found' });
  } else {
    logger.error('Unexpected error', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Resilience Patterns

1. **Retry Logic**
   - Exponential backoff for transient failures
   - Circuit breaker for failing services
   - Max retry attempts with fallback

2. **Graceful Degradation**
   - Cache fallback for database failures
   - Default responses when AI service fails
   - Partial functionality available

3. **Monitoring & Alerting**
   - Health check endpoints
   - Error rate monitoring
   - Response time tracking
   - Resource utilization alerts

---

## Technology Integration Points

### OpenAI Integration

- **Purpose**: AI-powered chat responses
- **Models**: GPT-4, GPT-4 Turbo
- **Usage**: Context-aware responses with document citations
- **Rate Limits**: Handle gracefully with user-friendly errors

### pgvector Integration

- **Purpose**: Semantic search on document embeddings
- **Usage**: Retrieve relevant documents for chat context
- **Optimization**: Proper indexing for fast similarity search
- **Scaling**: Partitioning for large document sets

### Redis Integration

- **Purpose**: Caching and session storage
- **TTL**: Configurable time-to-live for cache entries
- **Persistence**: Optional persistence for recovery
- **Scaling**: Redis cluster support

### Google OAuth

- **Purpose**: Social authentication
- **Flow**: OAuth 2.0 authorization code flow
- **Security**: PKCE for SPAs
- **User Data**: Email, name, profile picture

---

## Deployment Architecture

### Docker Containerization

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose (Development)

```yaml
services:
  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./frontend
    ports: ["3001:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
  
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
```

### Production Deployment

- Kubernetes for orchestration (optional)
- Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- Managed Redis (AWS ElastiCache, GCP Memorystore)
- CDN for frontend (Cloudflare, AWS CloudFront)
- Load balancer (AWS ALB, GCP Load Balancer)

---

## Conclusion

SupportGPT's architecture is designed for production use with emphasis on:
- **Scalability**: Horizontal scaling via stateless design
- **Security**: Defense-in-depth with authentication, authorization, encryption
- **Reliability**: Error handling, retries, graceful degradation
- **Maintainability**: Clear separation of concerns, testable code
- **Performance**: Caching, indexing, async processing

The architecture supports both initial single-server deployment and future enterprise-scale multi-region deployments.

---

**Version**: 1.0
**Last Updated**: 2026-06-17
**Status**: Review Ready

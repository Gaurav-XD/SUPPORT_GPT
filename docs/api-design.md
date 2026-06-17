# SupportGPT API Design

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
6. [Rate Limiting](#rate-limiting)
7. [Versioning](#versioning)

---

## API Overview

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.supportgpt.com/api
```

### API Version
```
Current: v1
Format: /api/v1/{resource}
```

### Transport Protocol
- **HTTPS** (TLS 1.3+)
- **WebSocket** for real-time features
- **JSON** for all request/response bodies

### API Scope

The API covers:
- Authentication & Authorization
- User & Organization Management
- Knowledge Base Management
- AI Agent Management
- Conversational AI
- Ticket Management
- Analytics
- Audit Logging

Most business resources are organization-scoped under `/api/v1/organizations/{organizationId}/...` to preserve tenant isolation.

---

## Authentication & Authorization

### Authentication Methods

#### 1. JWT Authentication (Default)

```
Header: Authorization: Bearer <access_token>

Access Token:
- Format: HS256 JWT
- Payload: { sub: userId, org_id: orgId, role: role, iat: timestamp, exp: timestamp }
- Expiry: 15 minutes
- Storage: Memory (frontend)

Refresh Token:
- Format: HS256 JWT
- Payload: { sub: userId, type: 'refresh', iat: timestamp, exp: timestamp }
- Expiry: 7 days
- Storage: httpOnly secure cookie (frontend)
```

#### 2. API Key Authentication

For service-to-service communication:

```
Header: X-API-Key: <api_key>

API Key Format:
- Prefix: 'sk_test_' or 'sk_live_'
- Length: 32 characters
- Hashed in database with bcrypt
```

#### 3. OAuth 2.0 (Google)

```
Flow: Authorization Code Grant (PKCE)
Scopes: profile, email
Redirect: /auth/google/callback
```

### Authorization

#### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| **Admin** | Full access to organization, all resources |
| **Manager** | Create agents, manage team, view analytics |
| **Agent** | Handle conversations, create tickets, limited access |
| **Viewer** | Read-only access to conversations and analytics |

#### Resource-Level Authorization

```
POST /api/v1/organizations/{org_id}/agents
- Requires: org_id in token
- Requires: role in [admin, manager]
- Enforces: User is organization member
```

### Token Refresh Flow

```
Client Request with Expired Token
    ↓
API returns 401 Unauthorized
    ↓
Client sends POST /api/v1/auth/refresh with refresh token
    ↓
API validates refresh token
    ↓
API returns new access token
    ↓
Client retries original request with new token
```

---

## Request/Response Format

### Request Format

```http
POST /api/v1/resource HTTP/1.1
Host: api.supportgpt.com
Authorization: Bearer <access_token>
Content-Type: application/json
Content-Length: 256

{
  "field1": "value1",
  "field2": "value2"
}
```

### Response Format

#### Success Response (2xx)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "created_at": "2026-06-17T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-06-17T10:30:00Z",
    "version": "1.0"
  }
}
```

#### Success Response - List

```json
{
  "success": true,
  "data": [
    { "id": "uuid1", "name": "item1" },
    { "id": "uuid2", "name": "item2" }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "timestamp": "2026-06-17T10:30:00Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": [
      {
        "field": "email",
        "message": "Invalid format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-17T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Data Types

```typescript
UUID: string (format: "00000000-0000-0000-0000-000000000000")
Timestamp: string (ISO 8601, format: "2026-06-17T10:30:00Z")
Email: string (format: email)
URL: string (format: uri)
Decimal: number or string (for precise calculations)
JSONB: object or null
Vector: not returned in API (internal use only)
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|---|---|---|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Unique constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |
| 503 | Unavailable | Service down |

### Error Codes

```typescript
// Authentication
'INVALID_CREDENTIALS' - Email/password mismatch
'INVALID_TOKEN' - Malformed or expired token
'TOKEN_EXPIRED' - Token has expired
'INVALID_API_KEY' - Invalid API key

// Authorization
'INSUFFICIENT_PERMISSIONS' - User lacks required role
'RESOURCE_FORBIDDEN' - Cross-tenant access attempt
'ORG_NOT_FOUND' - Organization not found

// Validation
'VALIDATION_ERROR' - Input validation failed
'INVALID_EMAIL' - Email format invalid
'DUPLICATE_EMAIL' - Email already registered

// Resources
'NOT_FOUND' - Resource doesn't exist
'CONFLICT' - Resource already exists
'DELETED_RESOURCE' - Resource was deleted

// Rate Limiting
'RATE_LIMIT_EXCEEDED' - Too many requests
'QUOTA_EXCEEDED' - Usage quota exceeded

// External Services
'OPENAI_ERROR' - OpenAI API error
'EMBEDDING_FAILED' - Vector embedding failed
'SEARCH_FAILED' - Vector search failed
```

### Error Response Examples

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Too short (min 8 chars)" }
    ]
  }
}
```

#### Authorization Error
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You lack the required role: admin"
  }
}
```

---

## API Endpoints

### 1. Authentication Endpoints

#### Register User
```
POST /api/v1/auth/register
Authorization: None

Request:
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "first_name": "John",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### Login
```
POST /api/v1/auth/login
Authorization: None

Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 200
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 900
  }
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Authorization: Bearer <expired_token>

Request:
{
  "refresh_token": "eyJhbGc..."
}

Response: 200
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900
  }
}
```

#### Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>

Response: 204
```

#### Google OAuth Callback
```
POST /api/v1/auth/google/callback
Authorization: None

Request:
{
  "code": "auth_code_from_google",
  "state": "state_parameter"
}

Response: 200
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "...",
    "refresh_token": "...",
    "is_new_user": true
  }
}
```

#### Reset Password Request
```
POST /api/v1/auth/password-reset
Authorization: None

Request:
{
  "email": "user@example.com"
}

Response: 200
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password Confirm
```
POST /api/v1/auth/password-reset/confirm
Authorization: None

Request:
{
  "token": "reset_token",
  "new_password": "newpassword123"
}

Response: 200
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 2. Organization Endpoints

#### Create Organization
```
POST /api/v1/organizations
Authorization: Bearer <token>
Required Role: User

Request:
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "description": "Customer support platform"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "owner_id": "user_123",
    "subscription_tier": "free",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### Get Organization
```
GET /api/v1/organizations/{org_id}
Authorization: Bearer <token>
Required: Member of organization

Response: 200
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "...",
    "owner_id": "user_123",
    "subscription_tier": "pro",
    "member_count": 25,
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Organizations (User's)
```
GET /api/v1/organizations?page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [
    { "id": "org_1", "name": "Org 1", ... },
    { "id": "org_2", "name": "Org 2", ... }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 3 }
  }
}
```

#### Update Organization
```
PATCH /api/v1/organizations/{org_id}
Authorization: Bearer <token>
Required Role: admin

Request:
{
  "name": "Acme Corporation",
  "description": "Updated description"
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Delete Organization
```
DELETE /api/v1/organizations/{org_id}
Authorization: Bearer <token>
Required Role: admin

Response: 204
```

#### Invite Member
```
POST /api/v1/organizations/{org_id}/invites
Authorization: Bearer <token>
Required Role: admin, manager

Request:
{
  "email": "newmember@example.com",
  "role": "agent"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "invite_123",
    "email": "newmember@example.com",
    "role": "agent",
    "token": "invite_token_123",
    "expires_at": "2026-06-24T10:30:00Z"
  }
}
```

#### Accept Invitation
```
POST /api/v1/organizations/{org_id}/invites/{token}/accept
Authorization: Bearer <token>

Response: 201
{
  "success": true,
  "data": {
    "org_id": "org_123",
    "user_id": "user_123",
    "role": "agent",
    "joined_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Organization Members
```
GET /api/v1/organizations/{org_id}/members?page=1&limit=20
Authorization: Bearer <token>
Required: Member of organization

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "member_1",
      "user_id": "user_1",
      "email": "user1@example.com",
      "role": "admin",
      "status": "active",
      "joined_at": "2026-06-17T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### Remove Member
```
DELETE /api/v1/organizations/{org_id}/members/{user_id}
Authorization: Bearer <token>
Required Role: admin

Response: 204
```

### 3. Knowledge Base Endpoints

#### Create Knowledge Base
```
POST /api/v1/organizations/{org_id}/knowledge-bases
Authorization: Bearer <token>
Required Role: admin, manager

Request:
{
  "name": "Product Documentation",
  "description": "All product docs and guides"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "kb_123",
    "org_id": "org_123",
    "name": "Product Documentation",
    "description": "...",
    "status": "active",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Knowledge Bases
```
GET /api/v1/organizations/{org_id}/knowledge-bases?page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [ ... ],
  "meta": { "pagination": { ... } }
}
```

#### Upload Document
```
POST /api/v1/organizations/{org_id}/knowledge-bases/{kb_id}/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
Required Role: admin, manager

Request Body:
- file: File (PDF, DOCX, TXT - max 50MB)
- name: string (optional, defaults to filename)

Response: 201
{
  "success": true,
  "data": {
    "id": "doc_123",
    "kb_id": "kb_123",
    "name": "guide.pdf",
    "file_size": 2048576,
    "file_type": "application/pdf",
    "status": "processing",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Documents
```
GET /api/v1/organizations/{org_id}/knowledge-bases/{kb_id}/documents?page=1&limit=20&status=completed
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "doc_1",
      "name": "guide.pdf",
      "status": "completed",
      "total_chunks": 42,
      "file_size": 2048576,
      "created_at": "2026-06-17T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

#### Get Document Details
```
GET /api/v1/organizations/{org_id}/documents/{doc_id}
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "id": "doc_123",
    "name": "guide.pdf",
    "status": "completed",
    "total_chunks": 42,
    "parsed_at": "2026-06-17T10:31:00Z",
    "created_by": {
      "id": "user_123",
      "email": "user@example.com"
    },
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### Delete Document
```
DELETE /api/v1/organizations/{org_id}/documents/{doc_id}
Authorization: Bearer <token>
Required Role: admin, manager

Response: 204
```

### 4. AI Agent Endpoints

#### Create Agent
```
POST /api/v1/organizations/{org_id}/agents
Authorization: Bearer <token>
Required Role: admin, manager

Request:
{
  "name": "Customer Support Bot",
  "description": "Handles customer support inquiries",
  "system_prompt": "You are a helpful customer support assistant...",
  "kb_id": "kb_123",
  "model": "gpt-4-turbo",
  "temperature": 0.7,
  "max_tokens": 2000
}

Response: 201
{
  "success": true,
  "data": {
    "id": "agent_123",
    "org_id": "org_123",
    "name": "Customer Support Bot",
    "description": "...",
    "system_prompt": "...",
    "kb_id": "kb_123",
    "model": "gpt-4-turbo",
    "temperature": 0.7,
    "max_tokens": 2000,
    "status": "active",
    "created_by": "user_123",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Agents
```
GET /api/v1/organizations/{org_id}/agents?page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [ ... ],
  "meta": { "pagination": { ... } }
}
```

#### Get Agent
```
GET /api/v1/organizations/{org_id}/agents/{agent_id}
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Update Agent
```
PATCH /api/v1/organizations/{org_id}/agents/{agent_id}
Authorization: Bearer <token>
Required Role: admin, manager

Request:
{
  "name": "Updated Agent Name",
  "system_prompt": "Updated prompt",
  "temperature": 0.5
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Delete Agent
```
DELETE /api/v1/organizations/{org_id}/agents/{agent_id}
Authorization: Bearer <token>
Required Role: admin

Response: 204
```

#### Get Agent Analytics
```
GET /api/v1/organizations/{org_id}/agents/{agent_id}/analytics?date_from=2026-06-01&date_to=2026-06-17
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "agent_id": "agent_123",
    "total_conversations": 150,
    "avg_response_time": 2.5,
    "satisfaction_rate": 0.92,
    "daily_stats": [
      {
        "date": "2026-06-17",
        "conversations": 10,
        "avg_response_time": 2.3,
        "satisfaction_rate": 0.95
      }
    ]
  }
}
```

### 5. Chat Endpoints

#### Create Conversation
```
POST /api/v1/organizations/{org_id}/agents/{agent_id}/conversations
Authorization: Bearer <token>

Request:
{
  "title": "Getting started guide",
  "context": "User wants to set up account"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "conv_123",
    "agent_id": "agent_123",
    "user_id": "user_123",
    "org_id": "org_123",
    "title": "Getting started guide",
    "status": "active",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### Send Message (Streaming)
```
POST /api/v1/organizations/{org_id}/conversations/{conversation_id}/messages
Authorization: Bearer <token>
Accept: text/event-stream

Request:
{
  "content": "How do I reset my password?",
  "stream": true
}

Response: 200 (Server-Sent Events)
data: {"type": "message_start", "id": "msg_123", "created_at": "..."}
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text"}}
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "To reset"}}
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": " your password,"}}
...
data: {"type": "message_stop"}
```

#### Send Message (Non-Streaming)
```
POST /api/v1/organizations/{org_id}/conversations/{conversation_id}/messages
Authorization: Bearer <token>

Request:
{
  "content": "How do I reset my password?",
  "stream": false
}

Response: 201
{
  "success": true,
  "data": {
    "id": "msg_123",
    "conversation_id": "conv_123",
    "role": "assistant",
    "content": "To reset your password, please...",
    "citations": [
      {
        "document_id": "doc_123",
        "document_name": "guide.pdf",
        "chunk_id": "chunk_456",
        "quote": "password reset process...",
        "relevance_score": 0.95
      }
    ],
    "tokens_used": 150,
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### Get Conversation
```
GET /api/v1/organizations/{org_id}/conversations/{conversation_id}
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "id": "conv_123",
    "agent_id": "agent_123",
    "user_id": "user_123",
    "title": "...",
    "status": "active",
    "created_at": "2026-06-17T10:30:00Z",
    "messages": [
      { "role": "user", "content": "How do I reset my password?" },
      { "role": "assistant", "content": "To reset...", "citations": [...] }
    ]
  }
}
```

#### List Conversations
```
GET /api/v1/organizations/{org_id}/conversations?agent_id=agent_123&status=active&page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [ ... ],
  "meta": { "pagination": { ... } }
}
```

#### End Conversation
```
POST /api/v1/organizations/{org_id}/conversations/{conversation_id}/end
Authorization: Bearer <token>

Request:
{
  "satisfaction": 4,
  "feedback": "Very helpful, thanks!"
}

Response: 200
{
  "success": true,
  "data": {
    "id": "conv_123",
    "status": "completed",
    "satisfaction": 4,
    "feedback": "Very helpful, thanks!",
    "ended_at": "2026-06-17T10:35:00Z"
  }
}
```

### 6. Ticket Endpoints

#### Create Ticket
```
POST /api/v1/organizations/{org_id}/tickets
Authorization: Bearer <token>

Request:
{
  "conversation_id": "conv_123",
  "title": "Payment processing issue",
  "description": "Customer unable to process payment",
  "priority": "high"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "org_id": "org_123",
    "conversation_id": "conv_123",
    "title": "Payment processing issue",
    "description": "...",
    "status": "open",
    "priority": "high",
    "created_by": "user_123",
    "sla_expires_at": "2026-06-18T10:30:00Z",
    "created_at": "2026-06-17T10:30:00Z"
  }
}
```

#### List Tickets
```
GET /api/v1/organizations/{org_id}/tickets?status=open&priority=high&assigned_to=user_123&page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [ ... ],
  "meta": { "pagination": { ... } }
}
```

#### Get Ticket
```
GET /api/v1/organizations/{org_id}/tickets/{ticket_id}
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "title": "...",
    "status": "open",
    "priority": "high",
    "assigned_to": { "id": "user_123", "email": "..." },
    "created_by": { "id": "user_456", "email": "..." },
    "sla_expires_at": "2026-06-18T10:30:00Z",
    "comments": [
      {
        "id": "comment_1",
        "author": "user_123",
        "content": "Investigating...",
        "is_internal": false,
        "created_at": "2026-06-17T10:31:00Z"
      }
    ],
    "created_at": "2026-06-17T10:30:00Z",
    "updated_at": "2026-06-17T10:35:00Z"
  }
}
```

#### Update Ticket
```
PATCH /api/v1/organizations/{org_id}/tickets/{ticket_id}
Authorization: Bearer <token>

Request:
{
  "status": "in_progress",
  "assigned_to": "user_123",
  "priority": "medium"
}

Response: 200
{
  "success": true,
  "data": { ... }
}
```

#### Add Comment
```
POST /api/v1/organizations/{org_id}/tickets/{ticket_id}/comments
Authorization: Bearer <token>

Request:
{
  "content": "Found the issue and fixing now",
  "is_internal": false
}

Response: 201
{
  "success": true,
  "data": {
    "id": "comment_1",
    "author_id": "user_123",
    "content": "...",
    "is_internal": false,
    "created_at": "2026-06-17T10:31:00Z"
  }
}
```

### 7. Analytics Endpoints

#### Get Organization Analytics
```
GET /api/v1/organizations/{org_id}/analytics?date_from=2026-06-01&date_to=2026-06-17
Authorization: Bearer <token>
Required Role: admin, manager, viewer

Response: 200
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-06-01",
      "to": "2026-06-17"
    },
    "summary": {
      "total_conversations": 250,
      "total_messages": 1500,
      "avg_resolution_time": 15.5,
      "resolution_rate": 0.94,
      "satisfaction_rate": 0.88,
      "total_tickets": 50
    },
    "by_agent": [
      {
        "agent_id": "agent_1",
        "agent_name": "Support Bot",
        "conversations": 150,
        "avg_response_time": 2.3,
        "satisfaction_rate": 0.92
      }
    ],
    "daily_trends": [
      {
        "date": "2026-06-17",
        "conversations": 15,
        "avg_response_time": 2.4,
        "satisfaction_rate": 0.89
      }
    ]
  }
}
```

#### Get Dashboard Metrics
```
GET /api/v1/organizations/{org_id}/metrics
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "team": {
      "member_count": 12,
      "active_agents": 8,
      "avg_workload": 2.5
    },
    "support": {
      "open_tickets": 8,
      "overdue_sla": 1,
      "avg_resolution_time": 14.2
    },
    "ai": {
      "total_conversations": 1250,
      "avg_satisfaction": 0.88,
      "cost_this_month": 245.50
    },
    "knowledge_base": {
      "document_count": 42,
      "total_chunks": 2500,
      "last_update": "2026-06-17T09:00:00Z"
    }
  }
}
```

### 8. Audit Log Endpoints

#### Get Audit Logs
```
GET /api/v1/organizations/{org_id}/audit-logs?action=CREATE&resource_type=agent&page=1&limit=50
Authorization: Bearer <token>
Required Role: admin

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "user_id": "user_123",
      "action": "CREATE",
      "resource_type": "agent",
      "resource_id": "agent_456",
      "new_values": { "name": "Support Bot", "model": "gpt-4" },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-06-17T10:30:00Z"
    }
  ],
  "meta": { "pagination": { ... } }
}
```

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|---|---|---|
| Authentication | 5 | 15 minutes |
| General API | 100 | 15 minutes |
| Chat (streaming) | 20 | 1 hour |
| Document Upload | 10 | 1 hour |
| Analytics | 30 | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1623919800
```

### Rate Limit Exceeded

```json
HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retry_after": 45
  }
}
```

---

## Versioning

### API Versioning Strategy

- **Current Version**: v1
- **Version in URL**: `/api/v1/`
- **Backward Compatibility**: Maintained for 12 months after new version release
- **Deprecation Notice**: 3 months advance notice before removal

### Versioning Rules

1. **Major Version (v2, v3)**: Breaking changes to request/response format
2. **Minor Updates**: Non-breaking changes (new fields, new endpoints)
3. **Patch Updates**: Bug fixes, documentation updates

### Migration Path

```
v1 Deprecated (2027-06-17)
  ↓
v1 Sunset (2028-06-17)
  ↓
v1 Removed (2029-06-17)
```

---

## Conclusion

The SupportGPT API design emphasizes:
- **Security**: JWT authentication, RBAC, tenant isolation
- **Consistency**: Uniform response format, clear error handling
- **Scalability**: Pagination, rate limiting, versioning
- **Developer Experience**: Clear documentation, intuitive endpoints

This API specification provides a foundation for building a robust, enterprise-grade SaaS platform.

---

**Version**: 1.0
**Last Updated**: 2026-06-17
**Status**: Ready for Implementation

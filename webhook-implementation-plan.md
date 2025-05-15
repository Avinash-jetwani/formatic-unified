# Webhook Implementation Plan for Formatic

## Overview
This implementation plan outlines how to add webhook functionality to your existing form platform, allowing clients to receive form submission data directly in their own systems.

## System Analysis

### Current Architecture
- **Backend**: NestJS with PostgreSQL (via Prisma)
- **Frontend**: Next.js with React
- **Data Flow**: Form submissions are stored in PostgreSQL via Prisma
- **Existing Models**: User, Form, FormField, Submission

## Database Schema Additions

### 1. Webhook Configuration Model
```prisma
model Webhook {
  id                String              @id @default(cuid())
  formId            String
  form              Form                @relation(fields: [formId], references: [id], onDelete: Cascade)
  name              String
  url               String
  active            Boolean             @default(true)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  secretKey         String?             // For HMAC signature verification
  
  // Authentication
  authType          WebhookAuthType     @default(NONE)
  authValue         String?             // For token, apiKey, basicAuth
  
  // Configuration
  eventTypes        WebhookEventType[]  @default([SUBMISSION_CREATED])
  headers           Json?               // Custom headers as JSON object
  includeFields     String[]            @default([])  // Empty means all fields
  excludeFields     String[]            @default([])
  
  // Delivery settings
  retryCount        Int                 @default(3)
  retryInterval     Int                 @default(60)  // seconds
  
  // Filter conditions
  filterConditions  Json?               // Conditions when to trigger the webhook
  
  // Logs
  deliveryLogs      WebhookDelivery[]
}

model WebhookDelivery {
  id                String              @id @default(cuid())
  webhookId         String
  webhook           Webhook             @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  submissionId      String?
  submission        Submission?         @relation(fields: [submissionId], references: [id], onDelete: SetNull)
  
  // Delivery info
  eventType         WebhookEventType
  status            WebhookDeliveryStatus
  requestTimestamp  DateTime            @default(now())
  responseTimestamp DateTime?
  requestBody       Json
  responseBody      Json?
  statusCode        Int?
  errorMessage      String?
  attemptCount      Int                 @default(0)
  nextAttempt       DateTime?
}

enum WebhookAuthType {
  NONE
  BASIC
  BEARER
  API_KEY
}

enum WebhookEventType {
  SUBMISSION_CREATED
  SUBMISSION_UPDATED
  FORM_PUBLISHED
  FORM_UNPUBLISHED
}

enum WebhookDeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  SCHEDULED
}
```

## Backend Implementation

### Phase 1: Core Webhook Service

1. **Create Migration & Models**
   - **File**: `backend/prisma/migrations/{timestamp}_add_webhook_support.ts`
   - **Purpose**: Add Webhook and WebhookDelivery tables to database

2. **Webhook Module**
   - **File**: `backend/src/webhooks/webhooks.module.ts`
   - **Purpose**: Register controllers, services, and dependencies

3. **Webhook DTOs**
   - **Files**: 
     - `backend/src/webhooks/dto/create-webhook.dto.ts`
     - `backend/src/webhooks/dto/update-webhook.dto.ts`
   - **Purpose**: Define data transfer objects for webhook operations

4. **Webhook Service**
   - **File**: `backend/src/webhooks/webhooks.service.ts`
   - **Functions**:
     - `create(formId, createWebhookDto)`: Create new webhook
     - `findAll(formId, userId, userRole)`: Get all webhooks for a form
     - `findOne(id, userId, userRole)`: Get webhook by ID
     - `update(id, updateWebhookDto, userId, userRole)`: Update webhook
     - `remove(id, userId, userRole)`: Delete webhook
     - `testWebhook(id, userId, userRole)`: Send test payload

5. **Webhook Controller**
   - **File**: `backend/src/webhooks/webhooks.controller.ts`
   - **Endpoints**:
     - `POST /forms/:formId/webhooks`: Create webhook
     - `GET /forms/:formId/webhooks`: Get webhooks
     - `GET /forms/:formId/webhooks/:id`: Get webhook
     - `PATCH /forms/:formId/webhooks/:id`: Update webhook
     - `DELETE /forms/:formId/webhooks/:id`: Delete webhook
     - `POST /forms/:formId/webhooks/:id/test`: Test webhook

### Phase 2: Webhook Delivery System

1. **Webhook Delivery Service**
   - **File**: `backend/src/webhooks/webhook-delivery.service.ts`
   - **Functions**:
     - `queueDelivery(webhook, submission, eventType)`: Queue delivery
     - `processQueue()`: Process pending webhook deliveries
     - `retryFailedDeliveries()`: Retry failed deliveries
     - `sendWebhook(webhook, payload)`: Send HTTP request to endpoint

2. **Integration with SubmissionsService**
   - **File**: `backend/src/submissions/submissions.service.ts`
   - **Modifications**:
     - Update `create()` to trigger webhooks after submission
     - Update `update()` to trigger webhooks on status change

3. **Scheduled Task for Retries**
   - **File**: `backend/src/tasks/webhook-retry.task.ts`
   - **Purpose**: Periodically retry failed webhook deliveries

### Phase 3: Security & Monitoring

1. **Webhook Security**
   - **File**: `backend/src/webhooks/webhook-security.service.ts`
   - **Functions**:
     - `signPayload(payload, secretKey)`: Generate HMAC signature
     - `buildAuthHeaders(webhook)`: Build auth headers based on type

2. **Webhook Logs**
   - **File**: `backend/src/webhooks/webhook-logs.service.ts`
   - **Functions**:
     - `getDeliveryLogs(webhookId, filters)`: Get delivery logs
     - `cleanupOldLogs(olderThan)`: Remove old logs

## Frontend Implementation

### Phase 1: Webhook Configuration UI

1. **Webhook Management Page**
   - **File**: `frontend/src/app/(dashboard)/forms/[id]/webhooks/page.tsx`
   - **Components**:
     - Webhook list with status indicators
     - Create webhook button
     - Test webhook button

2. **Webhook Form Component**
   - **File**: `frontend/src/components/webhook/WebhookForm.tsx`
   - **Features**:
     - URL input with validation
     - Authentication options
     - Event type selection
     - Field selection (include/exclude)

3. **Webhook Service**
   - **File**: `frontend/src/services/webhook.ts`
   - **Functions**:
     - `getWebhooks(formId)`: Get all webhooks
     - `createWebhook(formId, data)`: Create webhook
     - `updateWebhook(formId, webhookId, data)`: Update webhook
     - `deleteWebhook(formId, webhookId)`: Delete webhook
     - `testWebhook(formId, webhookId)`: Test webhook

### Phase 2: Advanced Configuration UI

1. **Webhook Delivery Settings Component**
   - **File**: `frontend/src/components/webhook/WebhookDeliverySettings.tsx`
   - **Features**:
     - Retry configuration
     - Custom headers
     - Payload format options

2. **Webhook Filter Conditions**
   - **File**: `frontend/src/components/webhook/WebhookConditions.tsx`
   - **Features**:
     - Condition builder (similar to form field conditions)
     - Logic operators (AND/OR)

### Phase 3: Monitoring UI

1. **Webhook Logs Page**
   - **File**: `frontend/src/app/(dashboard)/forms/[id]/webhooks/[webhookId]/logs/page.tsx`
   - **Features**:
     - Delivery status tracking
     - Request/response details
     - Manual retry button

2. **Webhook Status Dashboard**
   - **File**: `frontend/src/components/webhook/WebhookDashboard.tsx`
   - **Features**:
     - Success/failure charts
     - Recent activity

## Implementation Steps

### Phase 1: Foundation (2-3 weeks)

1. **Database Schema Setup (Week 1)**
   - Create Prisma models for Webhook and WebhookDelivery
   - Create migration and apply to database
   - Generate Prisma client

2. **Core Backend Services (Week 1-2)**
   - Implement WebhooksService with basic CRUD
   - Implement WebhooksController with basic endpoints
   - Add permissions and validation

3. **Basic Frontend UI (Week 2-3)**
   - Create webhook management page structure
   - Implement webhook creation form
   - Connect to backend API

4. **Testing (Throughout)**
   - Unit tests for webhook service
   - Integration tests for webhook delivery
   - Manual testing of UI components

### Phase 2: Delivery System (2-3 weeks)

1. **Webhook Delivery Service (Week 1)**
   - Implement payload generation
   - Set up HTTP client with retry logic
   - Add delivery logging

2. **Integration with Form Submissions (Week 1-2)**
   - Modify submission process to trigger webhooks
   - Implement filter conditions evaluation

3. **Enhanced Frontend Features (Week 2-3)**
   - Add advanced configuration options
   - Implement field mapping interface
   - Add webhook testing UI

4. **Testing (Throughout)**
   - Test webhook delivery with various endpoints
   - Verify retry behavior
   - Test with different payload formats

### Phase 3: Advanced Features (2-3 weeks)

1. **Security Enhancements (Week 1)**
   - Implement HMAC signing
   - Add authentication options
   - Set up secure key storage

2. **Monitoring and Logs (Week 1-2)**
   - Build delivery logs UI
   - Implement log filtering and search
   - Add manual retry functionality

3. **Performance Optimization (Week 2-3)**
   - Move webhook processing to background jobs
   - Implement batching for high-volume webhooks
   - Add rate limiting protection

4. **Documentation & Polish (Week 3)**
   - Create user documentation
   - Add help tooltips to UI
   - Create example webhook receivers

## Usage Examples

### Example 1: Simple Webhook for New Submissions

```typescript
// Creating a webhook
const webhook = {
  name: "New Submissions to CRM",
  url: "https://mycrm.example.com/api/lead",
  eventTypes: ["SUBMISSION_CREATED"],
  authType: "BEARER",
  authValue: "api_token_12345",
  active: true
};

// Payload format the CRM will receive:
{
  "event": "SUBMISSION_CREATED",
  "form": {
    "id": "form_id123",
    "title": "Contact Form"
  },
  "submission": {
    "id": "sub_xyz789",
    "createdAt": "2023-05-15T14:22:31Z",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'm interested in your services"
    }
  },
  "timestamp": "2023-05-15T14:22:32Z",
  "signature": "sha256=a1b2c3d4e5..."
}
```

### Example 2: Conditional Webhook with Field Filtering

```typescript
// Creating a webhook with conditions
const webhook = {
  name: "High-priority Support Tickets",
  url: "https://support.example.com/api/tickets",
  eventTypes: ["SUBMISSION_CREATED"],
  includeFields: ["email", "subject", "priority", "description"],
  filterConditions: {
    logicOperator: "AND",
    rules: [
      { fieldId: "priority", operator: "equals", value: "high" }
    ]
  }
};

// Webhook will only trigger when a submission has priority=high
```

## Testing Strategy

1. **Unit Tests**
   - Test webhook service methods
   - Test signature generation and verification
   - Test condition evaluation logic

2. **Integration Tests**
   - Test webhook creation and management flow
   - Test delivery process end-to-end
   - Test retry mechanism

3. **User Testing**
   - Create test webhook endpoints
   - Verify payload format and delivery
   - Test with various authentication methods

## Security Considerations

1. **Authentication**
   - Support Basic Auth, Bearer Token, API Key
   - Store credentials securely (encrypted in database)
   - Avoid sending credentials in URLs

2. **Payload Signing**
   - Implement HMAC-SHA256 signatures
   - Include timestamp to prevent replay attacks
   - Document verification process for clients

3. **Data Protection**
   - Allow excluding sensitive fields
   - Sanitize data before sending
   - Add IP address restrictions option

## Success Metrics

1. **Performance**
   - Webhook delivery success rate (target: >99%)
   - Average delivery time (target: <2s)
   - Retry success rate (target: >90%)

2. **Adoption**
   - % of forms using webhooks
   - # of webhook configurations per form
   - Types of webhook targets used

3. **Reliability**
   - System stability during high-volume submissions
   - Error recovery effectiveness
   - Monitoring alerts response time

## Conclusion

This implementation plan provides a structured approach to adding webhook functionality to your form platform. The phased implementation allows for gradual deployment and testing, minimizing risk while providing incremental value to your users. 
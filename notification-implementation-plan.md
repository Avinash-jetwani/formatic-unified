# Notification System Implementation Roadmap

This document outlines the phased approach for implementing a complete notification system in the Formatic application.

## Phase 1: Database & Core Backend Services

### Session 1.1: Database Schema Setup
1. Create `Notification` model in Prisma schema
   - Add fields: id, userId, title, message, type, entityId, entityType, read, createdAt, readAt
   - Add relation to User model
2. Create `NotificationType` enum in schema
   - Include types: FORM_SUBMISSION, WEBHOOK_SUCCESS, WEBHOOK_FAILURE, FORM_PUBLISHED, etc.
3. Update User model with relation to notifications
4. Create Prisma migration for the new model
5. Apply the migration to the database
6. **Test checkpoint**: Verify in Prisma Studio that the tables were created correctly

**Schema Implementation Reference:**
```prisma
enum NotificationType {
  FORM_SUBMISSION
  WEBHOOK_SUCCESS
  WEBHOOK_FAILURE
  FORM_PUBLISHED
  USER_REGISTRATION
  SYSTEM_ALERT
}

model Notification {
  id           String           @id @default(cuid())
  userId       String
  title        String
  message      String
  type         NotificationType
  entityId     String?
  entityType   String?
  read         Boolean          @default(false)
  createdAt    DateTime         @default(now())
  readAt       DateTime?
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Update User model
model User {
  // existing fields...
  notifications Notification[]
}
```

### Session 1.2: Core Notification Service
1. Create `notification.service.ts` in backend
   - Implement methods for:
     - createNotification
     - getNotificationsByUser
     - markAsRead
     - markAllAsRead
     - deleteNotification
2. Add unit tests for NotificationService methods
3. Register service in the appropriate module
4. **Test checkpoint**: Run unit tests to verify service functionality

### Session 1.3: Notification Controller & API Endpoints
1. Create `notification.controller.ts` in backend
   - Add GET endpoint for retrieving user notifications
   - Add PATCH endpoint for marking notifications as read
   - Add DELETE endpoint for deleting notifications
2. Add authentication guards to secure endpoints
3. Add role-based authorization where needed
4. Register controller in the appropriate module
5. **Test checkpoint**: Use a tool like Postman to test API endpoints manually

## Phase 2: Form Submission Notifications

### Session 2.1: Form Submission Trigger Implementation
1. Update `forms.controller.ts` to trigger notifications on form submission
2. Create helper method to determine notification recipients
3. Create specific message formatting for submission notifications
4. Implement logic to create different notifications based on user role
5. **Test checkpoint**: Create a test form submission and verify notifications are created

### Session 2.2: Admin Notification Logic
1. Implement logic for notifying admins about important form submissions
2. Add configurable thresholds for "high volume" submissions
3. Add notification grouping logic to prevent notification spam
4. **Test checkpoint**: Submit multiple forms and verify admin notifications work as expected

### Session 2.3: Frontend Form Submission Notification Display
1. Update frontend to fetch and display form submission notifications
2. Add visual indicators for new submissions
3. Implement notification preview on dashboard
4. **Test checkpoint**: End-to-end test of submission flow and notification display

## Phase 3: Webhook Notifications

### Session 3.1: Webhook Success/Failure Triggers
1. Update `webhook-delivery.service.ts` to trigger notifications
2. Create different notification types for success and failure
3. Add relevant details to notification message
4. **Test checkpoint**: Trigger a webhook and verify notifications are created

### Session 3.2: Webhook Error Context
1. Enhance webhook error notifications with more context
2. Add failure counting logic (X consecutive failures)
3. Add webhook quota monitoring
4. **Test checkpoint**: Simulate webhook failures and verify notifications

### Session 3.3: Admin Webhook Notifications
1. Implement admin notifications for webhook approval requests
2. Add notifications for security concerns
3. **Test checkpoint**: Create webhooks requiring approval and test notification flow

## Phase 4: User Notification UI Components

### Session 4.1: Notification Bell & Counter
1. Update `Navbar.tsx` to include notification bell icon
2. Add unread count badge to bell icon
3. Implement basic dropdown for notification preview
4. **Test checkpoint**: Visual verification of notification bell and count

### Session 4.2: Notification Dropdown
1. Enhance notification dropdown with:
   - List of recent notifications
   - Read/unread styling
   - Timestamp formatting
   - "Mark all as read" button
   - "View all" link
2. Implement click handlers for notification actions
3. **Test checkpoint**: Test notification dropdown interactions

### Session 4.3: Notification Page
1. Create dedicated `/notifications` page
2. Implement notification filtering (by type, read status, date)
3. Add pagination for large notification lists
4. Add bulk actions (mark all as read, delete selected)
5. **Test checkpoint**: Test notification page functionality

## Phase 5: Real-time Notifications

### Session 5.1: WebSocket Setup
1. Install WebSocket packages (socket.io) in backend and frontend
2. Create WebSocket gateway in NestJS
3. Set up authentication for WebSocket connections
4. **Test checkpoint**: Verify WebSocket connection works

### Session 5.2: Real-time Notification Delivery
1. Enhance notification service to emit events on notification creation
2. Implement client-side WebSocket listener
3. Add notification state management on frontend
4. **Test checkpoint**: Test real-time notification delivery

### Session 5.3: Toast Notifications
1. Implement toast notification component
2. Add logic to show toasts for high-priority notifications
3. Add user preference for toast notifications
4. **Test checkpoint**: Test toast notifications appear correctly

## Phase 6: Form Management Notifications

### Session 6.1: Form Publication Triggers
1. Update form publication logic to create notifications
2. Add notifications for form status changes
3. **Test checkpoint**: Test form publication notification flow

### Session 6.2: Form Limit & Expiration Notifications
1. Implement notifications for forms approaching limits
2. Add notifications for form expiration warnings
3. **Test checkpoint**: Test limit and expiration notifications

## Phase 7: User Account Notifications

### Session 7.1: User Registration & Login Notifications
1. Add admin notifications for new user registrations
2. Implement notifications for suspicious login attempts
3. **Test checkpoint**: Test user registration notification flow

### Session 7.2: User Profile Updates
1. Add notifications for important profile changes
2. Implement password change notifications
3. **Test checkpoint**: Test profile update notifications

## Phase 8: Notification Preferences & Management

### Session 8.1: Notification Preferences UI
1. Create notification preferences page
2. Implement toggles for different notification types
3. Add email notification preferences
4. **Test checkpoint**: Test saving notification preferences

### Session 8.2: Notification Preference Backend
1. Create notification preferences model and service
2. Implement API endpoints for managing preferences
3. Update notification creation to respect preferences
4. **Test checkpoint**: Verify notifications respect user preferences

### Session 8.3: Notification Cleanup
1. Implement automatic deletion of old notifications
2. Add notification archiving functionality
3. **Test checkpoint**: Test cleanup and archiving works correctly

## Phase 9: Advanced Features & Polishing

### Session 9.1: Browser Notifications
1. Implement browser notification permission request
2. Add browser notification sending for critical alerts
3. **Test checkpoint**: Test browser notifications work

### Session 9.2: Mobile Responsiveness
1. Optimize notification UI for mobile devices
2. Test and fix any mobile-specific issues
3. **Test checkpoint**: Test mobile UI on different devices

### Session 9.3: Performance Optimization
1. Add caching for notification counts
2. Optimize notification queries
3. Implement lazy loading for notification lists
4. **Test checkpoint**: Verify performance improvements

## Phase 10: Integration & System Testing

### Session 10.1: Integration Testing
1. Create comprehensive integration tests
2. Test notification flow across the entire system
3. **Test checkpoint**: Verify all integration tests pass

### Session 10.2: Load Testing
1. Test notification system under load
2. Identify and fix performance bottlenecks
3. **Test checkpoint**: Verify system handles high notification volume

### Session 10.3: Final Cleanup
1. Code cleanup and documentation
2. Add any missing edge case handling
3. **Test checkpoint**: Final review and testing

## Testing Strategy

### Continuous Testing Approach
1. **After each session**:
   - Run specific tests related to the session's development
   - Manually verify the feature works as expected
   - Fix any issues before moving to the next session

2. **After each phase**:
   - Run comprehensive tests for the entire phase
   - Perform end-to-end testing of the feature
   - Get user feedback if possible

3. **Automated Testing**:
   - Run automated tests on each commit
   - Regular manual testing sessions
   - Monitor for any regressions 
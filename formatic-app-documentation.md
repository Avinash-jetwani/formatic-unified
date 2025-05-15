# Formatic Application Documentation

## Overview

Formatic is a comprehensive form management application that allows users to create, customize, and manage forms, collect submissions, and integrate with external systems through webhooks. The application is built with a modern tech stack, featuring a Next.js frontend and a NestJS backend.

## Tech Stack

### Frontend
- **Framework**: Next.js
- **UI Components**: Radix UI, Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **State Management**: React Query
- **Drag and Drop**: DND Kit

### Backend
- **Framework**: NestJS
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT, Passport
- **File Storage**: AWS S3
- **Email**: Nodemailer, Handlebars templates
- **Scheduling**: NestJS Schedule
- **Analytics**: Custom analytics engine
- **Webhooks**: Secure webhook delivery system
- **Real-time**: WebSocket support (Socket.io)

## Core Functionality

### 1. Authentication & User Management
- Login/Register functionality
- Password reset and recovery
- User profile management
- Role-based access control (SUPER_ADMIN, CLIENT, etc.)
- User status tracking (active, suspended)
- Last login tracking
- Suspicious login detection
- Extended user profile fields (company, phone, website)

### 2. Dashboard
- Overview of key metrics and statistics
- Submission analytics and trends
- Recent submissions display
- Charts and graphs showing form performance
- Filtering by different time periods (7d, 30d, 90d, custom)
- Client growth analytics
- Form quality metrics
- Form completion rates
- Submission funnel visualization
- Field type distribution analytics
- Conversion trend analysis
- Export of dashboard data

### 3. Forms Management

#### Forms Dashboard
- List of all forms with status indicators
- Filtering options for forms
- Create new form button
- Duplicate form functionality
- Form templates

#### Form Builder
- **Form Settings**:
  - Title and description
  - Custom slug
  - Published/unpublished status
  - Submission message
  - Success redirect URL
  - Categories and tags
  - Save as template option
  - Multi-page form toggle
  - Form expiration
  - Submission limits
  - GDPR compliance options (consent text, require consent)
  - Access restrictions:
    - Password protection
    - Email domain restriction
    - Allowed email addresses list
  - Email notifications settings
  - Notification recipient configuration

- **Field Types**:
  - Text (short text)
  - Long Text (paragraphs)
  - Email
  - Phone
  - Number
  - Date
  - Time
  - Date & Time
  - Checkbox (multiple selection)
  - Radio (single selection)
  - Dropdown
  - Rating
  - Scale
  - Slider
  - File Upload

- **Field Configuration Options**:
  - Label
  - Placeholder text
  - Required toggle
  - Minimum/maximum length
  - Options (for multiple choice fields)
  - Validation rules
  - Conditional logic based on other fields with support for:
    - Complex conditions using AND/OR logic
    - Various operators (equals, not equals, contains, greater than, etc.)
    - Field visibility rules
    - Field requirement rules

- **File Upload Configuration**:
  - Maximum file size limit
  - File type restrictions
  - Multiple file upload support
  - Image optimization settings
  - File security settings

- **Multi-page Support**:
  - Page assignment for fields
  - Page navigation in preview
  - Page titles and descriptions
  - Conditional page branching

- **Form Preview**:
  - Live preview of form
  - Mobile/desktop responsive view
  - Real-time validation testing

### 4. Submissions Management

#### Submissions Dashboard
- List of all submissions with filters
- Status filters (all, new, viewed, archived)
- Submissions by form breakdown
- Export functionality (CSV, PDF, JSON)
- Bulk operations (delete, status change)

#### Submission Details
- Complete submission data display
- File/image previews with gallery view
- Image zoom and pan functionality
- Submission status management
- Notes and comments section
- Tags for categorization
- Message/communication log

- **Analytics for each submission**:
  - Device information
  - Browser details
  - Location data (country, city)
  - IP address
  - Referrer URL
  - Submission date/time
  - Status change tracking
  - User journey tracking

### 5. Notification System

#### Email Notifications
- Form submission notifications
- Status change alerts
- Customizable notification templates
- Notification preferences
- Recipient management
- Email delivery tracking

#### In-App Notifications
- Real-time notification delivery
- Notification preferences
- Toast notifications for high-priority alerts
- Notification center with:
  - Read/unread status
  - Categorization by type
  - Action links
  - Bulk management options

#### Notification Types
- Form submission
- Webhook success/failure
- Form publication
- User registration
- System alerts
- Form limit warnings
- Form expiration alerts
- Security alerts

### 6. Webhook Integration

#### Webhook Management
- Create, edit, delete webhooks
- Enable/disable webhooks
- Admin approval workflow
- Webhook security settings
- Webhook locking to prevent unauthorized changes

#### Webhook Configuration
- Endpoint URL setting
- Event type selection:
  - Submission created
  - Submission updated
  - Form published
  - Form unpublished
- Field filtering (select which fields to include/exclude)
- Custom headers
- Authentication options:
  - None
  - Basic Auth
  - Bearer Token
  - API Key
- Payload format customization
- Retry configuration (count, interval)
- Filter conditions for selective triggering

#### Webhook Monitoring
- View webhook logs
- Test webhook functionality
- Retry failed webhooks
- Status tracking (pending, success, failed, scheduled)
- Error message display
- Response body inspection
- Performance metrics

#### Webhook Documentation
- Help guides
- Implementation examples
- Troubleshooting resources
- Security best practices
- Advanced configuration tutorials

### 7. File Management
- Support for file uploads in forms
- Image preview and gallery
- Secure file storage using AWS S3
- File download options
- Image optimization features:
  - Automatic resizing
  - Compression
  - Format conversion
- File type validation
- Size limitations
- Multiple upload support
- Progress tracking
- File security:
  - Access control
  - Expiring links
  - Private/public storage options

### 8. Analytics & Reporting

#### Form Analytics
- Submission rates over time
- Completion rates
- Drop-off analysis
- Average completion time
- Most abandoned fields
- Field response distribution
- Form performance comparison

#### User Analytics
- User growth trends
- Active users tracking
- User engagement metrics
- User retention analysis

#### System Analytics
- Webhook reliability metrics
- System performance tracking
- Storage utilization
- Error rate monitoring

#### Export Options
- CSV exports
- PDF reports
- JSON data dumps
- Scheduled reporting

### 9. Profile Management
- Update personal information
- Company details
- Contact information
- Security settings
- Password change
- API key management
- Notification preferences
- Language and timezone settings

## Pages and Navigation

### Public Pages
- Login
- Register
- Password Reset
- Public Form Display
- Embedded Form Options

### Dashboard Section
- Main Dashboard
- Forms List
- Form Builder
- Form Preview
- Form Settings
- Submissions List
- Submission Details
- Webhook Management
- Webhook Logs
- User Management
- Notification Center

### Admin Section
- System Settings
- User Management
- Client Management
- Global Templates
- Webhook Approval
- Analytics Dashboard
- System Health Monitoring

## Key Features by Page

### Dashboard Page
- Stats cards showing total forms, submissions, users
- Trend indicators comparing to previous periods
- Submission timeline chart
- Recent submissions table
- Form performance metrics
- Date range filtering
- Client growth charts
- Form quality metrics
- Top performing forms

### Forms Dashboard
- List of all forms with status indicators
- Quick action buttons (preview, edit, duplicate, delete)
- Form status toggling (published/unpublished)
- Sorting and filtering options
- Create new form button
- Form templates selection
- Form analytics snapshot
- Form expiration indicators

### Form Builder
- Drag and drop interface for field arrangement
- Field type selection
- Field property configuration panel
- Live preview of form
- Multi-page support
- Conditional logic builder
- Form settings panel
- Field validation rules
- Responsive design preview

### Submissions Page
- Table of all submissions
- Status filtering (new, viewed, archived)
- Export options
- Detailed view of individual submissions
- Analytics data for submissions
- Notes and tag management
- File and image viewing
- Bulk operations
- Search and filtering

### Webhook Management
- List of configured webhooks
- Status indicators
- Create/edit/delete webhook controls
- Test webhook functionality
- View logs for webhook execution
- Security settings
- Admin approval status
- Webhook documentation

### Notification Center
- List of all notifications
- Read/unread status
- Notification filtering
- Clear/mark as read options
- Notification preferences
- Real-time updates

### Profile Management
- Personal information
- Company details
- Security settings
- Password change
- Notification preferences
- API key management
- Account activity log

## Workflow Examples

### Creating a Form
1. Navigate to Forms page
2. Click "Create New Form" or use a template
3. Add form title and description
4. Add fields using the field selector
5. Configure field properties
6. Arrange fields using drag and drop
7. Set up conditional logic if needed
8. Configure form settings
9. Set up access restrictions if needed
10. Configure notifications
11. Preview the form
12. Publish the form when ready

### Managing Submissions
1. Navigate to Submissions page
2. Filter submissions by form or status
3. Click on a submission to view details
4. Add notes or tags to submissions
5. Change submission status
6. View submission analytics
7. Download attached files
8. Export submissions as needed
9. View analytics for submission insights

### Setting Up a Webhook
1. Navigate to a form's webhook page
2. Click "Add Webhook"
3. Configure webhook endpoint and settings
4. Select triggering events
5. Choose fields to include in payload
6. Set up authentication if needed
7. Configure retry settings
8. Set up filtering conditions
9. Submit for admin approval if required
10. Test the webhook
11. Enable the webhook when ready
12. Monitor webhook logs

### Configuring Form Notifications
1. Navigate to form settings
2. Enable email notifications
3. Add notification recipients
4. Configure notification type (all, specific)
5. Set up notification content
6. Test notification delivery
7. Save notification settings

### Setting Up File Uploads
1. Add a File Upload field to a form
2. Configure maximum file size
3. Set allowed file types
4. Configure multiple file settings
5. Set up image optimization options
6. Preview the file upload field
7. Test upload functionality

## Technical Implementation Details

The application uses a modern architecture with:
- Responsive UI built with Tailwind CSS
- Component-based structure with Radix UI primitives
- Server-side and client-side rendering with Next.js
- RESTful API endpoints with NestJS
- Database models and migrations with Prisma
- File storage with AWS S3
- Authentication with JWT tokens
- Email delivery through SMTP
- Real-time notifications via WebSockets
- Task scheduling for background processes
- Comprehensive analytics implementation
- Secure webhook delivery system with retry logic
- Image optimization using Sharp
- File security and access control

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Form access restrictions
- Webhook payload signing
- API rate limiting
- CSRF protection
- Secure file storage
- Input validation and sanitization
- XSS protection
- SQL injection prevention through Prisma ORM
- Activity logging and audit trails 
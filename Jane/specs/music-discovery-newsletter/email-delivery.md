---
title: Email Delivery Specification
description: Email delivery implementation using Gmail SMTP for newsletter distribution
tags:
  - email
  - smtp
  - gmail
  - delivery
createdAt: '2025-07-07T15:19:39.042Z'
updatedAt: '2025-07-07T15:19:39.042Z'
---
# Email Delivery Specification

## Delivery Method
Python's built-in `smtplib` with Gmail SMTP for MVP simplicity and reliability.

## Configuration

### SMTP Settings
- **Server**: smtp.gmail.com
- **Port**: 587 (TLS)
- **Authentication**: App-specific password (not regular Gmail password)
- **Security**: STARTTLS encryption

### Environment Variables
```bash
GMAIL_USERNAME=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

## Email Structure

### Headers
- **From**: Music Discovery System <your-email@gmail.com>
- **To**: quinncuatro@gmail.com (MVP test recipient)
- **Subject**: Generated from content (e.g., "New Haven Shows: July 7-13")
- **Content-Type**: text/html (for basic formatting)

### Body Format
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; }
        .event { margin-bottom: 20px; padding: 15px; border-left: 3px solid #007acc; }
        .artist { font-weight: bold; color: #007acc; }
        .venue-info { color: #666; font-size: 14px; }
        .bio { margin: 10px 0; }
        .links { margin-top: 10px; }
        .links a { margin-right: 15px; text-decoration: none; color: #007acc; }
    </style>
</head>
<body>
    <!-- Newsletter content with basic HTML formatting -->
</body>
</html>
```

## Technical Implementation

### Email Assembly
1. Convert newsletter markdown/text to HTML
2. Add basic CSS styling for readability
3. Ensure all links are properly formatted
4. Include unsubscribe placeholder for future use

### Delivery Process
```python
def send_newsletter(content: str, recipient: str) -> dict:
    # Create MIME message
    # Add headers and styling
    # Connect to Gmail SMTP
    # Authenticate and send
    # Return delivery status
```

### Error Handling
- **Authentication Errors**: Log error, suggest checking app password
- **Network Issues**: Retry with exponential backoff (max 3 attempts)
- **Rate Limiting**: Respect Gmail's sending limits
- **Invalid Recipients**: Log warning, continue with valid addresses
- **Content Issues**: Sanitize content, remove problematic characters

## Delivery Confirmation
```python
{
    "status": "success",  # success, failed, partial
    "sent_at": "2025-07-07T15:30:00Z",
    "recipient": "quinncuatro@gmail.com",
    "message_id": "smtp-generated-id",
    "errors": []  # Any non-fatal issues
}
```

## Future Considerations

### Scalability Prep
- Design recipient list structure for multiple users
- Implement basic rate limiting for bulk sends
- Add delivery tracking and bounce handling
- Consider migration path to dedicated email service (SendGrid, etc.)

### Compliance
- Include basic unsubscribe mechanism
- Add sender identification
- Implement basic email hygiene practices
- Prepare for CAN-SPAM compliance when scaling

## Testing and Monitoring

### Delivery Testing
- Send test emails during development
- Verify HTML rendering across email clients
- Test link functionality and formatting
- Monitor delivery rates and Gmail spam filtering

### Logging
- Log all delivery attempts with timestamps
- Track success/failure rates
- Monitor for authentication issues
- Alert on consecutive failures

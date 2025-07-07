---
title: System Architecture
description: >-
  Technical architecture and LangGraph node structure for the music discovery
  newsletter system
author: Claude
tags:
  - architecture
  - langgraph
  - nodes
  - workflow
createdAt: '2025-07-07T15:16:42.487Z'
updatedAt: '2025-07-07T15:16:42.487Z'
---
# System Architecture

## LangGraph Node Structure

The music discovery system is built as a multi-agent workflow using LangGraph, with each node handling a specific responsibility.

### Core Workflow Nodes

```
START → venue_discovery → event_scraper → event_enricher → content_generator → email_sender → END
                    ↓
               error_handler (conditional)
```

### Node Specifications

#### 1. venue_discovery
- **Purpose**: Initialize and validate venue list
- **Input**: Configuration with target venues
- **Output**: List of venue objects with metadata
- **Error Handling**: Skip invalid venues, log warnings

#### 2. event_scraper
- **Purpose**: Scrape events from venue calendars
- **Target**: College Street Music Hall (https://collegestreetmusichall.com/calendar/)
- **Method**: HTTP requests + HTML parsing
- **Date Range**: Next 30 days from execution
- **Output**: Raw event data (date, artist, venue, description)
- **Error Handling**: Retry failed requests, continue with partial data

#### 3. event_enricher
- **Purpose**: Enhance events with artist information
- **Data Sources**: Spotify Web API
- **Enrichment Data**:
  - Artist bio (condensed)
  - Genre classification
  - Recent releases/popular tracks
  - Social media links
  - Similar artists
- **Rate Limiting**: Respect Spotify API limits
- **Error Handling**: Continue without enrichment if API fails

#### 4. content_generator
- **Purpose**: Create newsletter content with local tone
- **LLM**: Claude for creative writing
- **Style**: Local New Haven insider voice
- **Content Structure**:
  - Engaging subject line
  - Brief intro with weekly highlights
  - Event descriptions with personality
  - Practical information (dates, tickets)
- **Output**: Formatted email content (HTML + text)

#### 5. email_sender
- **Purpose**: Deliver newsletter via email
- **Method**: Python smtplib with Gmail SMTP
- **Recipients**: Single test email (quinncuatro@gmail.com)
- **Format**: HTML email with text fallback
- **Error Handling**: Log delivery failures, retry once

### State Management

#### Global State Object
```python
class MusicNewsletterState(TypedDict):
    venues: List[VenueInfo]
    raw_events: List[RawEvent]
    enriched_events: List[EnrichedEvent]
    newsletter_content: NewsletterContent
    email_status: EmailDeliveryStatus
    errors: List[ErrorRecord]
    execution_timestamp: datetime
```

#### Data Persistence
- **Format**: JSON for inter-node communication
- **Storage**: In-memory during execution
- **Logging**: Structured logs for debugging and monitoring

### Error Handling Strategy

#### Error Types
1. **Network Errors**: Venue site down, API timeouts
2. **Parsing Errors**: Unexpected HTML structure changes
3. **API Errors**: Spotify rate limiting, authentication issues
4. **Content Generation Errors**: LLM API failures
5. **Email Delivery Errors**: SMTP failures, authentication

#### Recovery Mechanisms
- **Graceful Degradation**: Continue with partial data
- **Retry Logic**: Exponential backoff for transient failures
- **Fallback Content**: Default descriptions when enrichment fails
- **Error Reporting**: Detailed logs for debugging

### Conditional Logic

#### Error Handler Node
- **Trigger**: Any node reports non-fatal error
- **Actions**: 
  - Log error details
  - Attempt recovery if possible
  - Continue workflow with degraded data
  - Skip failed components

#### Content Quality Check
- **Trigger**: After content generation
- **Validation**: Check for minimum content requirements
- **Actions**: Regenerate if quality too low, proceed otherwise

## Scalability Considerations

### Multi-Venue Support
- **Architecture**: Node design supports multiple venues
- **Implementation**: Venue list passed through state
- **Scraping**: Parallel venue processing capability

### Scheduling System
- **Manual Execution**: Command-line interface
- **Scheduled Execution**: Built-in cron-like functionality
- **Configuration**: Flexible timing (daily, weekly, custom)

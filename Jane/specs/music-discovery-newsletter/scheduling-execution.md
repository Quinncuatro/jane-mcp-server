---
title: Scheduling and Execution Specification
description: >-
  Specification for running the music discovery system both manually and on
  automated schedules
tags:
  - scheduling
  - cron
  - cli
  - execution
  - automation
createdAt: '2025-07-07T15:20:02.803Z'
updatedAt: '2025-07-07T15:20:02.803Z'
---
# Scheduling and Execution Specification

## Execution Modes

### Manual Execution (Development)
```bash
python -m music_discovery --run-now
python -m music_discovery --dry-run  # Generate content without sending email
python -m music_discovery --venues college-street  # Single venue only
```

### Scheduled Execution (Production)
- **Primary Schedule**: Weekly on Sunday at 10:00 AM ET
- **Backup Schedule**: Manual trigger via command line
- **Emergency Override**: Ability to cancel scheduled runs

## Command Line Interface

### Primary Commands
```bash
# Run full pipeline immediately
music-discovery run

# Dry run (no email sent)
music-discovery run --dry-run

# Run specific components
music-discovery scrape --venue college-street
music-discovery enrich --input events.json
music-discovery generate --input enriched_events.json

# Schedule management
music-discovery schedule --enable
music-discovery schedule --disable
music-discovery schedule --status
```

### Configuration Options
```bash
# Date range override
music-discovery run --days 14  # Next 14 days instead of 30

# Output format
music-discovery run --format json  # Save results to JSON file
music-discovery run --output /path/to/file

# Debugging
music-discovery run --verbose
music-discovery run --debug
```

## Scheduling Implementation

### Cron Integration
```bash
# Weekly newsletter - Sundays at 10 AM
0 10 * * 0 /usr/local/bin/music-discovery run --production

# Monthly venue discovery - First of month
0 6 1 * * /usr/local/bin/music-discovery discover-venues
```

### Built-in Scheduler
```python
# Alternative to cron for development
music-discovery daemon --schedule weekly
```

### Scheduling Configuration
```yaml
# config/schedule.yaml
schedules:
  newsletter:
    enabled: true
    frequency: weekly
    day: sunday
    time: "10:00"
    timezone: "America/New_York"
  
  venue_discovery:
    enabled: false
    frequency: monthly
    day: 1
    time: "06:00"
```

## Execution Environment

### Dependencies Management
- Use `requirements.txt` for Python dependencies
- Pin all dependency versions for reproducible builds
- Include development dependencies separately

### Environment Configuration
```bash
# Required environment variables
export SPOTIFY_CLIENT_ID=your_client_id
export SPOTIFY_CLIENT_SECRET=your_client_secret
export GMAIL_USERNAME=your_email@gmail.com
export GMAIL_APP_PASSWORD=your_app_password

# Optional configuration
export LOG_LEVEL=INFO
export DATA_DIR=/path/to/data
export CONFIG_FILE=/path/to/config.yaml
```

### Data Persistence

#### Temporary Run Data
- Store in `/tmp/music_discovery/` during execution
- Clean up after successful completion
- Preserve on failure for debugging

#### Persistent Data
- **Cache**: `~/.music_discovery/cache/` (7-day TTL)
- **Logs**: `~/.music_discovery/logs/` (30-day retention)
- **Config**: `~/.music_discovery/config.yaml`

## Error Handling and Recovery

### Failure Scenarios
1. **Network Issues**: Retry with exponential backoff
2. **API Rate Limits**: Wait and retry within rate windows
3. **Parsing Errors**: Continue with partial data, log warnings
4. **Email Delivery Failure**: Store content for manual review

### Recovery Mechanisms
- **Checkpoint System**: Save progress between major steps
- **Resume Capability**: Continue from last successful checkpoint
- **Rollback**: Revert to previous state on critical failure

### Monitoring and Alerting
```python
# Health check endpoint for monitoring
music-discovery health

# Status information
music-discovery status --json
{
    "last_run": "2025-07-07T10:30:00Z",
    "status": "success",
    "events_processed": 12,
    "emails_sent": 1,
    "next_scheduled": "2025-07-14T10:00:00Z"
}
```

## Performance Considerations

### Execution Time Targets
- **Total Runtime**: < 5 minutes for typical week
- **Scraping**: < 1 minute per venue
- **API Enrichment**: < 2 minutes for 10 artists
- **Content Generation**: < 30 seconds
- **Email Delivery**: < 10 seconds

### Resource Management
- **Memory**: Keep under 256MB for typical runs
- **Disk**: Clean temporary files after completion
- **Network**: Respect API rate limits and be good citizen
- **CPU**: Use async/await for I/O bound operations

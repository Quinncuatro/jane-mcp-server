---
title: Technical Requirements Specification
description: >-
  Comprehensive technical requirements including tech stack, project structure,
  data models, and deployment specifications
tags:
  - python
  - langgraph
  - architecture
  - requirements
createdAt: '2025-07-07T15:22:44.570Z'
updatedAt: '2025-07-07T15:22:44.570Z'
---
# Technical Requirements Specification

## Technology Stack

### Core Framework
- **Python 3.11+**: Primary language for LangChain/LangGraph compatibility
- **LangGraph**: Workflow orchestration and state management
- **LangChain**: LLM integration and tool abstractions

### Key Dependencies
```python
# Core LangGraph/LangChain
langgraph>=0.3.0
langchain>=0.3.0
langchain-anthropic>=0.3.0  # For Claude integration

# Web scraping
requests>=2.31.0
beautifulsoup4>=4.12.0
lxml>=4.9.0

# API integration
spotipy>=2.23.0  # Spotify API wrapper

# Email delivery
email-validator>=2.0.0

# Data handling
pydantic>=2.0.0
python-dateutil>=2.8.0

# CLI and scheduling
click>=8.1.0
schedule>=1.2.0

# Configuration and logging
pyyaml>=6.0.0
python-dotenv>=1.0.0
structlog>=23.0.0
```

### Development Dependencies
```python
# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-mock>=3.11.0
responses>=0.23.0  # For mocking HTTP requests

# Code quality
black>=23.0.0
isort>=5.12.0
flake8>=6.0.0
mypy>=1.5.0

# Development utilities
pre-commit>=3.3.0
```

## Project Structure
```
music-discovery/
├── src/
│   └── music_discovery/
│       ├── __init__.py
│       ├── main.py                 # CLI entry point
│       ├── config/
│       │   ├── __init__.py
│       │   └── settings.py         # Configuration management
│       ├── nodes/
│       │   ├── __init__.py
│       │   ├── scraper.py          # Venue scraping node
│       │   ├── enricher.py         # Artist enrichment node
│       │   ├── generator.py        # Content generation node
│       │   └── emailer.py          # Email delivery node
│       ├── models/
│       │   ├── __init__.py
│       │   ├── state.py            # LangGraph state definitions
│       │   └── schemas.py          # Data models and validation
│       ├── services/
│       │   ├── __init__.py
│       │   ├── spotify.py          # Spotify API client
│       │   ├── venue_scrapers/     # Venue-specific scrapers
│       │   │   ├── __init__.py
│       │   │   └── college_street.py
│       │   └── email_service.py    # Email delivery service
│       └── utils/
│           ├── __init__.py
│           ├── logging.py          # Structured logging setup
│           ├── cache.py            # Simple file-based caching
│           └── helpers.py          # Common utilities
├── tests/
│   ├── __init__.py
│   ├── test_nodes/
│   ├── test_services/
│   └── fixtures/
├── config/
│   ├── config.yaml                 # Default configuration
│   └── schedule.yaml               # Scheduling configuration
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml                  # Project metadata and tool config
├── README.md
└── .env.example                    # Environment variables template
```

## Configuration Management

### Environment Variables
```bash
# Required
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GMAIL_USERNAME=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional
LOG_LEVEL=INFO
DATA_DIR=~/.music_discovery
CONFIG_FILE=config/config.yaml
CACHE_TTL_HOURS=168  # 7 days
```

### Configuration File Structure
```yaml
# config/config.yaml
venues:
  college_street:
    name: "College Street Music Hall"
    url: "https://collegestreetmusichall.com/calendar/"
    scraper: "college_street"
    enabled: true

content:
  newsletter:
    max_events: 10
    max_words: 500
    tone: "local_new_haven"
  
email:
  sender_name: "New Haven Music Discovery"
  test_recipient: "quinncuatro@gmail.com"
  
api_limits:
  spotify:
    requests_per_minute: 100
    retry_attempts: 3
  
cache:
    ttl_hours: 168  # 7 days
    max_size_mb: 100
```

## Data Models

### Core State Model
```python
from typing import TypedDict, List, Dict, Optional
from datetime import datetime

class MusicDiscoveryState(TypedDict):
    # Configuration
    config: Dict[str, Any]
    run_id: str
    started_at: datetime
    
    # Scraping results
    venues_to_scrape: List[str]
    raw_events: List[Dict[str, Any]]
    scraping_errors: List[str]
    
    # Enrichment results
    enriched_events: List[Dict[str, Any]]
    enrichment_errors: List[str]
    spotify_cache_hits: int
    
    # Content generation
    newsletter_content: str
    content_metadata: Dict[str, Any]
    
    # Email delivery
    email_status: str
    delivery_errors: List[str]
    
    # Overall status
    status: str  # running, completed, failed
    errors: List[str]
```

### Event Data Model
```python
from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List

class VenueEvent(BaseModel):
    venue: str
    date: datetime
    time: Optional[str]
    artist: str
    supporting_acts: List[str] = []
    price: Optional[str]
    age_restriction: Optional[str]
    ticket_url: Optional[HttpUrl]
    description: Optional[str]
    
class EnrichedEvent(VenueEvent):
    spotify_data: Optional[Dict[str, Any]]
    genres: List[str] = []
    bio_condensed: Optional[str]
    similar_artists: List[str] = []
    top_tracks: List[str] = []
    social_links: Dict[str, str] = {}
```

## Error Handling Strategy

### Error Categories
1. **Recoverable**: Network timeouts, rate limits, missing optional data
2. **Degraded**: Partial failures that don't stop the pipeline
3. **Fatal**: Configuration errors, authentication failures

### Logging Strategy
```python
import structlog

logger = structlog.get_logger()

# Standard log levels with structured data
logger.info("scraping_started", venue="college_street", date_range="30_days")
logger.warning("artist_not_found", artist="Unknown Band", venue="college_street")
logger.error("spotify_auth_failed", error_code="invalid_credentials")
```

### Retry Logic
- **Exponential Backoff**: 1s, 2s, 4s, 8s delays
- **Max Retries**: 3 attempts for most operations
- **Circuit Breaker**: Stop retrying after 5 consecutive failures
- **Jitter**: Add randomness to avoid thundering herd

## Performance Requirements

### Response Time Targets
- **End-to-end execution**: < 5 minutes
- **Individual API calls**: < 10 seconds
- **Scraping per venue**: < 60 seconds
- **Content generation**: < 30 seconds

### Resource Constraints
- **Memory usage**: < 256MB during normal operation
- **Disk space**: < 100MB for cache and logs
- **Network requests**: Respect all API rate limits
- **CPU usage**: Minimize computational overhead

## Security Considerations

### API Key Management
- Store all credentials in environment variables
- Use app-specific passwords for Gmail
- Rotate credentials quarterly
- Never commit secrets to version control

### Data Privacy
- No persistent storage of personal data
- Cache only public artist information
- Secure transmission of all email content
- Clear temporary data after each run

### Input Validation
- Sanitize all scraped HTML content
- Validate all URLs before processing
- Escape content in email templates
- Rate limit external API requests

## Testing Strategy

### Unit Tests
- Test each LangGraph node independently
- Mock all external API calls
- Validate data model schemas
- Test error handling scenarios

### Integration Tests
- Test full LangGraph workflow execution
- Verify email delivery with test accounts
- Test venue scraper with live data
- Validate Spotify API integration

### Test Data
- Static HTML fixtures for venue scraping
- Mock Spotify API responses
- Sample configuration files
- Example newsletter outputs

## Deployment Requirements

### Environment Setup
```bash
# Python environment
python -m venv music-discovery
source music-discovery/bin/activate
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with actual credentials

# Initial setup
music-discovery setup --create-config
```

### System Dependencies
- **Python 3.11+**: Runtime environment
- **cron**: For scheduled execution
- **git**: For version control
- **curl**: For health checks

### Monitoring
- Log rotation for long-running deployments
- Health check endpoint for monitoring systems
- Alerting on consecutive failures
- Performance metrics collection

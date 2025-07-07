---
title: Artist Data Enrichment Specification
description: >-
  Specification for enriching venue event data with artist information from
  Spotify and other sources
tags:
  - spotify
  - api
  - artist-data
  - enrichment
createdAt: '2025-07-07T15:18:52.289Z'
updatedAt: '2025-07-07T15:18:52.289Z'
---
# Artist Data Enrichment Specification

## Purpose
Enhance scraped venue data with rich artist information from Spotify API to provide context and discovery for newsletter readers.

## Data Sources

### Primary: Spotify Web API
- **Artist Basic Info**: Name, genres, follower count, popularity score
- **Artist Bio**: From Spotify artist data (condensed to 2-3 sentences)
- **Recent Releases**: Latest album/EP/single with release date
- **Social Links**: Official website, Instagram, Twitter, Facebook
- **Similar Artists**: Spotify's "related artists" (limit to top 3)
- **Top Tracks**: Most popular songs (limit to top 3)

## API Integration Requirements

### Authentication
- Use Spotify Client Credentials flow for app-only access
- Store credentials securely in environment variables
- Implement token refresh logic

### Rate Limiting
- Respect Spotify's rate limits (typically 100 requests per minute)
- Implement exponential backoff on 429 responses
- Cache results for 24 hours to avoid repeat API calls

### Search Strategy
1. **Primary Search**: Use exact artist name from venue data
2. **Fuzzy Matching**: If exact match fails, try variations:
   - Remove common suffixes ("& The...", "Band", etc.)
   - Handle special characters and spacing differences
3. **Confidence Scoring**: Rate match quality (exact = 1.0, fuzzy = 0.8, etc.)

## Data Processing

### Bio Condensation
- Take Spotify bio text and condense to 50-75 words
- Preserve key information: origin, genre, notable achievements
- Remove marketing language and excessive superlatives
- Maintain factual, informative tone

### Genre Standardization
- Map Spotify's micro-genres to broader categories
- Example: "indie pop", "dream pop", "bedroom pop" → "indie rock"
- Maintain original genres in metadata for future use

### Social Link Validation
- Verify social media links are active (basic HTTP check)
- Format links consistently (remove tracking parameters)
- Priority order: Instagram, Twitter, official website, Facebook

## Output Format
```python
{
    "artist": "Turnover",
    "spotify_id": "4tX5RRdVa5g2DpFpnFHQD4",
    "genres": ["indie rock", "dream pop"],
    "bio_condensed": "Virginia-based indie rock band formed in 2009, known for dreamy soundscapes and introspective lyrics. Evolved from pop-punk roots to shoegaze-influenced indie rock.",
    "followers": 285000,
    "popularity": 65,
    "recent_release": {
        "name": "Altogether",
        "type": "album",
        "release_date": "2024-08-30"
    },
    "social_links": {
        "instagram": "https://instagram.com/turnoverva",
        "twitter": "https://twitter.com/turnoverva",
        "website": "https://turnoverband.com"
    },
    "similar_artists": ["Title Fight", "Citizen", "Basement"],
    "top_tracks": ["Cutting My Fingers Off", "Dizzy on the Comedown", "Humming"]
}
```

## Error Handling
- **Artist Not Found**: Log warning, continue with basic venue data
- **API Quota Exceeded**: Implement graceful degradation, use cached data if available
- **Invalid Response**: Log error details, provide fallback empty enrichment
- **Network Issues**: Retry with exponential backoff, maximum 3 attempts

## Caching Strategy
- Store enriched data in JSON files by artist name
- Cache duration: 7 days for artist data, 1 day for recent releases
- Cache key: Normalized artist name (lowercase, no special chars)
- Implement cache invalidation for manual refresh

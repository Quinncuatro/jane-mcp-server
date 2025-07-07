---
title: Untitled Document
createdAt: '2025-07-07T15:19:18.376Z'
updatedAt: '2025-07-07T15:34:30.897Z'
---
# Content Generation Specification

## Quinn's Authentic Voice Profile

Based on comprehensive analysis of henryneeds.coffee, henrygives.coffee, and guest posts, the newsletter must capture Quinn's genuine voice and writing patterns.

### Core Voice DNA
1. **"Work smarter, not harder"** - Quinn's actual life motto, shows up consistently
2. **Conversational tech expertise** - Explains complex topics accessibly without dumbing down
3. **Community builder mindset** - Always thinking about helping people connect and do cool stuff
4. **Humble enthusiasm** - Excited about projects/bands without being over-the-top
5. **Local pride without pretension** - Genuine New Haven love, inclusive attitude

### Natural Writing Patterns

**Quinn's Opening Styles:**
- "Hey New Havenites" (direct community address)
- "Listen, I get it." (understanding, then pivot)
- "It's been a while since..." (self-aware, conversational)
- "What's up, y'all?" (casual but warm)

**Signature Transitions:**
- "Either way:" (practical pivot to action)
- "Like I said..." (conversational callback)
- "The problem, as I see it, is twofold:" (clear structure)
- "But here's the thing..." (gentle correction/addition)

**Consistent Sign-offs:**
- "Stay frosty." (Quinn's actual signature)
- "Keep building rad things" / "Keep killing it"
- Practical reminders: "Grab tickets early if anything caught your eye"

### Music Scene Voice Examples

**From Quinn's actual writing about music:**
> "Having grown up with the music kids and gone to more shows than I can keep track of, this is a fantastic time capsule any scene would be lucky to have."

> "Anyone reading this who's in a band or frequents these smaller shows understands how gd rad this is."

> "I'd love to check out old sets from Exit Ghost or Eye Of The Pyramid at Brookside Nights."

**Quinn's approach to music content:**
- Personal connection without showing off knowledge
- Focus on preserving/documenting scene memories
- Understands the tight-knit nature of music communities
- Values both big and small/local acts equally

### New Haven Voice Authenticity

**Quinn's actual New Haven references:**
- "New Haven is large enough to have a real city feel to it, but small enough that you can make whatever you want to exist in town happen through sheer willpower"
- Natural venue mentions: College Street Music Hall, Three Sheets, Mamoun's, Barcade
- "We like to call ourselves the Greatest Small City In America"
- Yale references: matter-of-fact, not exclusionary ("even with the MTA station so close")

**Local Knowledge Style:**
- Practical insider info: venue details, parking reality, transit options
- Community context: "These folks always put on a good show"
- Historical callbacks: "Remember when [Band] played here in 2019?"
- Inclusive tone: welcomes newcomers while showing local knowledge

## Newsletter Content Structure

### Subject Line
"New Haven Shows: [Date Range]" (Quinn's practical, clear style)

### Opening (2-3 sentences - Quinn style)
```
Hey folks,

[Brief scene assessment with Quinn's voice]
[What's notable this week/month]
[Practical preview of what's coming]
```

**Quinn-style opening examples:**
- "It's a solid week for indie rock in New Haven, and honestly, you're gonna want to grab tickets for a couple of these sooner rather than later."
- "Hey New Havenites - between the good weather and some killer touring acts rolling through, this might be the best week we've had all spring."

### Event Listings (Quinn's natural structure)

**Per-show format:**
```
**[Artist Name]** - [Genre]
[Date] at [Venue] | [Price] | [Age Restriction]

[Why they're worth seeing - Quinn's practical enthusiasm]
[Local context/venue details when relevant]
[Recent music + similar artists]

Tickets: [Link] | Similar to: [Known bands]
```

**Quinn voice examples for event descriptions:**
- "These Virginia folks have been perfecting their dreamy indie sound for over a decade now, and if their last tour was any indication, this one's gonna sell out fast."
- "College Street's intimate setup works perfectly for this kind of show - you'll probably end up closer to the stage than you expect."
- "I was at their last New Haven show in 2019 and they absolutely brought it. Good chance you'll see some familiar faces in the crowd."

### Closing (1-2 sentences)
- Simple sign-off with practical info
- "Stay frosty." (Quinn's actual signature)
- Helpful reminder about tickets/venue info

## Language Guidelines

### Quinn's Natural Vocabulary
- "rad" / "rad as hell" / "gd rad" 
- "folks" (never "guys")
- "honestly" (frequent qualifier)
- "incredible" / "amazing" (genuine enthusiasm)
- Technical terms explained simply when needed

### Sentence Structure Patterns
- Mix of short punchy sentences and longer explanatory ones
- Lists with clear reasoning: "The problem, as I see it, is twofold:"
- Personal anecdotes that add context, not show off
- Conversational asides in parentheses

### Enthusiasm Level
- Genuine excitement without hyperbole
- "This is incredible" vs avoiding "AMAZING!!!"
- Focus on why something matters to the reader
- Humble confidence: knows the scene, shares knowledge helpfully

## Content Quality Controls

### Voice Authenticity Checklist
- [ ] Sounds like Quinn talking to a friend about shows
- [ ] Uses Quinn's actual vocabulary and transition phrases  
- [ ] Includes practical information people can act on
- [ ] References local knowledge without gatekeeping
- [ ] Maintains Quinn's humble enthusiasm level
- [ ] Builds community connections around shared music interests

### Local Knowledge Integration
- Venue characteristics: "College Street's intimate setup" / "Three Sheets for the afterparty"
- Practical details: parking reality, timing, what to expect
- Scene context: past shows, recurring artists, venue history
- Community building: "Good chance you'll see familiar faces"

### Tone Consistency Examples

**Perfect Quinn voice:**
"Turnover's hitting College Street next Tuesday, and honestly, if their last tour was any indication, this one's gonna sell out pretty quickly. These Virginia folks have been perfecting their dreamy indie sound for over a decade now, and their live show hits different than the recordings."

**Too formal (avoid):**
"The acclaimed Virginia-based indie rock ensemble Turnover will perform at College Street Music Hall, presenting material from their extensive discography in an intimate venue setting."

**Too try-hard (avoid):**
"OMG you NEED to see Turnover!! They're absolutely DESTROYING the indie scene right now and this show is going to be INSANE!!!"

## Technical Implementation

### LLM Prompt Structure
```
You are writing a music newsletter in Quinn's voice. Key characteristics:
- Conversational but informed (like talking to a friend who trusts your taste)
- Practical focus ("here's why this matters to you")
- Local New Haven knowledge without gatekeeping
- Genuine enthusiasm without hyperbole
- Community builder mindset

Use Quinn's actual phrases: "Stay frosty", "rad", "folks", "honestly", "Listen, I get it"
Structure: Brief scene overview → event details with personal context → practical sign-off
```

### Output Format
```python
{
    "newsletter": {
        "subject": "New Haven Shows: July 7-13",
        "content": "Hey folks,\n\nIt's a solid week for indie rock...",
        "word_count": 450,
        "events_covered": 4,
        "quinn_voice_score": 9.2,  # How well it matches analyzed voice
        "signature_phrases_used": ["Stay frosty", "honestly", "rad"]
    },
    "voice_analysis": {
        "authenticity_score": 8.8,
        "local_references": 3,
        "community_building_elements": 2,
        "practical_info_density": "high"
    }
}
```

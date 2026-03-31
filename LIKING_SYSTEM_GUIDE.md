# Liking System - Real-World Implementation Guide

## Overview

The NUST Social liking system has been upgraded with enterprise-grade features matching real-world platforms like Instagram, Twitter, and Facebook.

## Key Features Implemented

### 1. **Reaction Weight (Reputation-Based Power)**

Each user's "like" has a weight multiplier (1.0 = normal, max 3.0) based on their reputation:

```
Power = 1.0 (base)
  + Account age bonus (max +1.0)
    - 0.1 per month of account age
  + Followers bonus (max +0.5)
    - 0.01 per 50 followers
  + Posts bonus (max +0.5)
    - 0.02 per 10 posts created
= Final weight (capped at 3.0)
```

**Example:**
- New user: 1.0 weight
- 6-month old user, 100 followers, 20 posts: ~2.0 weight
- 2-year old user, 500 followers, 100 posts: 3.0 weight (max)

### 2. **Rate Limiting & Cooldown**

Prevents spam and bot-like behavior:
- **First reaction**: No cooldown required
- **Changing reaction**: 2-minute cooldown between changes
- **Error message**: Clear countdown timer showing seconds to wait

```json
{
  "message": "Please wait 47 seconds before changing your reaction",
  "error": true
}
```

### 3. **Reaction History & Audit Trail**

Every reaction change is recorded with full context:

| Column | Purpose |
|--------|---------|
| `reaction_id` | Link to reaction |
| `old_reaction` | Previous emoji (NULL if first) |
| `new_reaction` | New emoji (NULL if deleted) |
| `old_weight` | Previous weight (NULL if first) |
| `new_weight` | Current weight (NULL if deleted) |
| `reason` | "first_reaction", "user_changed", "user_deleted" |
| `changed_at` | Timestamp of change |

**Use Cases:**
- Fraud detection (unusual patterns)
- Analytics (when do users engage)
- Reversions (restore previous reactions)
- Compliance (GDPR deletion records)

### 4. **Weighted Like Aggregation**

Two metrics per post:

```
Raw Count: Total number of users who liked
  - 50 users liked = 50

Weighted Count: Sum of all reaction_weight values
  - 50 users with avg weight 1.5 = 75 weighted likes
  - Shows TRUE engagement quality
```

**API Response:**
```json
{
  "likes_count": 50,
  "likes_count_weighted": 75.0,
  "user_reaction_weight": 1.5
}
```

## Database Schema

### reactions table (Enhanced)

```sql
CREATE TABLE reactions (
  id BIGINT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  type ENUM('LIKE','LOVE','HAHA','WOW','SAD','ANGRY'),
  reaction_weight FLOAT DEFAULT 1.0,  -- User's reputation weight
  last_changed_at DATETIME,            -- Track cooldown period
  created_at DATETIME,
  UNIQUE KEY (post_id, user_id),       -- One reaction per user per post
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### reaction_history table (New)

```sql
CREATE TABLE reaction_history (
  id BIGINT PRIMARY KEY,
  reaction_id BIGINT,                 -- Point to reactions
  post_id BIGINT,
  user_id BIGINT,
  old_reaction ENUM(...) NULL,        -- NULL for first reaction
  new_reaction ENUM(...) NULL,        -- NULL for deletion
  old_weight FLOAT NULL,
  new_weight FLOAT NULL,
  changed_at DATETIME,
  reason VARCHAR(255),                -- Migration, user action, etc
  FOREIGN KEY (reaction_id) REFERENCES reactions(id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### post_stats table (Enhanced)

```sql
ALTER TABLE post_stats ADD COLUMN likes_count_weighted FLOAT DEFAULT 0.0;
```

## API Endpoints

### React to Post

```http
POST /api/v1/posts/{post_id}/react
Authorization: Bearer {token}

Body:
{
  "type": "LIKE"  // or LOVE, HAHA, WOW, SAD, ANGRY
}

Response (201):
{
  "message": "Reacted with LIKE",
  "reaction_type": "LIKE",
  "post_id": 123,
  "reaction_weight": 1.5,
  "changed": false  // true if changed existing reaction
}

Response (400 - Rate Limited):
{
  "detail": "Please wait 47 seconds before changing your reaction"
}
```

### Remove Reaction

```http
DELETE /api/v1/posts/{post_id}/react
Authorization: Bearer {token}

Response (200):
{
  "message": "Reaction removed successfully",
  "post_id": 123
}
```

### Get Post (with reaction data)

```http
GET /api/v1/posts/{post_id}
Authorization: Bearer {token}

Response:
{
  "id": 123,
  "user_id": 1,
  "type": "SIMPLE_POST",
  "caption": "Just posted!",
  "stats": {
    "likes_count": 50,
    "likes_count_weighted": 75.0,  // Quality metric
    "comments_count": 12,
    "views_count": 500
  },
  "user_reaction": "LIKE",           // Current user's reaction
  "user_reaction_weight": 1.5        // Their reaction power
}
```

## Client-Side Implementation

### Handling Rate Limiting

```javascript
const handleLike = async (postId) => {
  try {
    const response = await fetch(`/api/v1/posts/${postId}/react`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'LIKE' })
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Parse wait time from message
      const match = error.detail.match(/wait (\d+) seconds/);
      if (match) {
        const waitSeconds = parseInt(match[1]);
        // Show countdown timer
        showCooldownTimer(waitSeconds);
      }
      return;
    }

    const data = await response.json();
    updateUI(data.reaction_weight, data.changed);
    
  } catch (error) {
    console.error('Failed to react:', error);
  }
};
```

### Displaying Weighted Engagement

```javascript
// Show both raw and weighted counts
<div className="engagement-metrics">
  <div>
    <span className="count">{post.stats.likes_count}</span>
    <span className="label">Reactions</span>
  </div>
  {post.stats.likes_count_weighted !== post.stats.likes_count && (
    <div>
      <span className="count">{post.stats.likes_count_weighted.toFixed(1)}</span>
      <span className="label">Engagement Score</span>
      <span className="badge">Quality</span>
    </div>
  )}
</div>
```

## Configuration & Tuning

### Adjust Cooldown Period

Edit `react_to_post()` in [backend/services/post_service.py](backend/services/post_service.py#L442):

```python
min_cooldown = timedelta(minutes=2)  # Change from 2 to your desired minutes
```

### Modify Reaction Weight Calculation

Edit `_calculate_voting_power()` in [backend/services/post_service.py](backend/services/post_service.py#L762):

```python
# Account age bonus (max +1.0)
age_bonus = min(account_age_months * 0.1, 1.0)

# Followers bonus (max +0.5)
followers_bonus = min((followers_count or 0) / 50 * 0.01, 0.5)

# Posts bonus (max +0.5)
posts_bonus = min(post_count / 10 * 0.02, 0.5)

# Overall cap
return min(power, 3.0)  # Change max from 3.0 to your desired value
```

## Migration Details

Run once to enable the system:

```bash
python migrate_liking_system.py
```

**Changes made:**
- ✅ Added `reaction_weight` FLOAT column to `reactions`
- ✅ Added `last_changed_at` DATETIME column to `reactions`
- ✅ Created `reaction_history` audit table
- ✅ Added `likes_count_weighted` FLOAT column to `post_stats`
- ✅ Initialized history for existing reactions
- ✅ Recalculated weighted engagement metrics

## Analytics & Monitoring

### Query Suspicious Activity

```sql
-- Users changing reactions frequently
SELECT user_id, post_id, COUNT(*) as changes, 
       MAX(changed_at) as last_change
FROM reaction_history
WHERE reason = 'user_changed'
  AND changed_at > NOW() - INTERVAL 1 HOUR
GROUP BY user_id, post_id
HAVING changes > 3
ORDER BY changes DESC;

-- Reactions by weight distribution
SELECT 
  CASE 
    WHEN new_weight < 1.5 THEN 'low'
    WHEN new_weight < 2.0 THEN 'medium'
    ELSE 'high'
  END as influence_level,
  COUNT(*) as reaction_count,
  AVG(new_weight) as avg_weight
FROM reaction_history
WHERE reason = 'first_reaction' OR reason = 'user_changed'
GROUP BY influence_level;
```

## Best Practices

### For Users

1. **Earn Influence**
   - Create quality posts (boost your weight)
   - Build a follower base (earn respect)
   - Keep account active (time matters)

2. **Engage Meaningfully**
   - Your reactions count more as you build trust
   - Frequent changes trigger cooldowns
   - Quality is valued over quantity

### For Developers

1. **Performance**
   - Index `reaction_id`, `post_id`, `user_id` in history table
   - Aggregate weighted counts asynchronously
   - Cache frequently queried stats

2. **Compliance**
   - Keep history for regulatory audits
   - Clean up deleted user reactions
   - Export data on GDPR requests

3. **Fraud Prevention**
   - Monitor unusual weight distributions
   - Alert on bot-like patterns (many reactions in short time)
   - Cross-check with voting behavior

## FAQ

**Q: Why were my past likes given 1.0 weight?**
A: Historical reactions use the default weight. As you continue engaging, your new reactions will use your current calculated weight.

**Q: Can I see my reaction weight?**
A: Yes, it's returned in the API response when you react to a post. Compare it to 1.0 to see your influence multiplier.

**Q: What happens to my weight if I'm inactive?**
A: Weight recalculates based on current metrics (followers, posts, account age), not activity. Activity doesn't directly factor in.

**Q: How do weighted likes affect post rankings?**
A: Weighted likes provide better signal for the feed algorithm. Posts with high-quality engagement from influential users rank better.

**Q: Can I bypass the 2-minute cooldown?**
A: No, it's enforced server-side. The cooldown prevents spam and ensures thoughtful engagement.

## Support

- **Issues**: Check [VOTING_SYSTEM_GUIDE.md](VOTING_SYSTEM_GUIDE.md) for similar patterns
- **Troubleshooting**: Review reaction_history audit trail for unexpected changes
- **Optimization**: Monitor likes_count_weighted metrics in post_stats

---

**System Version**: 1.0  
**Last Updated**: March 2026  
**Compatibility**: Python 3.7+, SQLAlchemy 1.4+, FastAPI 0.9+

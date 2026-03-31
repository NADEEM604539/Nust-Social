"""
DIAGNOSTIC TEST - Comprehensive Vote & Like System Audit
"""

import requests
import json
from sqlalchemy import func
from database import SessionLocal
from models.users import User
from models.posts import Post, PostStats, RumorVote, Reaction, PostType
from utils.security import JWTManager

BASE_URL = "http://localhost:8000/api/v1"
db = SessionLocal()

print("\n" + "="*80)
print("COMPREHENSIVE DIAGNOSTICS")
print("="*80)

# ============================================================================
# 1. DATABASE STATE
# ============================================================================
print("\n[1] DATABASE STATE")
print("-" * 80)

users = db.query(User).all()
print(f"\nUsers: {len(users)}")
for user in users:
    print(f"  ID {user.id}: {user.username}")

rumor_posts = db.query(Post).filter(Post.type == PostType.RUMOR).all()
print(f"\nRumor Posts: {len(rumor_posts)}")

print("\nVotes by User:")
for user in users:
    vote_count = db.query(RumorVote).filter(RumorVote.user_id == user.id).count()
    print(f"  User {user.id} ({user.username:15s}): {vote_count} votes")

print("\nTotal Reactions by User:")
for user in users:
    reaction_count = db.query(Reaction).filter(Reaction.user_id == user.id).count()
    print(f"  User {user.id} ({user.username:15s}): {reaction_count} reactions")

# ============================================================================
# 2. TOKEN & AUTH TEST
# ============================================================================
print("\n[2] TOKEN GENERATION & AUTH")
print("-" * 80)

tokens = {}
for user in users[:3]:
    try:
        token, expires_in = JWTManager.create_access_token(user.id)
        decoded = JWTManager.decode_token(token)
        tokens[user.id] = token
        is_valid = decoded and decoded.get('user_id') == user.id
        status = "PASS" if is_valid else "FAIL"
        print(f"{status}: User {user.id} ({user.username}) - Token valid: {is_valid}")
    except Exception as e:
        print(f"FAIL: User {user.id} ({user.username}) - ERROR: {str(e)}")

# ============================================================================
# 3. API TEST - Check if backend is running
# ============================================================================
print("\n[3] BACKEND API CONNECTIVITY")
print("-" * 80)

try:
    # Test with first user
    test_user = users[0]
    headers = {
        "Authorization": f"Bearer {tokens.get(test_user.id, '')}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/posts?limit=3&offset=0", headers=headers, timeout=5)
    print(f"GET /posts - Status: {response.status_code}")
    if response.status_code == 200:
        print("SUCCESS: Backend is responding correctly")
        data = response.json()
        print(f"  Retrieved {len(data.get('data', []))} posts")
    else:
        print(f"ERROR: {response.text}")
except Exception as e:
    print(f"ERROR: Backend not responding - {str(e)}")

# ============================================================================
# 4. VOTE API TEST - Different Users
# ============================================================================
print("\n[4] VOTING API TEST - All Users")
print("-" * 80)

if rumor_posts:
    test_post = rumor_posts[0]
    print(f"\nTesting with Post ID {test_post.id}")
    
    for test_user in users[:3]:
        if test_user.id not in tokens:
            print(f"SKIP: User {test_user.id} - No token")
            continue
            
        headers = {
            "Authorization": f"Bearer {tokens[test_user.id]}",
            "Content-Type": "application/json"
        }
        
        # Check existing vote
        existing = db.query(RumorVote).filter(
            RumorVote.post_id == test_post.id,
            RumorVote.user_id == test_user.id
        ).first()
        
        if existing:
            action = f"CHANGE (was {existing.vote})"
            new_vote = not existing.vote
        else:
            action = "NEW"
            new_vote = True
        
        print(f"\nUser {test_user.id} ({test_user.username}): Vote = TRUE ({action})")
        
        try:
            response = requests.post(
                f"{BASE_URL}/posts/{test_post.id}/rumor-vote",
                headers=headers,
                json={"vote": new_vote},
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"  PASS: Status 200")
                print(f"  Response: {json.dumps(response.json(), indent=2)[:200]}...")
            else:
                print(f"  FAIL: Status {response.status_code}")
                print(f"  Response: {response.text[:200]}...")
        except Exception as e:
            print(f"  ERROR: {str(e)}")

# ============================================================================
# 5. REACTION API TEST
# ============================================================================
print("\n[5] REACTION API TEST")
print("-" * 80)

regular_posts = db.query(Post).filter(Post.type == PostType.SIMPLE_POST).first()

if regular_posts:
    print(f"\nTesting with Post ID {regular_posts.id}")
    
    for test_user in users[:2]:
        if test_user.id not in tokens:
            continue
            
        headers = {
            "Authorization": f"Bearer {tokens[test_user.id]}",
            "Content-Type": "application/json"
        }
        
        print(f"\nUser {test_user.id} ({test_user.username}): Like Post")
        
        try:
            response = requests.post(
                f"{BASE_URL}/posts/{regular_posts.id}/react",
                headers=headers,
                json={"emoji": "LIKE"},
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"  PASS: Status 200")
            else:
                print(f"  FAIL: Status {response.status_code}")
                print(f"  Response: {response.text[:200]}...")
        except Exception as e:
            print(f"  ERROR: {str(e)}")

# ============================================================================
# 6. SUMMARY
# ============================================================================
print("\n[6] SUMMARY")
print("-" * 80)

total_votes = db.query(RumorVote).count()
users_with_votes = db.query(func.count(func.distinct(RumorVote.user_id))).scalar()
total_reactions = db.query(Reaction).count()
users_with_reactions = db.query(func.count(func.distinct(Reaction.user_id))).scalar()

print(f"\nVoting System:")
print(f"  Total Votes: {total_votes}")
print(f"  Users with Votes: {users_with_votes}/{len(users)}")
if users_with_votes < len(users):
    print(f"  WARNING: {len(users) - users_with_votes} users have not voted!")

print(f"\nReacting System:")
print(f"  Total Reactions: {total_reactions}")
print(f"  Users with Reactions: {users_with_reactions}/{len(users)}")

print("\n" + "="*80)

db.close()

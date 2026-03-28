# NUST Social - NUST Life Hub Backend

## Project Overview

**NUST Life Hub** (NUST Social) is a comprehensive social, marketplace, and event management platform designed specifically for NUST (National University of Science & Technology) students.

### Key Features

✅ **Social Feed** - Post confessions, rumors, announcements with optional anonymity
✅ **Societies** - Create and manage university societies
✅ **Events** - Society event management with ticket sales
✅ **Marketplace** - Buy and sell products within the platform
✅ **Real-time Chat** - Direct and group messaging
✅ **Notifications** - Stay updated with activity notifications
✅ **Moderation** - Report and content management system
✅ **User Following** - Follow other students and view their content

---

## Project Structure

```
backend/
│
├── main.py                    # Main application entry point
├── config.py                  # Configuration and environment variables
├── database.py                # Database connection and ORM setup
├── database.txt               # Database schema documentation
├── idea.txt                   # Project idea and features documentation
│
├── models/                    # SQLAlchemy ORM Models
│   ├── __init__.py
│   ├── media.py              # Media files (images, videos, documents)
│   ├── users.py              # User accounts and profiles
│   ├── posts.py              # Posts, comments, reactions, rumors
│   ├── societies.py          # Societies and memberships
│   ├── events.py             # Events and ticket management
│   ├── marketplace.py        # Stores, products, orders, payments
│   ├── chat.py               # Conversations and messages
│   ├── notifications.py      # User notifications
│   └── moderation.py         # Reports and audit logs
│
├── schemas/                   # Pydantic Models (Request/Response Validation)
│   ├── __init__.py
│   ├── users.py              # User schemas
│   ├── posts.py              # Post schemas
│   ├── societies.py          # Society and event schemas
│   ├── marketplace.py        # Marketplace schemas
│   ├── chat.py               # Chat schemas
│   ├── notifications.py      # Notification schemas
│   └── moderation.py         # Moderation schemas
│
├── routes/                    # API Endpoints
│   ├── __init__.py
│   ├── users.py              # User endpoints (register, profile, follow)
│   ├── posts.py              # Post endpoints (create, feed, comments, reactions)
│   ├── societies.py          # Society endpoints
│   ├── events.py             # Event endpoints
│   ├── marketplace.py        # Marketplace endpoints (products, orders)
│   ├── chat.py               # Chat endpoints (conversations, messages)
│   ├── notifications.py      # Notification endpoints
│   └── admin.py              # Admin/moderation endpoints
│
├── services/                  # Business Logic Layer
│   ├── __init__.py
│   ├── user_service.py       # User operations
│   ├── post_service.py       # Post operations
│   ├── society_service.py    # Society operations
│   ├── event_service.py      # Event operations
│   ├── marketplace_service.py # Marketplace operations
│   ├── chat_service.py       # Chat operations
│   └── notification_service.py # Notification operations
│
├── utils/                     # Utility Functions
│   ├── __init__.py
│   ├── validators.py         # Input validation functions
│   ├── helpers.py            # Helper functions (pagination, formatting, etc)
│   └── decorators.py         # Custom decorators (auth, rate limiting, etc)
│
├── requirements.txt           # Python dependencies
└── venv/                      # Python virtual environment
```

---

## Database Schema Overview

### Core Tables

#### Users & Auth
- `users` - User accounts with email, verification status
- `user_profiles` - User profiles with avatar, bio, batch year
- `roles` - User roles (ADMIN, USER)
- `user_roles` - User-to-role mapping
- `follows` - Follow relationships between users

#### Posts & Feed
- `posts` - Social posts (rumors, confessions, announcements, marketplace, society)
- `post_media` - Media attachments for posts
- `post_tags` - Tags for post categorization
- `comments` - Comments on posts
- `reactions` - Post reactions (like, love, haha, etc)
- `rumor_votes` - TRUE/FALSE voting on rumors

#### Societies & Events
- `societies` - University societies
- `society_members` - Society membership with roles
- `society_posts` - Society announcements and posts
- `events` - Society events
- `event_tickets` - Ticket types (VIP, Regular, Student, Free)
- `event_ticket_purchases` - Ticket purchases by users

#### Marketplace
- `stores` - User-owned product stores
- `products` - Products in stores
- `product_media` - Product images/videos
- `orders` - Customer orders
- `order_items` - Items in an order
- `payments` - Payment records (COD, Card, EasyPaisa, JazzCash)
- `addresses` - Shipping addresses

#### Chat & Notifications
- `conversations` - Chat conversations (1-to-1 or groups)
- `conversation_participants` - Users in a conversation
- `messages` - Messages in conversations
- `message_media` - Media in messages
- `notifications` - User notifications
- `media` - Global media storage

#### Moderation
- `reports` - Content reports from users
- `audit_logs` - System action logs

---

## API Endpoints (v1/api)

### Users (`/api/v1/users`)
- `POST /register` - Register new user
- `GET /profile/{user_id}` - Get user profile
- `PUT /profile/{user_id}` - Update user profile
- `POST /follow/{user_id}` - Follow a user
- `DELETE /follow/{user_id}` - Unfollow user
- `GET /{user_id}/followers` - Get followers
- `GET /{user_id}/following` - Get following

### Posts (`/api/v1/posts`)
- `POST /` - Create post
- `GET /` - Get feed
- `GET /{post_id}` - Get specific post
- `PUT /{post_id}` - Update post
- `DELETE /{post_id}` - Delete post
- `POST /{post_id}/comments` - Add comment
- `GET /{post_id}/comments` - Get comments
- `POST /{post_id}/reactions` - React to post
- `DELETE /{post_id}/reactions` - Remove reaction

### Societies (`/api/v1/societies`)
- `POST /` - Create society
- `GET /` - List societies
- `GET /{society_id}` - Get society
- `PUT /{society_id}` - Update society
- `DELETE /{society_id}` - Delete society
- `POST /{society_id}/join` - Join society
- `DELETE /{society_id}/leave` - Leave society
- `GET /{society_id}/members` - Get members

### Events (`/api/v1/events`)
- `POST /` - Create event
- `GET /` - List events
- `GET /{event_id}` - Get event
- `POST /{event_id}/tickets/purchase` - Buy tickets
- `GET /{event_id}/attendees` - Get attendees

### Marketplace (`/api/v1/marketplace`)
- `POST /products` - Create product
- `GET /products` - List products
- `GET /products/{product_id}` - Get product
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/{order_id}` - Get order details

### Chat (`/api/v1/chat`)
- `POST /conversations` - Create conversation
- `GET /conversations` - Get conversations
- `POST /conversations/{id}/messages` - Send message
- `GET /conversations/{id}/messages` - Get messages

### Notifications (`/api/v1/notifications`)
- `GET /` - Get notifications
- `PUT /{id}/read` - Mark as read
- `GET /unread-count` - Get unread count

### Admin (`/api/v1/admin`)
- `POST /reports` - Create report
- `GET /reports` - List reports
- `POST /users/{user_id}/ban` - Ban user
- `GET /audit-logs` - Get audit logs

---

## Tech Stack

- **Framework**: FastAPI (Python web framework)
- **Database**: MySQL with SQLAlchemy ORM
- **Validation**: Pydantic
- **Server**: Uvicorn (ASGI server)
- **Database Driver**: PyMySQL
- **Environment**: Python 3.10+

---

## Installation & Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nust_social
DB_PORT=3306
```

### 3. Create Database
```bash
mysql -u root -p < db.txt
```

### 4. Run Server
```bash
python -m uvicorn main:app --reload
```

Server runs on: http://0.0.0.0:8000
API Docs: http://localhost:8000/api/docs

---

## File Purposes Reference

| File | Purpose |
|------|---------|
| `main.py` | Main FastAPI app initialization |
| `config.py` | Environment configuration |
| `database.py` | DB connection & ORM setup |
| `models/*.py` | SQLAlchemy table models |
| `schemas/*.py` | Input/output validation |
| `routes/*.py` | API endpoints |
| `services/*.py` | Business logic layer |
| `utils/validators.py` | Input validations |
| `utils/helpers.py` | Utility functions |
| `utils/decorators.py` | Custom decorators |

---

## Development Workflow

1. **Request comes in** → Routes (FastAPI)
2. **Request validation** → Schemas (Pydantic)
3. **Business logic** → Services
4. **Database operations** → Models
5. **Response sent** → Serialized by Schemas

---

## Notes

- All files at the top include a docstring describing their purpose
- TODO comments indicate where implementation is needed
- Service methods contain the complete business logic
- Routes are organized by feature
- Database uses indexes for performance
- Soft deletes are used (deleted_at field) for audit trails

---

## Next Steps

1. Implement authentication (JWT tokens)
2. Implement service layer methods
3. Add error handling and logging
4. Create frontend integration
5. Set up WebSocket for real-time features (chat, notifications)
6. Add comprehensive tests

---

*Last Updated: 2026-03-28*

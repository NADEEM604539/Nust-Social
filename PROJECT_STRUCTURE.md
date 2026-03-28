# 🎓 NUST SOCIAL - Complete Project Structure

## 📋 Project Overview

**Platform**: NUST Life Hub - A comprehensive social, marketplace, and event management platform for NUST students.

**Built with**: FastAPI + SQLAlchemy + MySQL + Uvicorn

---

## 📁 Directory Structure

```
NUST SOCIAL/
│
├── README.md                      # Comprehensive project documentation
├── FRONTEND_STRUCTURE.md          # Frontend project template
│
└── backend/                       # Backend FastAPI application
    │
    ├── main.py                    # Main entry point - Initialize FastAPI app
    │                              # Purpose: Configure routes, middleware, startup/shutdown
    │
    ├── config.py                  # Configuration - Load environment variables
    │                              # Purpose: Store app config (DB credentials, app info, etc)
    │
    ├── database.py                # Database Module - SQLAlchemy ORM setup
    │                              # Purpose: Configure DB connection, session management
    │
    ├── db.txt                     # Database Schema - SQL table definitions
    │                              # Purpose: Store complete MySQL schema for NUST Social
    │
    ├── idea.txt                   # Project Ideas & Requirements
    │                              # Purpose: Document all features and platform concepts
    │
    ├── requirements.txt           # Python Dependencies
    │                              # Purpose: List all required Python packages
    │
    │
    ├── models/                    # 📊 DATABASE MODELS (SQLAlchemy ORM)
    │   ├── __init__.py            # Package initialization
    │   ├── media.py               # Purpose: Media files (images, videos, documents)
    │   ├── users.py               # Purpose: User accounts, profiles, roles, follows
    │   ├── posts.py               # Purpose: Posts, comments, reactions, rumors, voting
    │   ├── societies.py           # Purpose: Societies, members, society posts
    │   ├── events.py              # Purpose: Events, tickets, ticket purchases
    │   ├── marketplace.py         # Purpose: Stores, products, orders, payments, addresses
    │   ├── chat.py                # Purpose: Conversations, participants, messages
    │   ├── notifications.py       # Purpose: User notifications
    │   └── moderation.py          # Purpose: Reports, audit logs
    │
    │
    ├── schemas/                   # ✅ VALIDATION SCHEMAS (Pydantic Models)
    │   ├── __init__.py            # Package initialization
    │   ├── users.py               # Purpose: User registration, profile validation
    │   ├── posts.py               # Purpose: Post, comment, reaction validation
    │   ├── societies.py           # Purpose: Society, event, ticket validation
    │   ├── marketplace.py         # Purpose: Product, order, payment validation
    │   ├── chat.py                # Purpose: Conversation, message validation
    │   ├── notifications.py       # Purpose: Notification response validation
    │   └── moderation.py          # Purpose: Report validation
    │
    │
    ├── routes/                    # 🌐 API ENDPOINTS
    │   ├── __init__.py            # Package initialization - register all routers
    │   ├── users.py               # Purpose: User endpoints (register, profile, follow)
    │   ├── posts.py               # Purpose: Post endpoints (create, feed, comments, reactions)
    │   ├── societies.py           # Purpose: Society endpoints (CRUD, members)
    │   ├── events.py              # Purpose: Event endpoints (create, tickets, attendees)
    │   ├── marketplace.py         # Purpose: Marketplace endpoints (products, orders)
    │   ├── chat.py                # Purpose: Chat endpoints (conversations, messages)
    │   ├── notifications.py       # Purpose: Notification endpoints
    │   └── admin.py               # Purpose: Admin endpoints (moderation, reports, audit)
    │
    │
    ├── services/                  # 💼 BUSINESS LOGIC LAYER
    │   ├── __init__.py            # Package initialization
    │   ├── user_service.py        # Purpose: User operations (create, follow, ban, etc)
    │   ├── post_service.py        # Purpose: Post operations (create, feed, reactions)
    │   ├── society_service.py     # Purpose: Society operations (create, members, posts)
    │   ├── event_service.py       # Purpose: Event operations (tickets, purchases)
    │   ├── marketplace_service.py # Purpose: Marketplace operations (orders, payments)
    │   ├── chat_service.py        # Purpose: Chat operations (messages, conversations)
    │   └── notification_service.py# Purpose: Notification operations
    │
    │
    ├── utils/                     # 🛠️ UTILITY FUNCTIONS
    │   ├── __init__.py            # Package initialization
    │   ├── validators.py          # Purpose: Input validation (email, username, password, etc)
    │   ├── helpers.py             # Purpose: Helper functions (pagination, formatting, calculations)
    │   └── decorators.py          # Purpose: Custom decorators (auth, rate limit, ownership check)
    │
    │
    └── venv/                      # 🐍 Python Virtual Environment
        └── (Auto-generated)       # Purpose: Isolated Python environment with dependencies
```

---

## 🔑 File Purposes Summary

### Core Application Files
| File | Purpose |
|------|---------|
| `main.py` | Main FastAPI application initialization and route registration |
| `config.py` | Load and store environment configuration variables |
| `database.py` | SQLAlchemy ORM setup, connection pooling, session management |
| `requirements.txt` | List all Python package dependencies |

### Database & Schema
| File | Purpose |
|------|---------|
| `db.txt` | Complete MySQL database schema with all table definitions |
| `idea.txt` | Project requirements, features, and platform concepts |

### Models (SQLAlchemy ORM)
| File | Purpose |
|------|---------|
| `models/media.py` | Media table - stores images, videos, documents |
| `models/users.py` | User accounts, profiles, roles, and follow relationships |
| `models/posts.py` | Posts, comments, reactions, rumors with voting system |
| `models/societies.py` | University societies, members, and society posts |
| `models/events.py` | Events, ticket types, and ticket purchases |
| `models/marketplace.py` | Stores, products, orders, payments, and addresses |
| `models/chat.py` | Conversations, participants, messages, and media |
| `models/notifications.py` | User notifications for various events |
| `models/moderation.py` | Content reports and system audit logs |

### Request/Response Validation (Pydantic)
| File | Purpose |
|------|---------|
| `schemas/users.py` | Validate user registration and profile updates |
| `schemas/posts.py` | Validate post creation, comments, reactions |
| `schemas/societies.py` | Validate society and event creation/updates |
| `schemas/marketplace.py` | Validate products, orders, and payments |
| `schemas/chat.py` | Validate conversations and messages |
| `schemas/notifications.py` | Validate notification responses |
| `schemas/moderation.py` | Validate reports and moderation actions |

### API Routes (Endpoints)
| File | Purpose |
|------|---------|
| `routes/users.py` | User endpoints: register, profile, follow system |
| `routes/posts.py` | Post endpoints: create, feed, comments, reactions |
| `routes/societies.py` | Society endpoints: CRUD operations, membership |
| `routes/events.py` | Event endpoints: create, manage tickets, list attendees |
| `routes/marketplace.py` | Marketplace endpoints: products, orders, payments |
| `routes/chat.py` | Chat endpoints: conversations, real-time messages |
| `routes/notifications.py` | Notification endpoints: fetch, mark read |
| `routes/admin.py` | Admin endpoints: reports, moderation, audit logs |

### Business Logic (Services)
| File | Purpose |
|------|---------|
| `services/user_service.py` | User operations: create, verify, follow, ban/suspend |
| `services/post_service.py` | Post operations: create, feed generation, reactions |
| `services/society_service.py` | Society operations: CRUD, member management |
| `services/event_service.py` | Event operations: tickets, purchases, stats |
| `services/marketplace_service.py` | Marketplace: products, orders, payment processing |
| `services/chat_service.py` | Chat: conversations, messaging, read status |
| `services/notification_service.py` | Notifications: create, send, cleanup |

### Utility Functions
| File | Purpose |
|------|---------|
| `utils/validators.py` | Validate email, username, password strength, phone |
| `utils/helpers.py` | Pagination, price calculations, datetime utilities |
| `utils/decorators.py` | Auth checks, rate limiting, ownership validation |

---

## 🏗️ Architecture Layers

```
Request → Routes → Schemas (Validate) → Services (Logic) → Models (DB) → Response
```

1. **Routes** - API endpoints, handle HTTP requests
2. **Schemas** - Validate incoming data using Pydantic
3. **Services** - Core business logic
4. **Models** - Database operations via SQLAlchemy ORM
5. **Database** - MySQL storage

---

## 📦 Key Features

✅ **Social Feed** - Anonymous posts, rumors, confessions, announcements
✅ **User System** - Registration, profiles, follow system
✅ **Societies** - Society creation, membership, event management
✅ **Events** - Ticket sales (VIP/Regular/Student)
✅ **Marketplace** - User stores, product selling, order management
✅ **Real-time Chat** - 1-to-1 and group conversations
✅ **Notifications** - Activity notifications
✅ **Moderation** - Report system, admin controls, audit logs
✅ **Media** - Image, video, document uploads

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Configure database (.env file)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=nust_social

# 3. Run server
python -m uvicorn main:app --reload

# 4. Access API docs
# http://localhost:8000/api/docs
```

---

## 📋 Database Tables (26 total)

**Media**: 1 table
**Users**: 5 tables
**Posts**: 6 tables
**Societies**: 3 tables
**Events**: 3 tables
**Marketplace**: 7 tables
**Chat**: 4 tables
**Moderation**: 2 tables
**Notifications**: 1 table

---

## 🔗 API Base URL

`http://0.0.0.0:8000/api/v1`

---

## 📖 Documentation

- Full API documentation available at: `/api/docs` (Swagger UI)
- Alternative documentation at: `/api/redoc` (ReDoc)

---

## 🎯 Development Status

- ✅ Project structure complete
- ✅ Database schema defined
- ✅ Models defined
- ✅ Schemas defined
- ✅ Routes scaffolded
- ✅ Services scaffolded
- ⏳ Implementation in progress
- ⏳ Testing
- ⏳ Deployment

---

*Project initialized: 2026-03-28*

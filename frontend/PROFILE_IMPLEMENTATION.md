# NUST SOCIAL Profile Page - Complete Implementation Guide

## 📋 Overview

The `/profile` page provides a comprehensive user profile management system with Instagram-like design. Users can view and edit their complete profile information and manage their posts across three different categories.

## 🗂️ File Structure

```
/frontend
├── app/
│   └── profile/
│       └── page.jsx                 # Main profile page (Instagram-like layout)
├── components/
│   ├── EditProfileModal.jsx         # Modal for editing profile
│   ├── ProfilePostsSection.jsx      # Component to display posts by category
│   └── Navigation.jsx               # Sidebar navigation
└── utils/
    └── api.js                       # API utilities
```

## 🎨 Design Features

### Instagram-Style Layout
- **Profile Header**: Avatar, username, bio, stats
- **Edit Profile Button**: Opens modal with all editable fields
- **Tab Navigation**: Three categorized post views
- **Post Feed**: Displays posts with media, interactions
- **Dark Mode**: Full dark/light theme support
- **Responsive Design**: Mobile, tablet, desktop optimized

### Color Scheme
- **Primary**: Pink (#EC4899)
- **Secondary**: Purple (#A855F7)
- **Dark Mode**: Dark gray backgrounds
- **Light Mode**: White backgrounds

## 📱 Profile Page Components

### 1. Profile Header Section
```jsx
// Displays:
- Avatar circle with gradient (first initial)
- Username
- Edit Profile button
- Statistics (posts, followers, following)
- User details (name, bio, batch, department)
```

### 2. Tab Navigation
Three distinct tabs for post categorization:

**Tab 1: 📝 Posts**
- Regular, non-anonymous posts
- Excludes confessions/rumors
- Shows profile link for user identification

**Tab 2: 🤐 Confessions & Rumors**
- Posts with `category` = 'confession' or 'rumor'
- Displays name without direct identification
- Special badge styling

**Tab 3: 🔒 My Anonymous Posts**
- Posts where `is_anonymous` = true
- Shows encrypted name representation
- User's own anonymous posts only

### 3. Edit Profile Modal
Opens when user clicks "Edit Profile" button

**Editable Fields:**
- Username
- Full Name (maps to `name` in backend)
- Email
- Bio (max 150 characters)
- Batch (maps to `batch_year` in backend)
- Department

## 🔄 API Integration

### Authentication Flow
1. Check for access token
2. If missing, redirect to `/auth/login`
3. Decode JWT to extract user_id
4. Fetch profile data for current user

### API Endpoints Used

#### Get Profile
```
GET /api/v1/users/profile/{user_id}

Response:
{
  "user_id": 1,
  "username": "john_doe",
  "name": "John Doe",
  "bio": "Student at NUST",
  "batch_year": 2024,
  "department": "CS",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

#### Update Profile
```
PUT /api/v1/users/profile

Request Body:
{
  "username": "new_username",
  "full_name": "New Name",
  "email": "new@email.com",
  "bio": "New bio",
  "batch": 2024,
  "department": "New Department"
}

Response: Same as GET Profile
```

#### Get User Stats
```
GET /api/v1/users/{user_id}/stats

Response:
{
  "stats": {
    "posts_count": 5,
    "followers_count": 100,
    "following_count": 50,
    "is_following": false
  }
}
```

#### Get All Posts
```
GET /api/v1/posts

Response:
{
  "data": {
    "posts": [
      {
        "id": 1,
        "user_id": 1,
        "content": "Post content",
        "category": null,  // or "confession", "rumor"
        "is_anonymous": false,
        "encrypted_name": "...",
        "username": "john_doe",
        "created_at": "2024-01-01T00:00:00",
        "stats": {
          "likes_count": 10,
          "comments_count": 5
        },
        "media": [
          {
            "url": "image_url",
            "type": "image"
          }
        ]
      }
    ]
  }
}
```

#### Delete Post
```
DELETE /api/v1/posts/{post_id}

Response:
{
  "message": "Post deleted successfully"
}
```

## 🔌 Component Props & State

### Profile Page (`page.jsx`)
```jsx
State:
- user: Current user object
- stats: User statistics
- loading: Loading state
- error: Error messages
- showEditModal: Modal visibility
- activeTab: Current tab ('posts', 'confessions', 'anonymous')
- userId: Current user ID
- refreshTrigger: Refresh posts trigger

Functions:
- handleEdit(updatedData): Update profile
```

### EditProfileModal
```jsx
Props:
- user: User object with current data
- isDark: Dark mode flag
- onClose: Close modal callback
- onSave: Save changes callback

State:
- formData: Form field values
- loading: Form submission loading
- error: Form submission error
```

### ProfilePostsSection
```jsx
Props:
- userId: User ID to fetch posts for
- category: 'posts', 'confessions', or 'anonymous'
- isDark: Dark mode flag
- refreshTrigger: Trigger to refresh posts
- onPostDeleted: Callback when post is deleted

State:
- posts: Filtered posts array
- loading: Loading state
- error: Error message
```

## 📊 Data Flow Diagram

```
User logs in
    ↓
Access /profile
    ↓
Check token → NOT FOUND → Redirect to login
    ↓ FOUND
Extract user_id from token
    ↓
Fetch profile data
    ↓
Fetch stats
    ↓
Display profile header with info
    ↓
User selects tab
    ↓
Filter posts by category
    ↓
Display posts in selected category
    ↓
User clicks "Edit Profile"
    ↓
Open modal with current data
    ↓
User submits form
    ↓
PUT /users/profile
    ↓
Update state with new data
    ↓
Close modal
```

## 🎯 Features & Functionality

### Profile Management
✅ View complete profile information
✅ Edit all profile fields
✅ Real-time validation
✅ Error handling with user feedback
✅ Form data persistence during editing

### Post Management
✅ View posts by category
✅ Three-dot menu for post actions
✅ Delete own posts with confirmation
✅ Real-time post refresh
✅ Empty state messages

### User Experience
✅ Loading spinners
✅ Error messages
✅ Confirmation dialogs
✅ Smooth animations
✅ Dark/light mode support
✅ Responsive design
✅ Sticky tab navigation

## 🔐 Security Features

1. **Token Validation**: Checks JWT on every request
2. **User Ownership**: Only edit own profile, delete own posts
3. **Authorization Headers**: Sent on all authenticated requests
4. **Input Validation**: Required fields checked before submit
5. **Error Hiding**: Server errors don't expose sensitive info

## 📝 Backend Requirements

### Database Schema
```sql
-- user_profiles table
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    bio TEXT,
    batch_year INT,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- posts table (includes category and is_anonymous)
CREATE TABLE posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    content TEXT,
    category ENUM('confession', 'rumor') NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    encrypted_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
);
```

### Service Methods
```python
# UserService
- update_user_profile(db, user_id, profile_data)
- follow_user(db, follower_id, following_id)
- get_followers(db, user_id)

# PostService
- get_all_posts(db)
- delete_post(db, post_id, user_id)
```

## 🧪 Testing Checklist

### Authentication
- [ ] Redirect non-logged users to login
- [ ] Load profile with valid token
- [ ] Handle expired token gracefully

### Profile Display
- [ ] Show all profile fields correctly
- [ ] Display user statistics
- [ ] Load user avatar/initial
- [ ] Show bio and other details

### Profile Editing
- [ ] Modal opens/closes correctly
- [ ] Form pre-fills with current data
- [ ] All fields are editable
- [ ] Validation works
- [ ] Submit updates profile
- [ ] Modal closes after save
- [ ] Updated data displays immediately

### Post Management
- [ ] Posts filter by category correctly
- [ ] Can view simple posts
- [ ] Can view confessions & rumors
- [ ] Can view own anonymous posts
- [ ] Can delete own posts
- [ ] Cannot delete other's posts
- [ ] Post refresh works after delete
- [ ] Empty states display

### UI/UX
- [ ] Dark mode styling correct
- [ ] Light mode styling correct
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Loading spinners appear
- [ ] Error messages display
- [ ] Buttons are clickable
- [ ] Forms submit correctly

## 🚀 Deployment Notes

1. **Update API_ENDPOINTS** if backend URL changes
2. **Ensure all user model fields exist** in database
3. **Test with real data** to verify field mapping
4. **Configure CORS** for API requests
5. **Set up CDN** for media uploads (if using image uploads)

## 📚 Related Pages

- `/user/profile/[id]` - View other users' profiles
- `/` - Home feed with posts
- `/create` - Create new posts
- `/auth/login` - Login page
- `/notifications` - Notification center

## 🔧 Common Issues & Solutions

### Issue: Profile not loading
**Solution**: Check token validity, verify API endpoints, test network requests

### Issue: Edit modal not saving
**Solution**: Check form validation, verify API response, check error messages

### Issue: Posts not filtering correctly
**Solution**: Verify category values in database, check filter logic in component

### Issue: Cannot delete posts
**Solution**: Verify ownership check, test API endpoint, check authorization header

## 📞 Support & Maintenance

- Keep authentication tokens updated
- Monitor API response times
- Track user feedback for UX improvements
- Regular database backups
- API versioning strategy (using /v1/)


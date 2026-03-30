# Profile Page Implementation Guide

## Overview
A comprehensive user profile page with full CRUD operations, Instagram-like design, and three categorized post sections.

## Page Location
- **Route**: `/profile`
- **Layout**: Main content area with sidebar navigation
- **Access**: Authenticated users only (redirects to login if not authenticated)

## Features

### 1. Profile Header Section
Displays comprehensive user information:
- **Avatar**: Gradient circle with user's first initial
- **Username**: User's display name
- **Edit Profile Button**: Opens modal to update profile information
- **Statistics**: 
  - Posts count
  - Followers count
  - Following count
- **User Details**:
  - Full name
  - Bio (if available)
  - Batch/Year
  - Department

### 2. Edit Profile Modal
Complete user profile editing with the following fields:
- Username
- Full Name
- Email
- Bio (max 150 characters)
- Batch
- Department

**API**: `PUT /api/v1/users/profile`

### 3. Three Post Categories

#### Tab 1:📝 Posts
**Displays**: Regular, non-anonymous posts that are not confessions or rumors
- Shows profile link for user identification
- Full post content and media
- Like and comment counts

#### Tab 2: 🤐 Confessions & Rumors
**Displays**: Posts marked as confessions or rumors
- Shows encrypted name with 🔒 lock emoji
- Appropriate badges (🤐 Confession or 🗣️ Rumor)
- Category-specific styling

#### Tab 3: 🔒 My Anonymous Posts
**Displays**: All anonymous posts posted by the current user
- Shows encrypted name representation
- Full post details
- Delete functionality for user's own posts

### 4. Post Management
- **Full CRUD Operations**:
  - **Create**: Via the main create post page/button
  - **Read**: Displayed in all three categories
  - **Update**: Edit through the post detail page (if implemented)
  - **Delete**: Three-dot menu on post cards owned by current user

### 5. Design Elements

#### Theme Support
- Dark mode (default: `bg-gray-950`)
- Light mode (default: `bg-white`)
- Consistent color scheme with pink/purple gradients
- Responsive design for mobile, tablet, and desktop

#### Instagram-like Features
- Clean, minimal post cards
- Consistent spacing and typography
- Hover effects on interactive elements
- Sticky tab navigation
- Smooth animations and transitions

#### Responsive Design
- **Mobile**: Stack layout with full width
- **Tablet**: Optimized spacing and layout
- **Desktop**: Maximum width container (max-w-4xl)

## Component Structure

```
/profile (page.jsx)
├── Navigation (sidebar)
├── Profile Header
│   ├── Avatar
│   ├── User Info
│   └── Statistics
├── Edit Profile Modal
│   └── EditProfileModal.jsx
├── Tab Navigation
│   ├── Posts
│   ├── Confessions & Rumors
│   └── Anonymous Posts
└── ProfilePostsSection.jsx
    └── Multiple PostCard components
```

## API Endpoints Used

1. **Get Profile**: `GET /api/v1/users/profile/{user_id}`
   - Returns: User object with all details

2. **Get Stats**: `GET /api/v1/users/{user_id}/stats`
   - Returns: posts_count, followers_count, following_count

3. **Update Profile**: `PUT /api/v1/users/profile`
   - Body: Username, email, full_name, bio, batch, department
   - Returns: Updated user object

4. **Get All Posts**: `GET /api/v1/posts`
   - Returns: Array of posts with metadata

5. **Delete Post**: `DELETE /api/v1/posts/{post_id}`
   - Returns: Success message

## Database Schema Expectations

### Users Table
```
- user_id
- username
- email
- full_name
- bio
- batch
- department
- created_at
- updated_at
```

### Posts Table
```
- id
- user_id
- content
- category (null, 'confession', 'rumor')
- is_anonymous
- encrypted_name
- created_at
- stats (likes_count, comments_count)
```

## How It Works

### 1. Authentication Flow
```
1. User accesses /profile
2. Check if token exists
3. If not, redirect to /auth/login
4. If yes, decode token to get user_id
5. Fetch profile data using user_id
```

### 2. Post Filtering Logic
```
// Posts Category
filtered = posts.filter(p => 
  p.user_id === userId 
  && !p.is_anonymous 
  && p.category !== 'confession' 
  && p.category !== 'rumor'
)

// Confessions Category
filtered = posts.filter(p => 
  p.user_id === userId 
  && !p.is_anonymous 
  && (p.category === 'confession' || p.category === 'rumor')
)

// Anonymous Category
filtered = posts.filter(p => 
  p.user_id === userId 
  && p.is_anonymous
)
```

### 3. Edit Profile Flow
```
1. User clicks "Edit Profile"
2. Modal opens with current data
3. User modifies fields
4. On save: POST to /api/v1/users/profile
5. Update state with new data
6. Close modal
7. Display success to user
```

### 4. Delete Post Flow
```
1. User clicks three-dot menu on own post
2. Click "Delete Post"
3. Show confirmation
4. DELETE to /api/v1/posts/{id}
5. Refresh post list
6. Show success message
```

## State Management

### Main Profile Page
- `user`: Current user object
- `stats`: User statistics
- `loading`: Loading state
- `error`: Error messages
- `showEditModal`: Modal visibility
- `activeTab`: Current post category tab
- `userId`: Current user ID
- `refreshTrigger`: Trigger to refresh posts

### ProfilePostsSection Component
- `posts`: Filtered posts array
- `loading`: Loading state
- `error`: Error messages

## Key Features & Enhancements

### 1. Real-time Updates
- Posts refresh when deleted
- Profile updates immediately on edit
- Statistics update after follow/unfollow actions

### 2. User Experience
- Loading states with spinners
- Empty state messages for each category
- Error handling with user-friendly messages
- Confirmation dialogs for destructive actions
- Sticky tab navigation for easy switching

### 3. Security
- Token validation before API calls
- User ID verification for ownership checks
- Authorization headers on all authenticated requests

### 4. Performance
- Efficient post filtering
- Minimal re-renders
- Lazy loading of modals
- Optimized image/video display

## Future Enhancements

1. **Post Editing**: Allow users to edit their own posts
2. **Privacy Settings**: Control who can see posts
3. **Profile Picture Upload**: Custom profile images
4. **Following Tab**: See posts from followed users
5. **Advanced Filters**: Filter by date, engagement, type
6. **Pin Post**: Feature favorite posts at top
7. **Archive Posts**: Hide without deleting
8. **Report Post**: Report inappropriate content

## Styling Classes Reference

### Colors
- **Primary**: `text-pink-500`, `bg-pink-500`
- **Secondary**: `text-purple-600`, `bg-purple-600`
- **Dark**: `bg-gray-950`, `text-white`
- **Light**: `bg-white`, `text-black`

### Common Classes
- **Borders**: `border-gray-800` (dark), `border-gray-200` (light)
- **Text Colors**: Use `isDark ? 'text-white' : 'text-black'`
- **Backgrounds**: Use `isDark ? 'bg-gray-900' : 'bg-white'`

## Testing Checklist

- [ ] Authentication redirects non-logged-in users
- [ ] Profile data loads correctly
- [ ] Edit modal opens and closes
- [ ] Profile update saves all fields
- [ ] Posts filter correctly by category
- [ ] Can delete own posts
- [ ] Can't delete other users' posts
- [ ] Dark/light mode styling works
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Empty states display correctly
- [ ] Loading states appear during data fetch
- [ ] Error messages appear appropriately


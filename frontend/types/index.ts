export type VoteDirection = 'up' | 'down' | null;

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  department: string;
  batch: string;
  karma: number;
  avatarColor: string;
  createdAt: string;
}

export interface Flair {
  id: string;
  name: string;
  color: string;
  bgColor: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  type: 'text' | 'image' | 'link';
  imageUrl?: string;
  linkUrl?: string;
  author: User;
  community: CommunityBasic;
  flair?: Flair;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteDirection;
  commentCount: number;
  createdAt: string;
  saved: boolean;
}

export interface CommunityBasic {
  id: string;
  name: string;
  slug: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerColor: string;
  iconColor: string;
  memberCount: number;
  category: string;
  rules: CommunityRule[];
  topContributors: User[];
  createdAt: string;
  isJoined: boolean;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

export interface Comment {
  id: string;
  body: string;
  author: User;
  postId: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteDirection;
  createdAt: string;
  replies: Comment[];
  isCollapsed: boolean;
}

export type SortOption = 'hot' | 'new' | 'top';

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

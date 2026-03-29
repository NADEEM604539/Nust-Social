import { Post, Community, Comment, User, PaginatedResponse, SortOption } from '@/types';
import { posts, communities, comments, users } from './mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch<T>(endpoint: string): Promise<T> {
    if (!API_URL) throw new Error('API_URL not configured');
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ── Posts ────────────────────────────────────────────
export async function fetchPosts(
    sort: SortOption = 'hot',
    cursor?: string,
    communitySlug?: string
): Promise<PaginatedResponse<Post>> {
    if (API_URL) {
        const params = new URLSearchParams({ sort });
        if (cursor) params.set('cursor', cursor);
        if (communitySlug) params.set('community', communitySlug);
        return apiFetch(`/posts?${params}`);
    }
    // Mock fallback
    let filtered = communitySlug
        ? posts.filter((p) => p.community.slug === communitySlug)
        : [...posts];

    switch (sort) {
        case 'new':
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case 'top':
            filtered.sort((a, b) => b.score - a.score);
            break;
        case 'hot':
        default:
            filtered.sort((a, b) => b.score / (Date.now() - new Date(b.createdAt).getTime()) - a.score / (Date.now() - new Date(a.createdAt).getTime()));
            break;
    }
    return { data: filtered, hasMore: false };
}

export async function fetchPost(id: string): Promise<Post | null> {
    if (API_URL) return apiFetch(`/posts/${id}`);
    return posts.find((p) => p.id === id) ?? null;
}

// ── Communities ─────────────────────────────────────
export async function fetchCommunities(): Promise<Community[]> {
    if (API_URL) return apiFetch('/communities');
    return communities;
}

export async function fetchCommunity(slug: string): Promise<Community | null> {
    if (API_URL) return apiFetch(`/communities/${slug}`);
    return communities.find((c) => c.slug === slug) ?? null;
}

// ── Comments ────────────────────────────────────────
export async function fetchComments(postId: string): Promise<Comment[]> {
    if (API_URL) return apiFetch(`/posts/${postId}/comments`);
    return comments.filter((c) => c.postId === postId && c.parentId === null);
}

// ── Users ───────────────────────────────────────────
export async function fetchUser(username: string): Promise<User | null> {
    if (API_URL) return apiFetch(`/users/${username}`);
    return users.find((u) => u.username === username) ?? null;
}

export async function fetchUserPosts(username: string): Promise<Post[]> {
    if (API_URL) return apiFetch(`/users/${username}/posts`);
    return posts.filter((p) => p.author.username === username);
}

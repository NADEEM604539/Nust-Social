import PostDetailModal from '@/components/PostDetailModal';

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }) {
  const { id } = await params;
  
  return <PostDetailModal postId={id} />;
}

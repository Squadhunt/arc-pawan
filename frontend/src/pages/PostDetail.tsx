import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Clock,
  Image,
  Video,
  Trash2,
  Edit,
  Flag,
  UserMinus,
  X
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import OptimizedImage from '../components/OptimizedImage';
import axios from 'axios';
import config from '../config/config';

interface Post {
  _id: string;
  content: {
    text: string;
    media: Array<{
      type: 'image' | 'video';
      url: string;
      publicId: string;
    }>;
  };
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
    userType?: 'player' | 'team' | 'admin';
    role?: 'player' | 'team';
  };
  postType: 'general' | 'recruitment' | 'achievement' | 'looking-for-team';
  likes: Array<{
    user: string | {
      _id: string;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    };
    likedAt: string;
  }>;
  comments: Array<{
    user: {
      _id: string;
      username: string;
      profilePicture?: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    };
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching post with ID:', id);
      console.log('API URL:', `${config.apiUrl}/api/posts/${id}`);
      
      const response = await axios.get(`${config.apiUrl}/api/posts/${id}`);
      console.log('Post response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch post');
      }
      
      const postData = response.data.data.post;
      if (!postData) {
        throw new Error('Post data not found in response');
      }
      
      setPost(postData);
      setLikeCount(postData.likes.length);
      setIsLiked(postData.likes.some((like: any) => 
        typeof like.user === 'string' ? like.user === user?._id : like.user._id === user?._id
      ));
    } catch (err: any) {
      console.error('Error fetching post:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`${config.apiUrl}/api/posts/${post?._id}/like`);
      const postData = response.data.data.post;
      setLikeCount(postData.likes.length);
      setIsLiked(postData.likes.some((like: any) => 
        typeof like.user === 'string' ? like.user === user._id : like.user._id === user._id
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${config.apiUrl}/api/posts/${post?._id}/comment`, {
        text: newComment
      });
      const postData = response.data.data.post;
      setPost(postData);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyPostLink = async () => {
    const postUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(postUrl);
      console.log('Post link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const postUrl = window.location.href;
    const text = `Check out this post: ${post?.content.text.substring(0, 100)}...`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const getDisplayName = (author: any) => {
    return author.profile?.displayName || author.username;
  };

  const getProfilePicture = (author: any) => {
    return author.profile?.avatar || author.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWlsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Post not found</div>
          <AnimatedButton onClick={() => navigate('/')} variant="primary">
            Go Home
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-white font-bold text-lg">Post</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto pt-9">
        <AnimatedCard className="p-4" hoverable={false}>
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${post.author._id}`} className="group">
                <div className="relative">
                  <OptimizedImage
                    src={getProfilePicture(post.author)}
                    alt={getDisplayName(post.author)}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-gray-600/50 shadow-lg group-hover:shadow-xl group-hover:border-gray-500/70 transition-all duration-300"
                    width={40}
                    height={40}
                    priority={true}
                    placeholder="blur"
                    fastLoad={true}
                  />
                </div>
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Link 
                    to={`/profile/${post.author._id}`}
                    className="font-bold text-white hover:text-gray-400 transition-colors"
                  >
                    {getDisplayName(post.author)}
                  </Link>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-4">{post.content.text}</p>
            
            {/* Media */}
            {post.content.media && post.content.media.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 mx-[-1rem] w-[calc(100%+2rem)]">
                {post.content.media.map((media, index) => (
                  <div key={index} className="relative group w-full">
                    {media.type === 'image' ? (
                      <OptimizedImage
                        src={media.url}
                        alt="Post media"
                        className="max-h-96 object-cover w-full shadow-sm group-hover:shadow-lg transition-all duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={85}
                        placeholder="blur"
                        priority={index === 0}
                        fastLoad={true}
                      />
                    ) : (
                      <video
                        src={media.url}
                        controls
                        className="max-h-96 w-full shadow-sm group-hover:shadow-lg transition-all duration-200"
                        style={{ aspectRatio: '16/9' }}
                        preload="metadata"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between border-t border-gray-700/50 py-1">
            {/* Like Button - Left */}
            <motion.button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
              </motion.div>
              <span className="font-bold">{likeCount}</span>
            </motion.button>
            
            {/* Comment Button - Center */}
            <motion.button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="font-bold">{post.comments.length}</span>
            </motion.button>
            
            {/* Share Button - Right */}
            <motion.button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-400 hover:text-green-500 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <Share2 className="h-6 w-6" />
              <span className="font-bold">Share</span>
            </motion.button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-2 pt-2 border-t border-gray-700/50">
              {/* Add Comment */}
              {user && (
                <form onSubmit={handleComment} className="mb-3">
                  <div className="flex items-start space-x-3">
                    <OptimizedImage
                      src={user?.profilePicture || user?.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWlsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo='}
                      alt="Your profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-600/50 shadow-md flex-shrink-0"
                      width={32}
                      height={32}
                      priority={true}
                      placeholder="blur"
                      fastLoad={true}
                    />
                    <div className="flex-1 flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 transition-all duration-200 shadow-inner"
                          disabled={isSubmitting}
                        />
                      </div>
                      <AnimatedButton
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        loading={isSubmitting}
                        variant="primary"
                        size="sm"
                        className="px-4 py-2.5 rounded-full"
                      >
                        {isSubmitting ? 'Posting...' : 'Post'}
                      </AnimatedButton>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-2">
                {post.comments.length > 0 ? (
                  post.comments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3 group">
                      <OptimizedImage
                        src={getProfilePicture(comment.user)}
                        alt={getDisplayName(comment.user)}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-600 shadow-sm flex-shrink-0"
                        width={32}
                        height={32}
                        placeholder="blur"
                        fastLoad={true}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-800/40 rounded-2xl rounded-tl-sm p-3 border border-gray-700/50 group-hover:bg-gray-800/60 transition-colors duration-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm text-white truncate">
                              {getDisplayName(comment.user)}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center space-x-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(comment.createdAt)}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 leading-relaxed break-words">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No comments yet</p>
                    <p className="text-xs text-gray-500 mt-1">Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Copy Link */}
              <button
                onClick={copyPostLink}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Copy Link</p>
                  <p className="text-gray-400 text-sm">Share this post link</p>
                </div>
              </button>

              {/* Social Media Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">X</span>
                  </div>
                  <span className="text-white font-medium">Twitter</span>
                </button>

                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">f</span>
                  </div>
                  <span className="text-white font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <span className="text-white font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => shareToSocial('telegram')}
                  className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="text-white font-medium">Telegram</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;

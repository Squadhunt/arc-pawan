import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  Heart,
  Share2,
  AlertTriangle,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import config from '../config/config';

interface Post {
  _id: string;
  content: string | { text: string; media?: Array<{type: string; url: string; publicId: string}> };
  author: {
    _id: string;
    username: string;
    email: string;
    profile: {
      displayName: string;
      avatar: string;
    };
    userType: 'player' | 'team' | 'admin';
  };
  images?: string[];
  likes: string[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({
    isOpen: false,
    post: null
  });
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({
    isOpen: false,
    post: null
  });

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchTerm, authorFilter, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(authorFilter && { author: authorFilter }),
        ...(statusFilter && { isActive: statusFilter })
      });

      const response = await fetch(`${config.apiUrl}/api/admin/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const getPostMedia = (post: Post): Array<{url: string; type: string}> => {
    // Check if images are in the old format (direct images array)
    if (post.images && Array.isArray(post.images)) {
      return post.images.map(url => ({ url, type: 'image' }));
    }
    
    // Check if media are in the new format (content.media array)
    if (post.content && typeof post.content === 'object' && post.content.media && Array.isArray(post.content.media)) {
      return post.content.media.map(media => ({ url: media.url, type: media.type }));
    }
    
    return [];
  };

  const handleViewPost = (post: Post) => {
    setViewDialog({
      isOpen: true,
      post: post
    });
  };

  const handleDeletePost = (post: Post) => {
    setDeleteDialog({
      isOpen: true,
      post: post
    });
  };

  const closeViewDialog = () => {
    setViewDialog({ isOpen: false, post: null });
  };

  const confirmDeletePost = async () => {
    if (!deleteDialog.post) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/admin/posts/${deleteDialog.post._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setPosts(posts.filter(post => post._id !== deleteDialog.post!._id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        setDeleteDialog({ isOpen: false, post: null });
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const cancelDeletePost = () => {
    setDeleteDialog({ isOpen: false, post: null });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentText = (content: any): string => {
    if (!content) return 'No content';
    
    // Handle object content structure
    if (typeof content === 'object' && content.text) {
      return content.text;
    }
    
    // Handle string content
    if (typeof content === 'string') {
      return content;
    }
    
    return 'No content';
  };

  const truncateContent = (content: any, maxLength: number = 100) => {
    const textContent = getContentText(content);
    if (textContent === 'No content') return textContent;
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
  };

  if (loading && posts.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Management</h1>
            <p className="mt-2 text-gray-600">Manage posts, content, and user interactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Search Posts</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by content or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Author Type</label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">All Authors</option>
                <option value="player">Players</option>
                <option value="team">Teams</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Post Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">All Status</option>
                <option value="true">Active Posts</option>
                <option value="false">Inactive Posts</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchPosts}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Filter className="inline-block w-4 h-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Post Content
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm || authorFilter || statusFilter 
                            ? 'Try adjusting your search criteria or filters'
                            : 'No posts are currently available in the system'
                          }
                        </p>
                        {(searchTerm || authorFilter || statusFilter) && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setAuthorFilter('');
                              setStatusFilter('');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post._id} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-5">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 font-medium mb-2">
                            {truncateContent(post.content || '')}
                          </p>
                          {(() => {
                            const media = getPostMedia(post);
                            return media.length > 0 && (
                              <div className="flex space-x-2">
                                {media.slice(0, 2).map((item, index) => (
                                  <div key={index} className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                    {item.type === 'video' ? (
                                      <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                      />
                                    ) : (
                                      <img
                                        src={item.url}
                                        alt={`Post media ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">
                                        {item.type === 'video' ? '🎥' : '📷'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {media.length > 2 && (
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-600">+{media.length - 2}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {post.author.profile.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full border-2 border-gray-200"
                                src={post.author.profile.avatar}
                                alt={post.author.profile.displayName}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                                post.author.userType === 'admin' 
                                  ? 'bg-red-500'
                                  : post.author.userType === 'team'
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                              }`}>
                                {post.author.profile.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">
                              {post.author.profile.displayName}
                            </div>
                            <div className="text-sm text-gray-600">@{post.author.username}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                              post.author.userType === 'admin' 
                                ? 'bg-red-100 text-red-800'
                                : post.author.userType === 'team'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {post.author.userType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1 text-red-500" />
                            {Array.isArray(post.likes) ? post.likes.length : 0}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1 text-blue-500" />
                            {Array.isArray(post.comments) ? post.comments.length : 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          post.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {post.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewPost(post)}
                            className="p-2 text-blue-600 hover:bg-blue-100 hover:shadow-md rounded-lg transition-all duration-200"
                            title="View Post Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post)}
                            className="p-2 text-red-600 hover:bg-red-100 hover:shadow-md rounded-lg transition-all duration-200"
                            title="Delete Post"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                  disabled={currentPage === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Showing{' '}
                    <span className="font-bold text-blue-600">{(currentPage - 1) * 10 + 1}</span>
                    {' '}to{' '}
                    <span className="font-bold text-blue-600">
                      {Math.min(currentPage * 10, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-bold text-blue-600">{pagination.total}</span>
                    {' '}posts
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-bold transition-all duration-200 ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-lg'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Post Modal */}
        {viewDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gray-900 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Post Details</h2>
                  </div>
                  <button
                    onClick={closeViewDialog}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[calc(85vh-100px)]">
                {/* Left Side - Main Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {/* Author Info - Compact */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {viewDialog.post?.author.profile.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {viewDialog.post?.author.profile.displayName || 'Unknown User'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            viewDialog.post?.author.userType === 'admin' 
                              ? 'bg-red-100 text-red-700'
                              : viewDialog.post?.author.userType === 'team'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {viewDialog.post?.author.userType?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">@{viewDialog.post?.author.username}</div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content - Very Compact */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="mb-2">
                      <span className="text-gray-600 text-xs font-medium">POST CONTENT</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-900 text-sm leading-normal whitespace-pre-wrap">
                        {getContentText(viewDialog.post?.content)}
                      </p>
                    </div>
                  </div>

                  {/* Post Media - Compact Display */}
                  {(() => {
                    const media = getPostMedia(viewDialog.post!);
                    return media.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="mb-3">
                          <span className="text-gray-600 text-xs font-medium">POST MEDIA</span>
                        </div>
                        <div className="space-y-3">
                          {media.map((item, index) => (
                            <div key={index} className="relative group bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '200px', maxHeight: '350px' }}>
                              {item.type === 'video' ? (
                                <video
                                  src={item.url}
                                  controls
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={`Post media ${index + 1}`}
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                {item.type === 'video' ? '🎥' : '📷'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Right Sidebar - Stats */}
                <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Engagement Stats */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Engagement</h3>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <Heart className="w-3 h-3 text-red-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">Likes</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {viewDialog.post && Array.isArray(viewDialog.post.likes) ? viewDialog.post.likes.length : 0}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">Comments</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {viewDialog.post && Array.isArray(viewDialog.post.comments) ? viewDialog.post.comments.length : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Info */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Post Info</h3>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Status</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              viewDialog.post?.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {viewDialog.post?.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Created</span>
                            <span className="text-xs text-gray-900">
                              {viewDialog.post?.createdAt ? formatDate(viewDialog.post.createdAt) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Media Count</span>
                            <span className="text-xs text-gray-900">
                              {getPostMedia(viewDialog.post!).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={closeViewDialog}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Dialog */}
        {deleteDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Post</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={cancelDeletePost}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Dialog Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Post Content:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {getContentText(deleteDialog.post?.content)}
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Warning: Permanent Deletion
                      </h4>
                      <p className="text-sm text-red-700">
                        Are you sure you want to delete this post? This will permanently remove the post and all its interactions (likes, comments). This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={cancelDeletePost}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeletePost}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    <Trash2 className="inline-block w-4 h-4 mr-2" />
                    Delete Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPosts;

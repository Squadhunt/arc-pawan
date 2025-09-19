import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Trophy, Sparkles, Wifi, WifiOff, ExternalLink, Home, Search, MessageCircle, User, Briefcase, Bell } from 'lucide-react';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import MobileBottomNav from '../components/MobileBottomNav';
import axios from 'axios';
import { connectionManager } from '../utils/connectionManager';
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
    role: 'player' | 'team';
  };
  postType: 'general' | 'recruitment' | 'achievement' | 'looking-for-team';
  likes: Array<{
    user: string;
    likedAt: string;
  }>;
  comments: Array<{
    user: {
      _id: string;
      username: string;
      profilePicture?: string;
    };
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface Tournament {
  _id: string;
  name: string;
  description: string;
  game: string;
  format: string;
  mode?: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: number;
  entryFee: number;
  totalSlots: number;
  teamsPerGroup: number;
  numberOfGroups: number;
  prizePoolType: string;
  participants: any[];
  teams: any[];
  host: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [shuffledPosts, setShuffledPosts] = useState<Post[]>([]);
  const [postsShuffled, setPostsShuffled] = useState(false);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const isConnected = await connectionManager.checkConnection(`${config.apiUrl}/api/health`);
      if (isConnected) {
        setServerStatus('connected');
      } else {
        setServerStatus('disconnected');
      }
    } catch (error) {
      setServerStatus('disconnected');
    }
  };




  // Handle scroll behavior for sidebars
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 64); // Start locking after 64px scroll
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/users?limit=4');
      const users = response.data?.data?.users || [];
      // Filter out current user and already followed users
      const filteredUsers = users.filter((suggestedUser: any) => 
        suggestedUser._id !== user?._id && 
        !user?.following?.includes(suggestedUser._id)
      );
      setSuggestions(filteredUsers.slice(0, 4));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('/api/notifications?limit=5');
      if (response.data?.success) {
        setRecentActivity(response.data.data.notifications || []);
      } else {
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchOngoingTournaments = async () => {
    try {
      // Fetch tournaments from all categories and statuses
      const response = await axios.get('/api/tournaments?limit=20');
      if (response.data?.success) {
        const allTournaments = response.data.data.tournaments || [];
        
        // Filter for active tournaments (Ongoing, Registration Open, Upcoming)
        const activeTournaments = allTournaments.filter((tournament: Tournament) => 
          ['Ongoing', 'Registration Open', 'Upcoming'].includes(tournament.status)
        );
        
        // Shuffle and take 2-3 random tournaments from all categories
        const shuffled = [...activeTournaments].sort(() => Math.random() - 0.5);
        setOngoingTournaments(shuffled.slice(0, 3));
      } else {
        setOngoingTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setOngoingTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  };

  // Smart feed algorithm that prioritizes followed users with time decay (no randomization)
  const getSmartFeedPosts = useCallback((posts: Post[]) => {
    if (!posts || posts.length === 0) return [];
    
    const now = new Date();
    const followedPosts: Post[] = [];
    const otherPosts: Post[] = [];
    
    // Separate posts from followed users and others
    posts.forEach(post => {
      if (user?.following?.includes(post.author._id)) {
        followedPosts.push(post);
      } else {
        otherPosts.push(post);
      }
    });
    
    // Sort followed posts by recency (newest first)
    followedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Separate recent followed posts (last 24 hours) from older ones
    const recentFollowedPosts = followedPosts.filter(post => {
      const postTime = new Date(post.createdAt).getTime();
      const hoursAgo = (now.getTime() - postTime) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });
    
    const olderFollowedPosts = followedPosts.filter(post => {
      const postTime = new Date(post.createdAt).getTime();
      const hoursAgo = (now.getTime() - postTime) / (1000 * 60 * 60);
      return hoursAgo > 24;
    });
    
    // Sort other posts by recency (newest first)
    otherPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Mix posts with priority order (no randomization)
    const mixedPosts: Post[] = [];
    
    // First, add recent followed posts (up to 3)
    const recentToShow = Math.min(3, recentFollowedPosts.length);
    mixedPosts.push(...recentFollowedPosts.slice(0, recentToShow));
    
    // Then add remaining recent followed posts
    mixedPosts.push(...recentFollowedPosts.slice(recentToShow));
    
    // Then add older followed posts
    mixedPosts.push(...olderFollowedPosts);
    
    // Finally, add other posts
    mixedPosts.push(...otherPosts);
    
    return mixedPosts;
  }, [user?.following]);
  
  // Shuffle function that only runs on initial load/refresh
  const shufflePosts = useCallback((posts: Post[]) => {
    const shuffled = [...posts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);
  
  // Function to refresh and re-shuffle posts
  const refreshPosts = useCallback(() => {
    if (posts.length > 0) {
      const smartFeed = getSmartFeedPosts(posts);
      const shuffled = shufflePosts(smartFeed);
      setShuffledPosts(shuffled);
    }
  }, [posts, getSmartFeedPosts, shufflePosts]);
  
  // Use shuffled posts if available, otherwise use regular posts
  const smartFeedPosts = postsShuffled ? shuffledPosts : (posts || []);

  const fetchPosts = useCallback(async (retryCount = 0, page = 1, append = false) => {
    try {
      console.log('Fetching posts...', retryCount > 0 ? `(Retry ${retryCount})` : '', `Page: ${page}`);
      const response = await axios.get(`/api/posts?page=${page}&limit=10`);
      console.log('Posts response:', response.data);
      
      if (response.data?.success) {
        const postsData = response.data.data?.posts || [];
        const pagination = response.data.data?.pagination;
        console.log('Posts data:', postsData);
        
        if (append) {
          setPosts(prevPosts => [...prevPosts, ...postsData]);
          // Append new posts to shuffled posts without re-shuffling
          setShuffledPosts(prevShuffled => [...prevShuffled, ...postsData]);
        } else {
          setPosts(postsData);
          // Apply smart feed algorithm and shuffle only on initial load
          const smartFeed = getSmartFeedPosts(postsData);
          const shuffled = shufflePosts(smartFeed);
          setShuffledPosts(shuffled);
          setPostsShuffled(true);
        }
        
        setHasMorePosts(pagination?.current < pagination?.total);
        setCurrentPage(page);
      } else {
        console.error('Posts API returned error:', response.data);
        if (!append) {
          setPosts([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      
      // Retry logic for network errors
      if (retryCount < 3 && (error.code === 'ERR_NETWORK' || error.response?.status >= 500)) {
        console.log(`Retrying posts fetch in 2 seconds... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchPosts(retryCount + 1, page, append);
        }, 2000);
        return;
      }
      
      if (!append) {
        setPosts([]);
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [getSmartFeedPosts, shufflePosts]);

  useEffect(() => {
    console.log('Dashboard useEffect - authLoading:', authLoading, 'user:', user);
    if (!authLoading) {
      checkServerStatus();
      fetchPosts();
      fetchSuggestions();
      fetchRecentActivity();
      fetchOngoingTournaments();
    }
  }, [authLoading, fetchPosts]);

  // Load more posts when load more ref is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loadingMore && !loading) {
          setLoadingMore(true);
          fetchPosts(0, currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef) {
      observer.observe(loadMoreRef);
    }

    return () => {
      if (loadMoreRef) {
        observer.unobserve(loadMoreRef);
      }
    };
  }, [loadMoreRef, hasMorePosts, loadingMore, loading, currentPage, fetchPosts]);

  const formatActivityTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return activityDate.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return <Users className="h-4 w-4 text-white" />;
      case 'message':
        return '📨';
      case 'tournament':
        return <Trophy className="h-4 w-4 text-white" />;
      default:
        return '🔔';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'from-success-500/10 to-success-600/10 border-success-500/20';
      case 'comment':
        return 'from-blue-500/10 to-blue-600/10 border-blue-500/20';
      case 'follow':
        return 'from-primary-500/10 to-primary-600/10 border-primary-500/20';
      case 'message':
        return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
      case 'tournament':
        return 'from-accent-500/10 to-accent-600/10 border-accent-500/20';
      default:
        return 'from-secondary-500/10 to-secondary-600/10 border-secondary-500/20';
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
            <motion.div 
              className="h-8 bg-gray-800 rounded-lg w-1/4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
              <div className="lg:col-span-3">
                <motion.div 
                  className="h-80 bg-gray-900 rounded-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                />
              </div>
              <div className="lg:col-span-6">
                <motion.div 
                  className="h-16 bg-gray-900 rounded-lg mb-6"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <div className="space-y-6">
                  <motion.div 
                    className="h-64 bg-gray-900 rounded-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.div 
                    className="h-64 bg-gray-900 rounded-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <motion.div 
                  className="h-64 bg-gray-900 rounded-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-20 lg:pb-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-1 lg:py-8 relative z-10">
        
        {/* Server Status Indicator */}
        {serverStatus !== 'connected' && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className={`flex items-center space-x-3 p-4 rounded-lg border ${
              serverStatus === 'checking' 
                ? 'bg-yellow-900/20 border-yellow-500/30' 
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              {serverStatus === 'checking' ? (
                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              <span className={`font-semibold ${
                serverStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {serverStatus === 'checking' ? 'Connecting to server...' : 'Server connection lost'}
              </span>
              {serverStatus === 'disconnected' && (
                <button 
                  onClick={checkServerStatus}
                  className="ml-auto text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-all duration-200"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-6 max-w-7xl mx-auto">
                     {/* Left Sidebar */}
           <div className="lg:col-span-3 order-2 lg:order-1">
             <div className={`sticky space-y-4 hidden lg:block transition-all duration-500 ease-in-out z-10 ${
               isScrolled ? 'top-16' : 'top-24'
             }`}>

              {/* Recent Activity Card */}
              <AnimatedCard className="p-6" variant="elevated">
                <h4 className="font-semibold text-white text-lg mb-4 text-center">Recent Activity</h4>
                {activityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm">
                        <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded animate-pulse w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity._id} className={`flex items-center space-x-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm hover:bg-gray-800/80 transition-colors duration-200`}>
                        <div className={`w-8 h-8 ${
                          activity.type === 'like' ? 'bg-green-600' :
                          activity.type === 'comment' ? 'bg-gray-700' :
                          activity.type === 'follow' ? 'bg-gray-700' :
                          activity.type === 'message' ? 'bg-indigo-600' :
                          activity.type === 'tournament' ? 'bg-indigo-600' :
                          'bg-gray-600'
                        } rounded-full flex items-center justify-center shadow-sm border border-gray-600/30`}>
                          {typeof getActivityIcon(activity.type) === 'string' ? (
                            <span className="text-white text-sm">{getActivityIcon(activity.type)}</span>
                          ) : (
                            getActivityIcon(activity.type)
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-white">{activity.message}</span>
                          <div className="text-xs text-gray-400">{formatActivityTime(activity.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-700">
                      <span className="text-xl">🔔</span>
                    </div>
                    <p className="text-gray-300 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-1">Start interacting to see activity here</p>
                  </div>
                )}
                <AnimatedButton
                  onClick={() => window.location.href = '/notifications'}
                  variant="secondary"
                  className="w-full mt-4"
                >
                  View All Activity
                </AnimatedButton>
              </AnimatedCard>



            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 order-1 lg:order-2">

            {/* Posts */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i} 
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      <motion.div 
                        className="w-12 h-12 bg-gray-700 rounded-lg"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                      <div className="flex-1">
                        <motion.div 
                          className="h-4 bg-gray-700 rounded w-1/3 mb-2"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.1 }}
                        />
                        <motion.div 
                          className="h-3 bg-gray-700 rounded w-1/4"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.2 }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <motion.div 
                        className="h-4 bg-gray-700 rounded"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.3 }}
                      />
                      <motion.div 
                        className="h-4 bg-gray-700 rounded w-3/4"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.4 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : smartFeedPosts.length > 0 ? (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence>
                  {smartFeedPosts.map((post, index) => {
                    console.log('Rendering post:', post);
                    return (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        layout
                      >
                        <PostCard post={post} onUpdate={fetchPosts} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {/* Load More Indicator */}
                {hasMorePosts && (
                  <div ref={setLoadMoreRef} className="flex justify-center py-8">
                    {loadingMore ? (
                      <motion.div 
                        className="flex items-center space-x-2 text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div 
                          className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Loading more posts...</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="text-gray-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Scroll down to load more
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="bg-gray-900 border border-gray-800 rounded-lg p-12 shadow-sm text-center"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6 border border-gray-700">
                  <Sparkles className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">No posts found</h3>
                <p className="text-gray-400 mb-8">
                  Be the first to create a post!
                </p>
                <AnimatedButton
                  onClick={() => setIsCreatePostModalOpen(true)}
                  variant="secondary"
                  size="lg"
                  icon={<Plus size={20} />}
                  className="inline-flex items-center space-x-3"
                >
                  Create Post
                </AnimatedButton>
              </motion.div>
            )}
          </div>

                     {/* Right Sidebar */}
           <div className="lg:col-span-3 order-3">
             <div className={`sticky space-y-4 hidden lg:block transition-all duration-500 ease-in-out z-10 ${
               isScrolled ? 'top-16' : 'top-24'
             }`}>
                             {/* Suggestions */}
               <AnimatedCard className="p-3" variant="elevated">
                 <h4 className="font-semibold text-white mb-4 flex items-center space-x-3">
                   <Users className="h-6 w-6 text-gray-400" />
                   <span>Suggestions</span>
                 </h4>
                 {suggestionsLoading ? (
                   <div className="space-y-3">
                     {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm animate-pulse">
                          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-700 rounded w-2/3 mb-1"></div>
                            <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                     ))}
                   </div>
                 ) : suggestions.length > 0 ? (
                   <div className="space-y-3">
                     {suggestions.map((suggestedUser) => (
                       <div key={suggestedUser._id} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 group cursor-pointer">
                         <Link to={`/profile/${suggestedUser._id}`} className="flex items-center space-x-3 flex-1">
                           <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                             <span className="text-white text-xs font-semibold">
                               {suggestedUser.username?.charAt(0).toUpperCase()}
                             </span>
                           </div>
                           <div>
                             <span className="text-sm font-semibold text-white">{suggestedUser.username}</span>
                             <div className="text-xs text-gray-400 capitalize">{suggestedUser.userType || 'player'}</div>
                           </div>
                         </Link>
                         <button 
                           onClick={async () => {
                             try {
                               await axios.post(`/api/users/${suggestedUser._id}/follow`);
                               fetchSuggestions(); // Refresh suggestions
                             } catch (error) {
                               console.error('Error following user:', error);
                             }
                           }}
                           className="text-gray-400 hover:text-white transition-colors duration-200"
                         >
                           <Users className="h-4 w-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <motion.div 
                     className="text-center py-6"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.5 }}
                   >
                     <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-700">
                       <Users className="h-6 w-6 text-gray-400" />
                     </div>
                     <h4 className="font-semibold text-white mb-2">No suggestions</h4>
                     <p className="text-sm text-gray-400">You're following everyone!</p>
                   </motion.div>
                 )}
               </AnimatedCard>

              {/* Featured Events */}
              <AnimatedCard className="p-6" variant="elevated">
                <h4 className="font-semibold text-white mb-4 flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-gray-400" />
                  <span>Featured Events</span>
                </h4>
                {tournamentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm animate-pulse">
                         <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                         <div className="flex-1">
                           <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
                           <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                         </div>
                       </div>
                    ))}
                  </div>
                ) : ongoingTournaments.length > 0 ? (
                  <div className="space-y-3">
                    {ongoingTournaments.map((tournament) => (
                      <Link 
                        key={tournament._id} 
                        to={`/tournament/${tournament._id}`}
                        className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors duration-200 cursor-pointer group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tournament.status === 'Ongoing' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                          tournament.status === 'Registration Open' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                          'bg-gradient-to-br from-yellow-500 to-orange-600'
                        }`}>
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                            {tournament.name}
                          </h5>
                          <p className="text-xs text-gray-400 truncate">
                            {tournament.game} • {tournament.format}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              tournament.status === 'Ongoing' ? 'bg-green-900/30 text-green-400' :
                              tournament.status === 'Registration Open' ? 'bg-blue-900/30 text-blue-400' :
                              'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {tournament.status}
                            </span>
                            {tournament.prizePool > 0 && (
                              <span className="text-xs text-gray-500">
                                ₹{tournament.prizePool.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <AnimatedButton
                      onClick={() => window.location.href = '/tournaments'}
                      variant="secondary"
                      className="w-full mt-4"
                      icon={<ExternalLink className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      View More
                    </AnimatedButton>
                  </div>
                ) : (
                  <motion.div 
                    className="text-center py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                     <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-700">
                       <Trophy className="h-6 w-6 text-gray-400" />
                     </div>
                    <h4 className="font-semibold text-white mb-2">No ongoing tournaments</h4>
                    <p className="text-sm text-gray-400">Check back later for new events!</p>
                    <AnimatedButton
                      onClick={() => window.location.href = '/tournaments'}
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      icon={<ExternalLink className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      Browse Tournaments
                    </AnimatedButton>
                  </motion.div>
                )}
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={fetchPosts}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating Action Button - Desktop Only */}
      <motion.button
        onClick={() => setIsCreatePostModalOpen(true)}
        className="hidden lg:block floating-action-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default Dashboard;

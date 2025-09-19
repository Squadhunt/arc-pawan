import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  Activity, 
  Server, 
  TrendingUp,
  Clock,
  AlertCircle,
  Eye,
  UserPlus,
  FileText,
  Calendar
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import config from '../config/config';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalMessages: number;
    totalTournaments: number;
    totalNotifications: number;
    activeUsers: number;
    newUsersToday: number;
    newPostsToday: number;
    newTournamentsToday: number;
  };
  breakdowns: {
    userTypes: Array<{ _id: string; count: number }>;
    postTypes: Array<{ _id: string; count: number }>;
    tournamentStatuses: Array<{ _id: string; count: number }>;
  };
  server: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    timestamp: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('AdminDashboard: Fetching dashboard data with token:', !!token);
      
      const response = await fetch(`${config.apiUrl}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('AdminDashboard: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('AdminDashboard: Response data:', data);
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('AdminDashboard: Error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-red-600">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">Monitor your gaming platform performance and activity</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.overview.totalUsers}</p>
                <p className="text-xs text-green-600">+{stats?.overview.newUsersToday} today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.overview.totalPosts}</p>
                <p className="text-xs text-green-600">+{stats?.overview.newPostsToday} today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tournaments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.overview.totalTournaments}</p>
                <p className="text-xs text-green-600">+{stats?.overview.newTournamentsToday} today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.overview.activeUsers}</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-6 w-6 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Messages</p>
                <p className="text-xl font-semibold text-gray-900">{stats?.overview.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Notifications</p>
                <p className="text-xl font-semibold text-gray-900">{stats?.overview.totalNotifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Server className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Server Uptime</p>
                <p className="text-xl font-semibold text-gray-900">{formatUptime(stats?.server.uptime || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Types & Tournament Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Types</h3>
            <div className="space-y-3">
              {stats?.breakdowns.userTypes && stats.breakdowns.userTypes.length > 0 ? (
                stats.breakdowns.userTypes.map((type) => (
                  <div key={type._id} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{type._id}s</span>
                    <span className="font-medium">{type.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No user data available</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Status</h3>
            <div className="space-y-3">
              {stats?.breakdowns.tournamentStatuses && stats.breakdowns.tournamentStatuses.length > 0 ? (
                stats.breakdowns.tournamentStatuses.map((status) => (
                  <div key={status._id} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{status._id}</span>
                    <span className="font-medium">{status.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No tournaments available</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserPlus className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium">View All Users</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm font-medium">Manage Posts</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="text-sm font-medium">Tournament Management</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

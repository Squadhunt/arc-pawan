import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Trash2,
  Eye,
  Edit,
  AlertTriangle,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import config from '../config/config';

interface User {
  _id: string;
  username: string;
  email: string;
  userType: 'player' | 'team' | 'admin';
  profile: {
    displayName: string;
    avatar: string;
  };
  isActive: boolean;
  createdAt: string;
  lastSeen: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, userTypeFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(userTypeFilter && { userType: userTypeFilter }),
        ...(statusFilter && { isActive: statusFilter })
      });

      const response = await fetch(`${config.apiUrl}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        ));
      } else {
        alert('Failed to update user status');
      }
    } catch (err) {
      alert('Error updating user status');
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({
      isOpen: true,
      user: user
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/admin/users/${deleteDialog.user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(users.filter(user => user._id !== deleteDialog.user!._id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        setDeleteDialog({ isOpen: false, user: null });
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const cancelDeleteUser = () => {
    setDeleteDialog({ isOpen: false, user: null });
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

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">Manage users, teams, and administrators</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">User Type</label>
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">All User Types</option>
                <option value="player">Players</option>
                <option value="team">Teams</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Account Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">All Status</option>
                <option value="true">Active Users</option>
                <option value="false">Inactive Users</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchUsers}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Filter className="inline-block w-4 h-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    User Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Account Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <UserX className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm || userTypeFilter || statusFilter 
                            ? 'Try adjusting your search criteria or filters'
                            : 'No users are currently registered in the system'
                          }
                        </p>
                        {(searchTerm || userTypeFilter || statusFilter) && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setUserTypeFilter('');
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
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {user.profile.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full border-2 border-gray-200"
                                src={user.profile.avatar}
                                alt={user.profile.displayName}
                              />
                            ) : (
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                user.userType === 'admin' 
                                  ? 'bg-red-500'
                                  : user.userType === 'team'
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                              }`}>
                                {user.profile.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {user.profile.displayName}
                            </div>
                            <div className="text-sm text-gray-600">@{user.username}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.userType === 'admin' 
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : user.userType === 'team'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {user.userType === 'admin' ? 'Administrator' : 
                           user.userType === 'team' ? 'Team' : 'Player'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {user.lastSeen ? formatDate(user.lastSeen) : 'Never'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              user.isActive 
                                ? 'text-red-600 hover:bg-red-100 hover:shadow-md' 
                                : 'text-green-600 hover:bg-green-100 hover:shadow-md'
                            }`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-600 hover:bg-red-100 hover:shadow-md rounded-lg transition-all duration-200"
                            title="Delete User"
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
                    {' '}users
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
      </div>

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
                  <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={cancelDeleteUser}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-lg font-bold text-gray-600">
                    {deleteDialog.user?.profile.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {deleteDialog.user?.profile.displayName}
                  </h4>
                  <p className="text-sm text-gray-600">@{deleteDialog.user?.username}</p>
                  <p className="text-xs text-gray-500">{deleteDialog.user?.email}</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-1">
                      Warning: Permanent Deletion
                    </h4>
                    <p className="text-sm text-red-700">
                      Are you sure you want to delete this user? This will permanently remove all their data including posts, messages, and profile information. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteUser}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <Trash2 className="inline-block w-4 h-4 mr-2" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;

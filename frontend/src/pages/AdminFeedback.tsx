import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Filter,
  Search,
  RefreshCw,
  Star,
  Calendar,
  User,
  X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import config from '../config/config';

interface Feedback {
  _id: string;
  feedback: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'addressed';
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  pending: number;
  reviewed: number;
  addressed: number;
  recent: number;
}

const AdminFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`${config.apiUrl}/api/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.data.feedback);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        console.error('Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/feedback/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [currentPage, statusFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/feedback/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes
        }),
      });

      if (response.ok) {
        await fetchFeedback();
        await fetchStats();
        setShowModal(false);
        setAdminNotes('');
        setSelectedFeedback(null);
      } else {
        console.error('Failed to update feedback status');
      }
    } catch (error) {
      console.error('Error updating feedback status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchFeedback();
        await fetchStats();
      } else {
        console.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const openModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.adminNotes || '');
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-300 shadow-sm';
      case 'reviewed': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 shadow-sm';
      case 'addressed': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-400 shadow-sm';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'addressed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredFeedback = feedback.filter(item =>
    item.feedback.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
          <p className="text-gray-600">Manage user feedback and suggestions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-blue-700">Total</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg shadow p-4 border border-yellow-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-yellow-700">Pending</p>
                  <p className="text-xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow p-4 border border-indigo-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-indigo-700">Reviewed</p>
                  <p className="text-xl font-bold text-indigo-900">{stats.reviewed}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow p-4 border border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-green-700">Addressed</p>
                  <p className="text-xl font-bold text-green-900">{stats.addressed}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg shadow p-4 border border-purple-200">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-purple-700">Recent (7d)</p>
                  <p className="text-xl font-bold text-purple-900">{stats.recent}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg shadow-lg mb-4 p-4 border border-gray-300">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-white to-blue-50 text-sm shadow-md hover:shadow-lg font-medium text-gray-700 cursor-pointer"
                >
                  <option value="all" className="bg-white text-gray-800">All Status</option>
                  <option value="pending" className="bg-yellow-50 text-yellow-800">Pending</option>
                  <option value="reviewed" className="bg-blue-50 text-blue-800">Reviewed</option>
                  <option value="addressed" className="bg-green-50 text-green-800">Addressed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchFeedback();
                  fetchStats();
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 transition-all duration-200 text-sm shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-300">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600">Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No feedback found</p>
              <p className="text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((item) => (
                <div key={item._id} className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-400">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1 capitalize">{item.status}</span>
                        </span>
                        <div className="flex items-center text-xs text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-full border border-gray-300">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-900 mb-3 text-sm leading-relaxed line-clamp-2 font-medium">{item.feedback}</p>
                      {item.adminNotes && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 p-3 rounded-lg shadow-sm">
                          <p className="text-xs text-gray-700">
                            <strong className="text-yellow-800">Admin Notes:</strong> {item.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-md border border-blue-200 hover:border-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:shadow-md border border-red-200 hover:border-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Feedback Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{selectedFeedback.feedback}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedFeedback.status}
                      onChange={(e) => setSelectedFeedback({...selectedFeedback, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="addressed">Addressed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedFeedback._id, selectedFeedback.status)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
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

export default AdminFeedback;

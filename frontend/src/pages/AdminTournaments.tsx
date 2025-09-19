import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Calendar, Users, Trophy, Search, Filter, Plus, DollarSign } from 'lucide-react';
import config from '../config/config';
import AdminLayout from '../components/AdminLayout';

interface Tournament {
  _id: string;
  name: string;
  description: string;
  game: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  participants: any[];
  prizePool: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Registration Open';
  isActive: boolean;
  host: {
    _id: string;
    username: string;
    profile: {
      displayName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const AdminTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 10
  });

  // View tournament dialog
  const [viewDialog, setViewDialog] = useState<{
    isOpen: boolean;
    tournament: Tournament | null;
  }>({
    isOpen: false,
    tournament: null
  });

  // Delete tournament dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    tournament: Tournament | null;
  }>({
    isOpen: false,
    tournament: null
  });

  // Delete confirmation text
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`${config.apiUrl}/api/admin/tournaments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }

      const data = await response.json();
      setTournaments(data.tournaments || []);
      setPagination(data.pagination || { total: 0, pages: 0, currentPage: 1, limit: 10 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [currentPage, searchTerm, statusFilter]);

  const handleViewTournament = (tournament: Tournament) => {
    setViewDialog({
      isOpen: true,
      tournament: tournament
    });
  };

  const handleDeleteTournament = (tournament: Tournament) => {
    setDeleteDialog({
      isOpen: true,
      tournament: tournament
    });
  };

  const confirmDeleteTournament = async () => {
    if (!deleteDialog.tournament || deleteConfirmationText !== 'DELETE') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/api/admin/tournaments/${deleteDialog.tournament._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tournament');
      }

      await fetchTournaments();
      setDeleteDialog({ isOpen: false, tournament: null });
      setDeleteConfirmationText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
    }
  };

  const closeViewDialog = () => {
    setViewDialog({ isOpen: false, tournament: null });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, tournament: null });
    setDeleteConfirmationText('');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Ongoing': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Registration Open': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl font-bold">Tournament Management</h1>
            </div>
            <p className="text-blue-100 text-lg">Manage tournaments and view comprehensive analytics</p>
          </div>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 border border-white border-opacity-30 hover:scale-105">
            <Plus className="w-5 h-5" />
            <span>Add Tournament</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Search Tournaments</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, game, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Registration Open">Registration Open</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchTournaments}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Filter className="w-5 h-5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tournaments Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tournament
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Prize Pool
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tournaments.map((tournament) => (
                <tr key={tournament._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{tournament.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {tournament.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">{tournament.game.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{tournament.game}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {tournament.participants.length}/{tournament.totalSlots}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-gray-900">${tournament.prizePool.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{formatDate(tournament.startDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewTournament(tournament)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(tournament)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}tournaments
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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

      {/* View Tournament Modal */}
      {viewDialog.isOpen && viewDialog.tournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">Tournament Details</h2>
                </div>
                <button
                  onClick={closeViewDialog}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Tournament Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{viewDialog.tournament.name}</h3>
                      <p className="text-gray-600 text-lg">{viewDialog.tournament.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(viewDialog.tournament.status)}`}>
                      {viewDialog.tournament.status}
                    </span>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">{formatDate(viewDialog.tournament.startDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Management Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tournament Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Tournament Details</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Game:</span>
                        <span className="font-bold text-gray-900">{viewDialog.tournament.game}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Prize Pool:</span>
                        <span className="font-bold text-green-600">${viewDialog.tournament.prizePool.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Slots:</span>
                        <span className="font-bold text-gray-900">{viewDialog.tournament.totalSlots}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Current Participants:</span>
                        <span className="font-bold text-blue-600">{viewDialog.tournament.participants.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Host:</span>
                        <span className="font-bold text-gray-900">{viewDialog.tournament.host?.username || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Participation Analytics */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Participation</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {Math.round((viewDialog.tournament.participants.length / viewDialog.tournament.totalSlots) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Filled Slots</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${(viewDialog.tournament.participants.length / viewDialog.tournament.totalSlots) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{viewDialog.tournament.participants.length} participants</span>
                        <span>{viewDialog.tournament.totalSlots} total slots</span>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Timeline */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Timeline</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Start Date:</span>
                        <span className="font-bold text-gray-900">{formatDate(viewDialog.tournament.startDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">End Date:</span>
                        <span className="font-bold text-gray-900">{formatDate(viewDialog.tournament.endDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Created:</span>
                        <span className="font-bold text-gray-900">{formatDate(viewDialog.tournament.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Last Updated:</span>
                        <span className="font-bold text-gray-900">{formatDate(viewDialog.tournament.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Admin Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Manage Participants</span>
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                      <Trophy className="w-4 h-4" />
                      <span>Update Results</span>
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Matches</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={closeViewDialog}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deleteDialog.isOpen && deleteDialog.tournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border-2 border-gray-600">
            {/* Header */}
            <div className="bg-gray-700 px-6 py-4 rounded-t-xl border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Delete Tournament</h3>
                <button
                  onClick={closeDeleteDialog}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Permanent Deletion</h4>
                  <p className="text-gray-300 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white text-sm mb-2">
                  This will permanently delete the tournament and <span className="font-bold text-red-400">ALL</span> its data.
                </p>
                <p className="text-gray-300 text-sm mb-4">
                  Type <span className="font-bold text-white">"DELETE"</span> to confirm:
                </p>
                
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteDialog}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTournament}
                  disabled={deleteConfirmationText !== 'DELETE'}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    deleteConfirmationText === 'DELETE'
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  OK
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

export default AdminTournaments;

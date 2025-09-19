import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface MatchScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    _id: string;
    groups: Array<{
      _id?: string;
      name: string;
      round: number;
      participants: any[];
    }>;
    scheduleConfig?: {
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        isActive: boolean;
      }>;
      availableDates: Array<{
        date: string;
        isActive: boolean;
        maxMatches: number;
      }>;
      defaultMatchDuration: number;
      timezone: string;
    };
  };
  match?: {
    _id?: string;
    round: number;
    groupId: string;
    groupName: string;
    team1?: any;
    team2?: any;
    scheduledTime: string;
    scheduledDate?: string;
    scheduledTimeString?: string;
    matchDuration: number;
    venue: string;
    description: string;
    status?: string;
  } | null;
  onSave: (matchData: any) => void;
}

const MatchScheduleModal: React.FC<MatchScheduleModalProps> = ({
  isOpen,
  onClose,
  tournament,
  match = null,
  onSave
}) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (match) {
        // Edit mode - populate form with existing match data
        const matchDate = match.scheduledTime ? new Date(match.scheduledTime).toISOString().split('T')[0] : '';
        const matchTime = match.scheduledTime ? new Date(match.scheduledTime).toTimeString().split(' ')[0].substring(0, 5) : '';
        
        setFormData({
          scheduledDate: matchDate,
          scheduledTime: matchTime
        });
      } else {
        // Create mode - set default values
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData({
          scheduledDate: tomorrow.toISOString().split('T')[0],
          scheduledTime: '10:00'
        });
      }
      setError('');
    }
  }, [isOpen, match]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create scheduled time from date and time
      const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      
      const matchData = {
        scheduledTime: scheduledTime,
        scheduledDate: formData.scheduledDate,
        scheduledTimeString: formData.scheduledTime
      };

      if (match) {
        // Update existing match
        await axios.put(`/api/tournaments/${tournament._id}/schedule/${match._id}`, matchData);
      } else {
        // Create new match (this shouldn't happen in current flow)
        console.warn('Creating new match from MatchScheduleModal - this should be handled by RoundScheduleModal');
      }

      onSave(matchData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update match');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-400" />
            Edit Match
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Schedule Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Update Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchScheduleModal;
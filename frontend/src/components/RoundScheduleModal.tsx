import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Save, AlertCircle, Target } from 'lucide-react';
import axios from 'axios';

interface RoundScheduleModalProps {
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
    totalRounds: number;
  };
  round: number;
  onSave: (scheduleData: any) => void;
}

const RoundScheduleModal: React.FC<RoundScheduleModalProps> = ({
  isOpen,
  onClose,
  tournament,
  round,
  onSave
}) => {
  const [formData, setFormData] = useState({
    round: round,
    numberOfMatches: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupMatches, setGroupMatches] = useState<Record<string, any[]>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Load existing schedule for edit mode
  const loadExistingSchedule = async () => {
    try {
      const response = await axios.get(`/api/tournaments/${tournament._id}/schedule?round=${round}`);
      const scheduleData = response.data.data.schedule || {};
      
      if (Object.keys(scheduleData).length > 0) {
        setIsEditMode(true);
        
        // Group matches by group name
        const matchesByGroup: Record<string, any[]> = {};
        Object.values(scheduleData).flat().forEach((match: any) => {
          const groupName = match.groupName;
          if (!matchesByGroup[groupName]) {
            matchesByGroup[groupName] = [];
          }
          matchesByGroup[groupName].push(match);
        });
        
        setGroupMatches(matchesByGroup);
        
        // Set numberOfMatches to the maximum number of matches in any group
        const maxMatches = Math.max(...Object.values(matchesByGroup).map(matches => matches.length));
        setFormData(prev => ({
          ...prev,
          numberOfMatches: maxMatches
        }));
      } else {
        setIsEditMode(false);
        generateGroupMatches(1);
      }
    } catch (err) {
      console.error('Failed to load existing schedule:', err);
      setIsEditMode(false);
      generateGroupMatches(1);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        round: round,
        numberOfMatches: 1
      });
      
      loadExistingSchedule();
      setError('');
    }
  }, [isOpen, round, tournament.groups]);

  // Generate matches for all groups when numberOfMatches changes
  useEffect(() => {
    generateGroupMatches(formData.numberOfMatches);
  }, [formData.numberOfMatches]);

  const generateGroupMatches = (numberOfMatches: number) => {
    const newGroupMatches: Record<string, any[]> = {};
    
    // Filter groups by current round
    const roundGroups = tournament.groups.filter(group => group.round === round);
    
    roundGroups.forEach((group) => {
      const groupId = group._id || group.name;
      const matches = [];
      
      for (let i = 1; i <= numberOfMatches; i++) {
        matches.push({
          id: i,
          groupId: groupId,
          groupName: group.name,
          scheduledTime: '', // Will be filled by user
          scheduledDate: '', // Will be filled by user
          scheduledTimeString: '', // Will be filled by user
          description: `Round ${round} - ${group.name} - Match ${i}`
        });
      }
      
      newGroupMatches[groupId] = matches;
    });
    
    setGroupMatches(newGroupMatches);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that we have at least one match per group
    const totalMatches = Object.values(groupMatches).reduce((sum, matches) => sum + matches.length, 0);
    if (totalMatches === 0) {
      setError('Please add at least one match to any group');
      return;
    }
    
    try {
      setLoading(true);
      setError('');

      if (isEditMode) {
        // Delete existing matches for this round first
        await axios.delete(`/api/tournaments/${tournament._id}/schedule/round/${formData.round}`);
      }

      // Create/Update schedule for each group
      for (const [groupId, matches] of Object.entries(groupMatches)) {
        if (matches.length > 0) {
          const scheduleData = {
            round: formData.round,
            groupId: groupId,
            matches: matches.map((match: any) => ({
              // If no date/time provided, use current time as placeholder
              scheduledTime: match.scheduledTime || new Date().toISOString(),
              scheduledDate: match.scheduledDate || new Date().toISOString().split('T')[0],
              scheduledTimeString: match.scheduledTimeString || new Date().toTimeString().split(' ')[0].substring(0, 5),
              matchDuration: 30, // Default duration
              venue: 'Online', // Default venue
              description: match.description
            }))
          };

          await axios.post(`/api/tournaments/${tournament._id}/schedule`, scheduleData);
        }
      }

      onSave({ 
        round: formData.round, 
        totalMatches: totalMatches,
        groups: tournament.groups.filter(group => group.round === round).length,
        isEdit: isEditMode
      });
      onClose();
    } catch (err: any) {
      console.error('Schedule creation/update error:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} schedule. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMatchToGroup = (groupId: string) => {
    const group = tournament.groups.find(g => (g._id || g.name) === groupId && g.round === round);
    if (!group) return;

    const currentMatches = groupMatches[groupId] || [];
    const newMatch = {
      id: currentMatches.length + 1,
      groupId: groupId,
      groupName: group.name,
      scheduledTime: '', // Will be filled by user
      scheduledDate: '', // Will be filled by user
      scheduledTimeString: '', // Will be filled by user
      description: `Round ${round} - ${group.name} - Match ${currentMatches.length + 1}`
    };

    setGroupMatches(prev => ({
      ...prev,
      [groupId]: [...currentMatches, newMatch]
    }));
  };

  const removeMatchFromGroup = (groupId: string, matchId: number) => {
    setGroupMatches(prev => ({
      ...prev,
      [groupId]: prev[groupId].filter((match: any) => match.id !== matchId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Target className={`h-5 w-5 mr-2 ${isEditMode ? 'text-blue-400' : 'text-green-400'}`} />
            {isEditMode ? `Edit Round ${round} Schedule` : `Create Round ${round} Schedule`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* Simple Settings */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Matches per Group
                </label>
                <input
                  type="number"
                  value={formData.numberOfMatches}
                  onChange={(e) => handleInputChange('numberOfMatches', parseInt(e.target.value) || 1)}
                  className="w-20 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
                  min="1"
                  max="20"
                />
              </div>
              <div className="text-sm text-gray-400">
                {tournament.groups.filter(group => group.round === round).length} groups • {formData.numberOfMatches * tournament.groups.filter(group => group.round === round).length} total matches
              </div>
            </div>
          </div>

          {/* Groups and Matches */}
          <div className="space-y-3">
            {tournament.groups.filter(group => group.round === round).map((group, index) => {
              const groupId = group._id || group.name;
              const matches = groupMatches[groupId] || [];
              
              return (
                <div key={groupId} className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-400" />
                      {group.name}
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addMatchToGroup(groupId)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {matches.map((match: any) => (
                      <div key={match.id} className="bg-gray-600/30 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-300">
                            Match {match.id}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMatchFromGroup(groupId, match.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="date"
                              value={match.scheduledDate}
                              onChange={(e) => {
                                const newMatches = [...matches];
                                const matchIndex = newMatches.findIndex(m => m.id === match.id);
                                if (matchIndex !== -1) {
                                  newMatches[matchIndex].scheduledDate = e.target.value;
                                  if (e.target.value && match.scheduledTimeString) {
                                    newMatches[matchIndex].scheduledTime = new Date(`${e.target.value}T${match.scheduledTimeString}`).toISOString();
                                  }
                                  setGroupMatches(prev => ({
                                    ...prev,
                                    [groupId]: newMatches
                                  }));
                                }
                              }}
                              className="w-full bg-gray-600 text-white px-2 py-1 rounded text-xs border border-gray-500 focus:outline-none focus:border-blue-500"
                              placeholder="Date"
                            />
                          </div>
                          
                          <div>
                            <input
                              type="time"
                              value={match.scheduledTimeString}
                              onChange={(e) => {
                                const newMatches = [...matches];
                                const matchIndex = newMatches.findIndex(m => m.id === match.id);
                                if (matchIndex !== -1) {
                                  newMatches[matchIndex].scheduledTimeString = e.target.value;
                                  if (match.scheduledDate && e.target.value) {
                                    newMatches[matchIndex].scheduledTime = new Date(`${match.scheduledDate}T${e.target.value}`).toISOString();
                                  }
                                  setGroupMatches(prev => ({
                                    ...prev,
                                    [groupId]: newMatches
                                  }));
                                }
                              }}
                              className="w-full bg-gray-600 text-white px-2 py-1 rounded text-xs border border-gray-500 focus:outline-none focus:border-blue-500"
                              placeholder="Time"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Summary */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-300">
              <span className="text-white font-medium">Round {round}</span> • 
              <span className="text-white font-medium ml-1">{tournament.groups.filter(group => group.round === round).length} groups</span> • 
              <span className="text-white font-medium ml-1">{Object.values(groupMatches).reduce((sum, matches) => sum + matches.length, 0)} total matches</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                isEditMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEditMode ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoundScheduleModal;
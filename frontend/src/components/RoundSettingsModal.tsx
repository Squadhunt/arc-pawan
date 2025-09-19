import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Users, Target } from 'lucide-react';

interface RoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: number;
  totalRounds: number;
  onSave: (roundData: RoundData) => void;
  initialData?: RoundData;
}

interface RoundData {
  roundNumber: number;
  roundName: string;
  teamsPerGroup: number;
  numberOfGroups: number;
  totalSlots: number;
}

const RoundSettingsModal: React.FC<RoundSettingsModalProps> = ({
  isOpen,
  onClose,
  round,
  totalRounds,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<RoundData>({
    roundNumber: round,
    roundName: `Round ${round}`,
    teamsPerGroup: 4,
    numberOfGroups: 4,
    totalSlots: 16
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        roundNumber: round,
        roundName: `Round ${round}`,
        teamsPerGroup: 4,
        numberOfGroups: 4,
        totalSlots: 16
      });
    }
  }, [round, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeamsPerGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const teamsPerGroup = parseInt(e.target.value) || 4;
    const numberOfGroups = Math.ceil(formData.totalSlots / teamsPerGroup);
    
    setFormData(prev => ({
      ...prev,
      teamsPerGroup,
      numberOfGroups
    }));
  };

  const handleTotalSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const totalSlots = parseInt(e.target.value) || 16;
    const numberOfGroups = Math.ceil(totalSlots / formData.teamsPerGroup);
    
    setFormData(prev => ({
      ...prev,
      totalSlots,
      numberOfGroups
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Round {round} Settings</h2>
              <p className="text-sm text-gray-400">Configure round details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Round Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Round Name
            </label>
            <input
              type="text"
              name="roundName"
              value={formData.roundName}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Quarter Final, Semi Final"
            />
          </div>

          {/* Total Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Teams/Players
            </label>
            <input
              type="number"
              name="totalSlots"
              value={formData.totalSlots}
              onChange={handleTotalSlotsChange}
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Teams per Group */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teams per Group
            </label>
            <input
              type="number"
              name="teamsPerGroup"
              value={formData.teamsPerGroup}
              onChange={handleTeamsPerGroupChange}
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Calculated Groups Display */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{formData.numberOfGroups}</div>
              <div className="text-sm text-gray-400">Number of Groups (Auto-calculated)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoundSettingsModal;

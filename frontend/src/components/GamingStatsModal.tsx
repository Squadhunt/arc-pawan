import React, { useState, useEffect } from 'react';
import { X, Trash2, Trophy, Gamepad2 } from 'lucide-react';

interface GamingStat {
  _id?: string;
  game: string;
  // BGMI fields
  characterId?: string;
  inGameName?: string;
  idLevel?: number;
  role?: string;
  fdRatio?: number;
  currentTier?: string;
  // Clash of Clans fields
  playerTag?: string;
  townhallLevel?: string;
  // Clash Royale fields
  arena?: string;
  // Chess.com fields
  username?: string;
  rating?: number;
  title?: string;
  puzzleRating?: number;
  // Fortnite fields
  epicUsername?: string;
  level?: number;
  wins?: number;
  kd?: number;
  playstyle?: string;
  // Valorant fields
  tag?: string;
  rank?: string;
  rr?: number;
  peakRank?: string;
  // Call of Duty Mobile fields
  uid?: string;
  // Free Fire Max fields
  // PUBG Mobile fields
  // Rocket League fields
  platform?: string;
  mmr?: number;
  // Common fields
}

interface GamingStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stat: GamingStat) => void;
  editingStat?: GamingStat | null;
}

const GAME_OPTIONS = [
  'BGMI',
  'Clash of Clans', 
  'Clash Royale',
  'Chess.com',
  'Fortnite',
  'Call of Duty Mobile',
  'Valorant',
  'Free Fire Max',
  'PUBG Mobile',
  'Rocket League',
  'Other'
];

const GAME_CONFIGS = {
  'BGMI': {
    icon: '🎮',
    color: 'from-orange-500 to-red-600',
    fields: {
      characterId: { label: 'Character ID', type: 'text', required: true, placeholder: 'Enter your Character ID' },
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your in-game username' },
      idLevel: { label: 'ID Level', type: 'number', required: true, min: 1, max: 100 },
      role: { 
        label: 'Role', 
        type: 'select', 
        required: true, 
        options: ['Assaulter', 'Sniper', 'Support', 'Fragger', 'IGL', 'Entry Fragger'] 
      },
      fdRatio: { label: 'Latest F/D Ratio', type: 'number', required: true, step: 0.01, placeholder: 'e.g., 2.5' },
      currentTier: { 
        label: 'Current Tier', 
        type: 'select', 
        required: true, 
        options: [
          'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 
          'Crown', 'Ace', 'Ace Master', 'Ace Dominator', 'Conqueror'
        ] 
      }
    }
  },
  'Clash of Clans': {
    icon: '🏰',
    color: 'from-blue-500 to-purple-600',
    fields: {
      idLevel: { label: 'ID Level', type: 'number', required: true, min: 1, max: 100 },
      playerTag: { label: 'Player Tag (UID)', type: 'text', required: true, placeholder: '#ABC123DEF' },
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your in-game username' },
      townhallLevel: { 
        label: 'Townhall Level', 
        type: 'select', 
        required: true, 
        options: Array.from({length: 17}, (_, i) => `TH${i + 1}`) 
      }
    }
  },
  'Clash Royale': {
    icon: '👑',
    color: 'from-yellow-500 to-orange-600',
    fields: {
      idLevel: { label: 'ID Level', type: 'number', required: true, min: 1, max: 100 },
      playerTag: { label: 'Player Tag (UID)', type: 'text', required: true, placeholder: '#ABC123DEF' },
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your in-game username' },
      arena: { 
        label: 'Arena', 
        type: 'select', 
        required: true, 
        options: [
          'Goblin Stadium', 'Bone Pit', 'Barbarian Bowl', 'P.E.K.K.A\'s Playhouse', 
          'Spell Valley', 'Builder\'s Workshop', 'Royal Arena', 'Frozen Peak', 
          'Jungle Arena', 'Hog Mountain', 'Electro Valley', 'Spooky Town', 
          'Rascal\'s Hideout', 'Serenity Peak', 'Miner\'s Mine', 'Executioner\'s Kitchen', 
          'Royal Crypt', 'Silent Sanctuary', 'Dragon Spa', 'Legendary Arena'
        ] 
      }
    }
  },
  'Chess.com': {
    icon: '♟️',
    color: 'from-gray-600 to-gray-800',
    fields: {
      username: { label: 'Chess.com Username', type: 'text', required: true, placeholder: 'Your chess.com username' },
      rating: { label: 'Current Rating', type: 'number', required: true, min: 100, max: 3000 },
      title: { 
        label: 'Title', 
        type: 'select', 
        required: false, 
        options: ['None', 'CM', 'FM', 'IM', 'GM', 'WCM', 'WFM', 'WIM', 'WGM'] 
      },
      puzzleRating: { label: 'Puzzle Rating', type: 'number', required: false, min: 100, max: 3000 }
    }
  },
  'Fortnite': {
    icon: '🏗️',
    color: 'from-green-500 to-blue-600',
    fields: {
      epicUsername: { label: 'Epic Username', type: 'text', required: true, placeholder: 'Your Epic Games username' },
      level: { label: 'Level', type: 'number', required: true, min: 1, max: 1000 },
      wins: { label: 'Total Wins', type: 'number', required: true, min: 0 },
      kd: { label: 'K/D Ratio', type: 'number', required: true, step: 0.01 },
      playstyle: { 
        label: 'Playstyle', 
        type: 'select', 
        required: true, 
        options: ['Aggressive', 'Passive', 'Builder', 'Sniper', 'Rusher'] 
      }
    }
  },
  'Valorant': {
    icon: '💎',
    color: 'from-purple-500 to-pink-600',
    fields: {
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your Valorant username' },
      tag: { label: 'Tag', type: 'text', required: true, placeholder: 'Your tag (e.g., #1234)' },
      rank: { label: 'Current Rank', type: 'select', required: true, 
        options: ['Iron 1', 'Iron 2', 'Iron 3', 'Bronze 1', 'Bronze 2', 'Bronze 3', 'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3', 'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3', 'Immortal 1', 'Immortal 2', 'Immortal 3', 'Radiant'] 
      },
      role: { 
        label: 'Preferred Role', 
        type: 'select', 
        required: true, 
        options: ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'] 
      },
      rr: { label: 'Rank Rating (RR)', type: 'number', required: false, min: 0, max: 100 },
      peakRank: { label: 'Peak Rank', type: 'select', required: false,
        options: ['Iron 1', 'Iron 2', 'Iron 3', 'Bronze 1', 'Bronze 2', 'Bronze 3', 'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3', 'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3', 'Immortal 1', 'Immortal 2', 'Immortal 3', 'Radiant'] 
      }
    }
  },
  'Call of Duty Mobile': {
    icon: '🔫',
    color: 'from-red-500 to-orange-600',
    fields: {
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your COD Mobile username' },
      uid: { label: 'Player UID', type: 'text', required: true, placeholder: 'Your player UID' },
      level: { label: 'Level', type: 'number', required: true, min: 1, max: 150 },
      rank: { label: 'Current Rank', type: 'select', required: true,
        options: ['Rookie I', 'Rookie II', 'Rookie III', 'Rookie IV', 'Rookie V', 'Veteran I', 'Veteran II', 'Veteran III', 'Veteran IV', 'Veteran V', 'Elite I', 'Elite II', 'Elite III', 'Elite IV', 'Elite V', 'Pro I', 'Pro II', 'Pro III', 'Pro IV', 'Pro V', 'Master I', 'Master II', 'Master III', 'Master IV', 'Master V', 'Legendary']
      },
      role: { 
        label: 'Preferred Role', 
        type: 'select', 
        required: true, 
        options: ['Assault', 'Sniper', 'Support', 'Tactical', 'Rusher', 'Fragger'] 
      },
      kd: { label: 'K/D Ratio', type: 'number', required: true, step: 0.01 },
      wins: { label: 'Total Wins', type: 'number', required: true, min: 0 }
    }
  },
  'Free Fire Max': {
    icon: '🔥',
    color: 'from-yellow-500 to-red-600',
    fields: {
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your Free Fire username' },
      uid: { label: 'Player UID', type: 'text', required: true, placeholder: 'Your player UID' },
      level: { label: 'Level', type: 'number', required: true, min: 1, max: 100 },
      rank: { label: 'Current Rank', type: 'select', required: true,
        options: ['Bronze I', 'Bronze II', 'Bronze III', 'Silver I', 'Silver II', 'Silver III', 'Gold I', 'Gold II', 'Gold III', 'Platinum I', 'Platinum II', 'Platinum III', 'Diamond I', 'Diamond II', 'Diamond III', 'Heroic', 'Grandmaster']
      },
      role: { 
        label: 'Preferred Role', 
        type: 'select', 
        required: true, 
        options: ['Rusher', 'Sniper', 'Support', 'Fragger', 'IGL', 'Entry Fragger'] 
      },
      kd: { label: 'K/D Ratio', type: 'number', required: true, step: 0.01 },
      matchesPlayed: { label: 'Matches Played', type: 'number', required: true, min: 0 }
    }
  },
  'PUBG Mobile': {
    icon: '🎯',
    color: 'from-blue-600 to-green-600',
    fields: {
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your PUBG Mobile username' },
      uid: { label: 'Player UID', type: 'text', required: true, placeholder: 'Your player UID' },
      level: { label: 'Level', type: 'number', required: true, min: 1, max: 100 },
      rank: { label: 'Current Rank', type: 'select', required: true,
        options: ['Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I', 'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I', 'Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I', 'Platinum V', 'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I', 'Diamond V', 'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I', 'Crown V', 'Crown IV', 'Crown III', 'Crown II', 'Crown I', 'Ace', 'Ace Master', 'Ace Dominator', 'Conqueror']
      },
      role: { 
        label: 'Preferred Role', 
        type: 'select', 
        required: true, 
        options: ['Assaulter', 'Sniper', 'Support', 'Fragger', 'IGL', 'Entry Fragger'] 
      },
      kd: { label: 'K/D Ratio', type: 'number', required: true, step: 0.01 },
      matchesPlayed: { label: 'Matches Played', type: 'number', required: true, min: 0 }
    }
  },
  'Rocket League': {
    icon: '⚽',
    color: 'from-orange-500 to-yellow-600',
    fields: {
      inGameName: { label: 'In-Game Name', type: 'text', required: true, placeholder: 'Your Rocket League username' },
      platform: { label: 'Platform', type: 'select', required: true,
        options: ['Steam', 'Epic Games', 'PlayStation', 'Xbox', 'Nintendo Switch']
      },
      rank: { label: 'Current Rank', type: 'select', required: true,
        options: ['Bronze I', 'Bronze II', 'Bronze III', 'Silver I', 'Silver II', 'Silver III', 'Gold I', 'Gold II', 'Gold III', 'Platinum I', 'Platinum II', 'Platinum III', 'Diamond I', 'Diamond II', 'Diamond III', 'Champion I', 'Champion II', 'Champion III', 'Grand Champion I', 'Grand Champion II', 'Grand Champion III', 'Supersonic Legend']
      },
      role: { 
        label: 'Preferred Position', 
        type: 'select', 
        required: true, 
        options: ['Striker', 'Midfielder', 'Defender', 'Goalkeeper', 'Flex'] 
      },
      mmr: { label: 'MMR (Matchmaking Rating)', type: 'number', required: false, min: 0 },
      wins: { label: 'Total Wins', type: 'number', required: true, min: 0 }
    }
  }
};

const GamingStatsModal: React.FC<GamingStatsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStat
}) => {
  const [formData, setFormData] = useState<GamingStat>({
    game: ''
  });

  useEffect(() => {
    if (editingStat) {
      setFormData(editingStat);
    } else {
      setFormData({
        game: ''
      });
    }
  }, [editingStat, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['idLevel', 'fdRatio', 'rating', 'puzzleRating', 'level', 'wins', 'kd', 'rr', 'mmr', 'matchesPlayed'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const getCurrentGameConfig = () => {
    return GAME_CONFIGS[formData.game as keyof typeof GAME_CONFIGS] || null;
  };

  const renderField = (fieldName: string, fieldConfig: any) => {
    const { label, type, required, placeholder, options, min, max, step } = fieldConfig;
    
    if (type === 'select') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          <select
            name={fieldName}
            value={formData[fieldName as keyof GamingStat] || ''}
            onChange={handleInputChange}
            required={required}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select {label}</option>
            {options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }
    
    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
          type={type}
          name={fieldName}
          value={formData[fieldName as keyof GamingStat] || ''}
          onChange={handleInputChange}
          required={required}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
        />
      </div>
    );
  };

  if (!isOpen) return null;

  const currentGameConfig = getCurrentGameConfig();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="relative p-8 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${currentGameConfig?.color || 'from-blue-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-2xl">{currentGameConfig?.icon || '🎮'}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingStat ? 'Edit Gaming Stats' : 'Add Gaming Stats'}
                </h2>
                <p className="text-gray-400 mt-1">
                  {formData.game ? `Configure your ${formData.game} statistics` : 'Select a game to get started'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Game Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-white mb-4">
              Select Game <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {GAME_OPTIONS.map(game => {
                const config = GAME_CONFIGS[game as keyof typeof GAME_CONFIGS];
                return (
                  <button
                    key={game}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, game }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.game === game
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{config?.icon || '🎮'}</div>
                      <div className="text-white font-medium text-sm">{game}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Fields */}
          {formData.game && currentGameConfig && (
            <div className="space-y-8">
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                  <Gamepad2 className="h-5 w-5 text-blue-400" />
                  <span>Game Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(currentGameConfig.fields).map(([fieldName, fieldConfig]) => 
                    renderField(fieldName, fieldConfig)
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-700/50 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.game}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
            >
              <Trophy className="h-4 w-4" />
              <span>{editingStat ? 'Update Stats' : 'Add Stats'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GamingStatsModal;

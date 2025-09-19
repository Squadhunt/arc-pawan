import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useCamera } from '../contexts/CameraContext';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Phone, Gamepad2, Users, Video, MessageCircle, Sparkles, Zap, ArrowLeft, Home, Search, Briefcase, Trophy, User } from 'lucide-react';
import MatchInterface from '../components/MatchInterface';
import MobileBottomNav from '../components/MobileBottomNav';

interface Game {
  id: string;
  name: string;
  icon: string;
}

interface ConnectionData {
  roomId: string;
  participants: {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
    videoEnabled: boolean;
  }[];
  selectedGame: string;
}

const games: Game[] = [
  { id: 'bgmi', name: 'BGMI', icon: '🎮' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'freefire', name: 'Free Fire', icon: '🔥' },
  { id: 'csgo', name: 'CS:GO', icon: '⚡' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
  { id: 'apex', name: 'Apex Legends', icon: '🚀' },
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'dota2', name: 'Dota 2', icon: '🗡️' }
];

const RandomConnectNew: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [isInQueue, setIsInQueue] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [currentConnection, setCurrentConnection] = useState<ConnectionData | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [queueMessage, setQueueMessage] = useState<string>('');
  const [socketStatus, setSocketStatus] = useState<string>('disconnected');
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { stopCamera: globalStopCamera, isCameraActive } = useCamera();
  const location = useLocation();
  
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update socket status
  useEffect(() => {
    if (socket && socket.connected) {
      setSocketStatus('connected');
    } else if (socket && socket.connecting) {
      setSocketStatus('connecting');
    } else {
      setSocketStatus('disconnected');
    }
  }, [socket, isConnected]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleConnectionMatched = (data: ConnectionData) => {
      
      try {
        if (!data || !data.participants || !Array.isArray(data.participants)) {
          setError('Invalid connection data received');
          return;
        }

        const currentUserId = user?._id;
        const partnerData = data.participants.find(p => p.userId !== currentUserId);
        
        if (!partnerData) {
          setError('Partner information not found');
          return;
        }

        console.log('Connection matched with:', partnerData.username);
        
        setIsInQueue(false);
        setIsConnecting(false);
        setCurrentConnection(data);
        setPartner(partnerData);
        setError('');
        setQueueMessage('');
        
        // Clear any timeouts
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      } catch (error) {
        console.error('Error processing connection-matched event:', error);
        setError('Error processing connection data');
      }
    };

    const handlePartnerDisconnected = (data: any) => {
      console.log('Partner disconnected:', data);
      // Keep user in call interface with loading screen
    };

    const handleRejoinedQueue = (data: any) => {
      console.log('Rejoined queue:', data);
      setIsInQueue(true);
      setIsConnecting(false);
      setError('');
      setQueueMessage(data.message);
    };

    // Add event listeners
    socket.on('connection-matched', handleConnectionMatched);
    socket.on('partner-disconnected', handlePartnerDisconnected);
    socket.on('rejoined-queue', handleRejoinedQueue);

    // Cleanup
    return () => {
      socket.off('connection-matched', handleConnectionMatched);
      socket.off('partner-disconnected', handlePartnerDisconnected);
      socket.off('rejoined-queue', handleRejoinedQueue);
    };
  }, [socket, user?._id]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!user?._id || !localStorage.getItem('token')) return;
      
      try {
        const response = await axios.get('/api/random-connections/current-connection', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success && response.data.connection) {
          const connection = response.data.connection;
          const otherParticipant = connection.participants.find((p: any) => p.userId !== user._id);
          
          if (otherParticipant) {
            setCurrentConnection({
              roomId: connection.roomId,
              selectedGame: connection.selectedGame,
              participants: connection.participants
            });
            setPartner({
              userId: otherParticipant.userId,
              username: otherParticipant.username,
              displayName: otherParticipant.displayName,
              avatar: otherParticipant.avatar,
              videoEnabled: otherParticipant.videoEnabled
            });
            setSelectedGame(connection.selectedGame);
          }
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('Authentication required, redirecting to login');
          // Token will be cleared by axios interceptor
        } else {
          console.log('No existing connection found');
        }
      }
    };

    checkExistingConnection();
  }, [user?._id]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = async () => {
      try {
        globalStopCamera();
        await axios.post('/api/random-connections/cleanup-current', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Error cleaning up connection:', error);
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  const handleStartConnecting = async () => {
    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    if (!user) {
      setError('Please login to use Random Connect');
      return;
    }

    if (!socket || !socket.connected) {
      setError('Socket connection not available. Please wait for connection...');
      return;
    }


    // Ensure user is joined to their personal room
    if (user?._id) {
      socket.emit('join-user-room', user._id);
    }

    setIsConnecting(true);
    setError('');
    setQueueMessage('');

    try {
      const response = await axios.post('/api/random-connections/join-queue', {
        selectedGame,
        videoEnabled
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        if (response.data.matched) {
          setIsConnecting(false);
        } else {
          setIsInQueue(true);
          setIsConnecting(false);
          setQueueMessage('Looking for a partner...');
          
          // Set timeout for queue
          connectionTimeoutRef.current = setTimeout(() => {
            if (isInQueue) {
              setQueueMessage('Still searching for a partner... This may take a few moments.');
            }
          }, 10000);
        }
      }
    } catch (error: any) {
      setIsConnecting(false);
      setError(error.response?.data?.message || 'Failed to join queue');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await axios.delete('/api/random-connections/leave-queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      globalStopCamera();
      setIsInQueue(false);
      setIsConnecting(false);
      setError('');
      setQueueMessage('');
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to leave queue');
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Starting disconnect process...');
      
      globalStopCamera();
      
      if (isInQueue && !currentConnection) {
        await handleLeaveQueue();
        return;
      }
      
      if (currentConnection?.roomId) {
        await axios.post('/api/random-connections/disconnect', {
          roomId: currentConnection.roomId
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setCurrentConnection(null);
        setPartner(null);
        setError('');
        setQueueMessage('');
        setVideoEnabled(false);
        setIsInQueue(false);
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error('Disconnect error:', error);
      setError(error.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleNextMatch = async () => {
    await handleDisconnect();
    setTimeout(() => {
      handleStartConnecting();
    }, 1000);
  };

  const handleReturnToHome = async () => {
    try {
      globalStopCamera();
      setCurrentConnection(null);
      setPartner(null);
      setIsInQueue(false);
      setIsConnecting(false);
      setError('');
      setQueueMessage('');
    } catch (error) {
      console.error('Error in Return to Home:', error);
      setError('Failed to return to home');
    }
  };


  if (currentConnection && partner) {
    return (
      <MatchInterface
        roomId={currentConnection.roomId}
        partner={partner}
        selectedGame={selectedGame}
        videoEnabled={videoEnabled}
        onDisconnect={handleDisconnect}
        onNextMatch={handleNextMatch}
        onReturnToHome={handleReturnToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header with Back Arrow */}
      <div className="flex items-center px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-800 lg:hidden">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-3"
        >
          <ArrowLeft className="h-6 w-6 text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-white">Random Connect</h1>
      </div>

      <div className="relative min-h-screen flex flex-col pt-20 lg:pt-24 pb-0 lg:pb-8">
        {/* Connection Status */}
        <div className="text-center py-2 px-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
              socketStatus === 'connected' ? 'bg-green-400' : 
              socketStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              socketStatus === 'connected' ? 'text-green-400' : 
              socketStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {socketStatus === 'connected' ? 'Connected' : 
               socketStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-1 h-[calc(100vh-80px)] lg:h-auto">
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 shadow-lg border border-gray-800 max-w-4xl mx-auto w-full">
            <div>
              {error && (
                <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-center text-xs">{error}</p>
                </div>
              )}

              {!isInQueue ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Game Selection */}
                  <div>
                    <div className="text-center mb-3 sm:mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                        Select Your Game
                      </h2>
                      <p className="text-gray-300 text-xs sm:text-sm">Choose the game you want to play</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
                      {games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGame(game.id)}
                          className={`group p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 h-16 sm:h-20 flex flex-col items-center justify-center ${
                            selectedGame === game.id
                              ? 'border-white bg-gray-700 text-white shadow-lg ring-2 ring-white/20'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                          }`}
                        >
                          <div className="text-lg sm:text-xl mb-1">{game.icon}</div>
                          <div className="font-semibold text-xs text-center leading-tight">{game.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Settings */}
                  <div>
                    <div className="text-center mb-2 sm:mb-3">
                      <h2 className="text-base sm:text-lg font-semibold text-white mb-1 flex items-center justify-center">
                        <Video className="w-4 h-4 mr-2 text-gray-400" />
                        Video Settings
                      </h2>
                      <p className="text-gray-300 text-xs">Choose your communication style</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                          videoEnabled ? 'bg-gray-700' : 'bg-gray-600'
                        }`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                            videoEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}></div>
                        </div>
                        <span className="text-white font-semibold text-xs">
                          {videoEnabled ? 'Video Chat' : 'Audio Only'}
                        </span>
                        <input
                          type="checkbox"
                          checked={videoEnabled}
                          onChange={(e) => setVideoEnabled(e.target.checked)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="text-center">
                    <button
                      onClick={handleStartConnecting}
                      disabled={isConnecting || !selectedGame || !socket?.connected}
                      className={`px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 w-full sm:w-auto ${
                        isConnecting || !selectedGame || !socket?.connected
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg border border-gray-700'
                      }`}
                    >
                      {isConnecting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Start Connecting</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Queue Status */
                <div className="text-center py-4 sm:py-6">
                  <div className="mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-400/30 border-t-gray-400 rounded-full animate-spin mx-auto mb-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {queueMessage || 'Looking for a partner...'}
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm mb-3">
                      Searching for someone playing <span className="text-gray-400 font-semibold">{games.find(g => g.id === selectedGame)?.name}</span>
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    
                    {/* Camera Status */}
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isCameraActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className="text-xs sm:text-sm text-gray-400 font-medium">
                        Camera: {isCameraActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLeaveQueue}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg w-full sm:w-auto"
                  >
                    Cancel Search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features Info */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto w-full px-4 sm:px-0">
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-3 sm:p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 relative z-10">Smart Matching</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Connect with players</p>
            </div>
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-3 sm:p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 relative z-10">Video Chat</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Crystal clear quality</p>
            </div>
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-3 sm:p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 relative z-10">Real-time Chat</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Send messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Hidden on Random Connect */}
      <div className="hidden lg:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default RandomConnectNew;

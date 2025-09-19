import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useCamera } from '../contexts/CameraContext';
import axios from 'axios';
import { Phone, Gamepad2, Users, Video, MessageCircle, Sparkles, Zap } from 'lucide-react';
import MatchInterface from '../components/MatchInterface';

interface Game {
  id: string;
  name: string;
  icon: string;
}

interface ConnectionMatchedData {
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

interface PartnerDisconnectedData {
  roomId: string;
  disconnectedUserId: string;
  reason?: string;
}

interface RejoinedQueueData {
  selectedGame: string;
  message: string;
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

const RandomConnect: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [isInQueue, setIsInQueue] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [queueMessage, setQueueMessage] = useState<string>('');
  const [socketStatus, setSocketStatus] = useState<string>('connecting');
  const [forceUpdate, setForceUpdate] = useState<number>(0);

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { stopCamera: globalStopCamera, isCameraActive } = useCamera();

  // Update socket status when isConnected changes
  useEffect(() => {
    if (isConnected) {
      setSocketStatus('connected');
      console.log('Socket connected in RandomConnect');
    } else {
      setSocketStatus('disconnected');
      console.log('Socket disconnected in RandomConnect');
    }
  }, [isConnected]);

  useEffect(() => {
    // Update socket status based on socket connection
    if (!socket) {
      console.log('Socket not available for RandomConnect');
      setSocketStatus('disconnected');
      return;
    }

    if (!socket.connected) {
      console.log('Socket not connected for RandomConnect');
      setSocketStatus('disconnected');
      return;
    }

    console.log('Setting up socket listeners for RandomConnect');
    setSocketStatus('connected');

    // Monitor socket connection status
    const checkConnection = () => {
      if (socket && socket.connected) {
        setSocketStatus('connected');
        console.log('Socket connection is healthy');
      } else {
        setSocketStatus('disconnected');
        console.log('Socket connection lost in RandomConnect');
        
        // Try to reconnect if we have a user but no socket connection
        if (user && !socket?.connected) {
          console.log('Attempting to reconnect socket...');
          // The SocketContext should handle reconnection automatically
        }
      }
    };

    // Check connection status periodically
    const connectionInterval = setInterval(checkConnection, 5000); // Check every 5 seconds

    // Listen for connection matched event
    socket.on('connection-matched', (data: ConnectionMatchedData) => {
      console.log('Connection matched event received:', data);
      
      try {
        // Validate data structure
        if (!data || !data.participants || !Array.isArray(data.participants)) {
          console.error('Invalid connection-matched data:', data);
          setError('Invalid connection data received');
          return;
        }

        // Find the partner (other participant)
        const currentUserId = user?._id;
        const partnerData = data.participants.find(p => p.userId !== currentUserId);
        
        if (!partnerData) {
          console.error('Partner not found in participants:', data.participants);
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
      } catch (error) {
        console.error('Error processing connection-matched event:', error);
        setError('Error processing connection data');
      }
    });

    // Listen for partner disconnected
    socket.on('partner-disconnected', (data: PartnerDisconnectedData) => {
      console.log('Partner disconnected:', data);
      
      const reason = data.reason || 'disconnected';
      
      // Don't clear connection state - keep user in the call interface
      // The MatchInterface will handle showing the loading screen
      console.log('Partner disconnected, keeping user in call interface with loading screen');
      
      // Don't turn off camera for remaining user - keep it ON
      // Don't change videoEnabled state
      
      // Don't return to random connect page - stay in call interface
    });

    // Listen for rejoined queue event
    socket.on('rejoined-queue', (data: RejoinedQueueData) => {
      console.log('Rejoined queue:', data);
      setIsInQueue(true);
      setIsConnecting(false);
      setError('');
      setQueueMessage(data.message);
    });

    return () => {
      console.log('Cleaning up socket listeners for RandomConnect');
      clearInterval(connectionInterval);
      socket.off('connection-matched');
      socket.off('partner-disconnected');
      socket.off('rejoined-queue');
    };
  }, [socket]);

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
          const otherParticipant = connection.participants.find((p: any) => p.userId !== user?._id);
          
          if (otherParticipant) {
            setCurrentConnection({
              roomId: connection.roomId,
              selectedGame: connection.selectedGame
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
          // No existing connection, which is fine
        }
      }
    };

    if (user) {
      checkExistingConnection();
    }
  }, [user?._id]);

  // Cleanup on unmount or page refresh
  useEffect(() => {
    const cleanup = async () => {
      try {
        // Stop all media tracks
        stopAllMediaTracks();
        
        await axios.post('/api/random-connections/cleanup-current', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Connection cleaned up on page unload');
      } catch (error) {
        console.error('Error cleaning up connection:', error);
      }
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      // Also cleanup on component unmount
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

    // Check socket connection with retry
    let retryCount = 0;
    const maxRetries = 3; // Reduced retries
    
    while (retryCount < maxRetries) {
      if (!socket) {
        setError('Socket connection not available. Please refresh the page.');
        return;
      }

      if (!socket.connected) {
        if (retryCount === 0) {
          setError('Socket connection lost. Attempting to reconnect...');
          // Wait a bit for reconnection
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
          continue;
        } else if (retryCount < 2) {
          setError('Still reconnecting... Please wait...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
          continue;
        } else {
          setError('Socket connection lost. Please refresh the page.');
          return;
        }
      }

      if (socket.connecting) {
        setError('Socket is connecting. Please wait...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
        continue;
      }

      // Socket is connected, break the loop
      break;
    }

    // Ensure user is joined to their personal room
    if (user?._id) {
      socket.emit('join-user-room', user._id);
      console.log('Ensuring user is in personal room:', user._id);
    }

    console.log('Starting connection process for game:', selectedGame);

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
          // Instant match found
          console.log('Instant match found!');
          setIsConnecting(false);
          // The socket event will handle the connection setup
        } else {
          // Added to queue, waiting for match
          console.log('Added to queue, waiting for match...');
          setIsInQueue(true);
          setIsConnecting(false);
          setQueueMessage('Looking for a partner...');
          
          // Join socket room for the game
          socket.emit('join-random-queue', { selectedGame, videoEnabled });
          
          // Set a timeout to show a message if no match is found
          setTimeout(() => {
            if (isInQueue) {
              setQueueMessage('Still searching for a partner... This may take a few moments.');
            }
          }, 10000); // 10 seconds
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

      // Stop camera immediately
      globalStopCamera();
      
      // Stop all media tracks
      stopAllMediaTracks();

      setIsInQueue(false);
      setIsConnecting(false);
      setError('');
      setQueueMessage('');
      
      // Leave socket room
      socket?.emit('leave-random-queue', { selectedGame });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to leave queue');
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Starting disconnect process...');
      console.log('Current state - isInQueue:', isInQueue, 'currentConnection:', !!currentConnection);
      console.log('Socket connected before disconnect:', socket?.connected);
      
      // Stop camera immediately
      globalStopCamera();
      
      // Stop all media tracks
      stopAllMediaTracks();
      
      // If user is in queue, use leave queue functionality
      if (isInQueue && !currentConnection) {
        console.log('User is in queue, using leave queue functionality...');
        await handleLeaveQueue();
        return;
      }
      
      // If user has an active connection, disconnect from it
      if (currentConnection?.roomId) {
        console.log('User has active connection, disconnecting from room...');
        
        // First, leave the socket room to prevent any issues
        if (socket && socket.connected) {
          console.log('Leaving socket room first...');
          try {
            socket.emit('leave-random-room', currentConnection.roomId);
            console.log('Socket room left successfully');
          } catch (error) {
            console.error('Error leaving socket room:', error);
          }
        }
        
        // Then call the disconnect API
        await axios.post('/api/random-connections/disconnect', {
          roomId: currentConnection.roomId
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Disconnect API call successful');
        console.log('Socket connected after API call:', socket?.connected);

        // Clear connection state
        setCurrentConnection(null);
        setPartner(null);
        setError('');
        setQueueMessage('');
        
        // Turn off camera automatically for the user who disconnects
        setVideoEnabled(false);
        
        // Return to random connect page state
        setIsInQueue(false);
        setIsConnecting(false);
        
        // Force UI update
        setForceUpdate(prev => prev + 1);
        
        console.log('Disconnected successfully, returned to random connect page with camera off');
        console.log('Final socket connected state:', socket?.connected);
        
        // Ensure socket connection is maintained
        if (socket && !socket.connected) {
          console.log('Socket disconnected during disconnect process, will reconnect automatically');
        }
      } else {
        // If no active connection and not in queue, just reset state
        console.log('No active connection or queue, resetting state...');
        setCurrentConnection(null);
        setPartner(null);
        setError('');
        setQueueMessage('');
        setIsInQueue(false);
        setIsConnecting(false);
        setVideoEnabled(false);
        setForceUpdate(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Disconnect error:', error);
      setError(error.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleNextMatch = async () => {
    await handleDisconnect();
    // Automatically start looking for next match
    setTimeout(() => {
      handleStartConnecting();
    }, 1000);
  };

  const stopAllMediaTracks = () => {
    try {
      console.log('Stopping all media tracks via global camera context...');
      globalStopCamera();
    } catch (error) {
      console.log('Error stopping media tracks:', error);
    }
  };

  const handleReturnToHome = async () => {
    try {
      console.log('Return to Home clicked - clearing all states...');
      
      // Stop camera immediately first
      globalStopCamera();
      
      // Stop all media tracks
      stopAllMediaTracks();
      
      // Clear all connection states immediately
      setCurrentConnection(null);
      setPartner(null);
      setIsInQueue(false);
      setIsConnecting(false);
      setError('');
      setQueueMessage('');
      
      // Leave any socket rooms
      if (socket && socket.connected) {
        socket.emit('leave-random-queue', { selectedGame });
        if (currentConnection?.roomId) {
          socket.emit('leave-random-room', currentConnection.roomId);
        }
      }
      
      // Force UI update to ensure we return to main page
      setForceUpdate(prev => prev + 1);
      
      console.log('Return to Home - all states cleared, should show main Random Connect page');
    } catch (error) {
      console.error('Error in Return to Home:', error);
      setError('Failed to return to home');
    }
  };


  // Debug log
  console.log('RandomConnect render state:', {
    currentConnection: !!currentConnection,
    partner: !!partner,
    isInQueue,
    isConnecting,
    forceUpdate
  });

  if (currentConnection && partner) {
    return (
      <MatchInterface
        key={`${currentConnection.roomId}-${forceUpdate}`}
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

      <div className="relative min-h-screen flex flex-col pt-16">
                  {/* Premium Header */}
          <div className="text-center py-1">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center shadow-lg border border-gray-700">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
                              <h1 className="text-3xl font-bold mb-1 text-white">
                    Random Connect
                  </h1>
                  <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed px-2">
                    Connect with random players for epic gaming sessions
                  </p>
            
            {/* Socket Status Indicator */}
            <div className="mt-3 flex items-center justify-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                socketStatus === 'connected' ? 'bg-green-400' : 
                socketStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span className={`text-xs ${
                socketStatus === 'connected' ? 'text-green-400' : 
                socketStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {socketStatus === 'connected' ? 'Connected' : 
                 socketStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            {/* Debug Info */}
            <div className="mt-2 text-xs text-gray-400 text-center">
              Debug: Socket={socket ? 'Yes' : 'No'}, isConnected={isConnected ? 'Yes' : 'No'}, Status={socketStatus}
              <br />
              User: {user ? 'Yes' : 'No'}, UserID: {user?._id || 'None'}, Token: {localStorage.getItem('token') ? 'Yes' : 'No'}
              <br />
              <button 
                onClick={() => {
                  console.log('Manual connection test...');
                  if (socket) {
                    console.log('Socket exists, attempting manual connect...');
                    socket.connect();
                  } else {
                    console.log('No socket available');
                  }
                }}
                className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Test Connection
              </button>
            </div>
          </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-1">
                          <div className="bg-gray-900 rounded-lg p-3 shadow-lg border border-gray-800 max-w-4xl mx-auto w-full">
            <div>
              {error && (
                <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-center text-xs">{error}</p>
                </div>
              )}

              {!isInQueue ? (
                <div className="space-y-2">
                  {/* Game Selection - Premium */}
                  <div>
                    <div className="text-center mb-2">
                      <h2 className="text-xl font-semibold text-white mb-1 flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 mr-2 text-gray-400" />
                        Select Your Game
                      </h2>
                      <p className="text-gray-300 text-sm">Choose the game you want to play</p>
                    </div>
                    <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
                      {games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGame(game.id)}
                          className={`group p-3 rounded-lg border-2 transition-all duration-200 h-20 flex flex-col items-center justify-center ${
                            selectedGame === game.id
                              ? 'border-white bg-gray-700 text-white shadow-lg ring-2 ring-white/20'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                          }`}
                        >
                          <div className="text-xl mb-1">{game.icon}</div>
                          <div className="font-semibold text-xs text-center leading-tight">{game.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Settings */}
                  <div>
                    <div className="text-center mb-1">
                      <h2 className="text-lg font-semibold text-white mb-1 flex items-center justify-center">
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

                  {/* Start Button - Premium */}
                  <div className="text-center">
                    <button
                      onClick={handleStartConnecting}
                      disabled={isConnecting || !selectedGame}
                      className={`px-8 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                        isConnecting || !selectedGame
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg border border-gray-700'
                      }`}
                    >
                      {isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Start Connecting</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Queue Status */
                <div className="text-center py-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 border-4 border-gray-400/30 border-t-gray-400 rounded-full animate-spin mx-auto mb-3"></div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {queueMessage || 'Looking for a partner...'}
                    </h2>
                    <p className="text-gray-300 text-sm mb-3">
                      Searching for someone playing <span className="text-gray-400 font-semibold">{games.find(g => g.id === selectedGame)?.name}</span>
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    
                    {/* Camera Status Indicator */}
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className="text-sm text-gray-400 font-medium">
                        Camera: {isCameraActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLeaveQueue}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg"
                  >
                    Cancel Search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features Info - Premium */}
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 relative z-10">Smart Matching</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Connect with players</p>
            </div>
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <Video className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 relative z-10">Video Chat</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Crystal clear quality</p>
            </div>
            <div className="bg-black/40 backdrop-blur-2xl rounded-xl p-4 text-center border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-black/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 relative z-10">Real-time Chat</h3>
              <p className="text-gray-300 text-xs leading-relaxed relative z-10">Send messages</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RandomConnect;

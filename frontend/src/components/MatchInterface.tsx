import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useCamera } from '../contexts/CameraContext';
import axios from 'axios';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  SkipForward,
  Send,
  MessageCircle,
  Users,
  Gamepad2,
  Flag,
  Settings
} from 'lucide-react';

interface Partner {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  videoEnabled: boolean;
}

interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface MatchInterfaceProps {
  roomId: string;
  partner: Partner;
  selectedGame: string;
  videoEnabled: boolean;
  onDisconnect: () => void;
  onNextMatch: () => void;
  onReturnToHome?: () => void;
}

interface RandomConnectionMessageData {
  sender: string;
  message: string;
  timestamp: string;
}

interface WebRTCSignalData {
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate';
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
  fromUserId: string;
  roomId: string;
}

const MatchInterface: React.FC<MatchInterfaceProps> = ({
  roomId,
  partner,
  selectedGame,
  videoEnabled,
  onDisconnect,
  onNextMatch,
  onReturnToHome
}) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(videoEnabled);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState('');
  const [hasCreatedOffer, setHasCreatedOffer] = useState(false);
  const [hasReceivedOffer, setHasReceivedOffer] = useState(false);
  const [isConnectionSuccessful, setIsConnectionSuccessful] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [maxRetries] = useState(5);
  const [noiseReduction] = useState(true); // Always ON by default
  const [videoQuality, setVideoQuality] = useState('high'); // Video quality level
  const [isQualityAdjusting, setIsQualityAdjusting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const qualityMonitorRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useSocket();
  const { user } = useAuth();
  const { startCamera, stopCamera: globalStopCamera, isCameraActive, currentStream } = useCamera();

  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Video quality presets
  const videoQualityPresets = {
    low: {
      width: 640,
      height: 480,
      frameRate: 15,
      bitrate: 500
    },
    medium: {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrate: 1500
    },
    high: {
      width: 1920,
      height: 1080,
      frameRate: 60,
      bitrate: 3000
    },
    ultra: {
      width: 2560,
      height: 1440,
      frameRate: 60,
      bitrate: 5000
    }
  };

  // Monitor video quality and adjust dynamically
  const monitorVideoQuality = async () => {
    if (!peerConnectionRef.current || !isConnectionSuccessful) return;

    try {
      const stats = await peerConnectionRef.current.getStats();
      let videoStats: any = {};

      stats.forEach(report => {
        if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          videoStats.bitrate = report.bytesSent * 8 / 1000; // kbps
          videoStats.frameRate = report.framesPerSecond;
          videoStats.resolution = `${report.frameWidth}x${report.frameHeight}`;
          videoStats.packetsLost = report.packetsLost;
          videoStats.packetsSent = report.packetsSent;
        }
      });

      // Adjust quality based on network conditions
      if (videoStats.bitrate && videoStats.frameRate) {
        if (videoStats.bitrate < 500 || videoStats.frameRate < 10) {
          // Low bandwidth - reduce quality
          if (videoQuality !== 'low') {
            console.log('Network conditions poor, reducing video quality to low');
            await adjustVideoQuality('low');
          }
        } else if (videoStats.bitrate > 2000 && videoStats.frameRate > 25) {
          // High bandwidth - increase quality
          if (videoQuality !== 'high') {
            console.log('Network conditions good, increasing video quality to high');
            await adjustVideoQuality('high');
          }
        }
      }
    } catch (error) {
      console.log('Error monitoring video quality:', error);
    }
  };

  // Adjust video quality dynamically
  const adjustVideoQuality = async (level: 'low' | 'medium' | 'high' | 'ultra') => {
    if (isQualityAdjusting || !localStream) return;

    try {
      setIsQualityAdjusting(true);
      const preset = videoQualityPresets[level];
      
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        await videoTrack.applyConstraints({
          width: { ideal: preset.width, max: preset.width * 1.2 },
          height: { ideal: preset.height, max: preset.height * 1.2 },
          frameRate: { ideal: preset.frameRate, max: preset.frameRate * 1.2 }
        });
        
        setVideoQuality(level);
        console.log(`Video quality adjusted to ${level}: ${preset.width}x${preset.height}@${preset.frameRate}fps`);
      }
    } catch (error) {
      console.error('Error adjusting video quality:', error);
    } finally {
      setIsQualityAdjusting(false);
    }
  };

  // Set video codec preferences
  const setVideoCodecPreferences = () => {
    if (!peerConnectionRef.current) return;

    try {
      const videoTransceivers = peerConnectionRef.current.getTransceivers()
        .filter(t => t.sender.track && t.sender.track.kind === 'video');

      videoTransceivers.forEach(transceiver => {
        const capabilities = RTCRtpSender.getCapabilities('video');
        const codecPreferences = [
          'VP9',           // Best quality, good compression
          'VP8',           // Good quality, better compatibility
          'H264'           // Universal compatibility
        ];
        
        const preferredCodecs = capabilities.codecs.filter(codec => 
          codecPreferences.includes(codec.mimeType.split('/')[1])
        );
        
        if (preferredCodecs.length > 0) {
          transceiver.setCodecPreferences(preferredCodecs);
          console.log('Video codec preferences set:', preferredCodecs.map(c => c.mimeType));
        }
      });
    } catch (error) {
      console.log('Error setting video codec preferences:', error);
    }
  };

  // Apply video enhancement filters
  const applyVideoEnhancement = (videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    try {
      // CSS filters for video enhancement
      videoElement.style.filter = `
        brightness(1.05)
        contrast(1.1)
        saturate(1.05)
        hue-rotate(0deg)
        sepia(0)
        invert(0)
        opacity(1)
        blur(0px)
        grayscale(0)
      `;
      videoElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      videoElement.style.borderRadius = '8px';
      videoElement.style.objectFit = 'cover';
      videoElement.style.objectPosition = 'center';
      
      // Performance optimizations
      videoElement.style.willChange = 'transform';
      videoElement.style.transform = 'translateZ(0)';
      videoElement.style.backfaceVisibility = 'hidden';
      
      console.log('Video enhancement filters applied');
    } catch (error) {
      console.log('Error applying video enhancement:', error);
    }
  };

  // Connection monitoring effect - More aggressive monitoring
  useEffect(() => {
    if (!peerConnectionRef.current || !isConnectionSuccessful) return;

    const monitorConnection = () => {
      const connection = peerConnectionRef.current;
      if (!connection) return;

      // Check if connection is still active
      if (connection.connectionState === 'disconnected' || 
          connection.connectionState === 'failed' ||
          connection.iceConnectionState === 'disconnected' ||
          connection.iceConnectionState === 'failed') {
        
        console.log('Connection lost detected, attempting recovery...');
        setIsConnecting(true);
        setError('Connection lost. Attempting to reconnect...');
        
        // Reset retry count if we had a successful connection
        if (isConnectionSuccessful) {
          setConnectionRetryCount(0);
        }
        
        // Retry connection immediately
        setTimeout(() => {
          if (peerConnectionRef.current && connectionRetryCount < maxRetries) {
            console.log(`Retrying connection (attempt ${connectionRetryCount + 1}/${maxRetries})...`);
            setConnectionRetryCount(prev => prev + 1);
            setHasCreatedOffer(false);
            setHasReceivedOffer(false);
            createOffer();
          } else if (connectionRetryCount >= maxRetries) {
            setError('Connection failed after multiple attempts. Please try again.');
            setIsConnecting(false);
          }
        }, 1000); // Faster retry
      }
    };

    // Monitor connection every 2 seconds (very frequent)
    const interval = setInterval(monitorConnection, 2000);
    
    return () => clearInterval(interval);
  }, [isConnectionSuccessful, connectionRetryCount, maxRetries, roomId, partner.userId]);

  // Video quality monitoring effect
  useEffect(() => {
    if (!isConnectionSuccessful || !peerConnectionRef.current) return;

    // Start quality monitoring
    const startQualityMonitoring = () => {
      if (qualityMonitorRef.current) {
        clearInterval(qualityMonitorRef.current);
      }
      
      qualityMonitorRef.current = setInterval(monitorVideoQuality, 5000); // Check every 5 seconds
    };

    startQualityMonitoring();

    return () => {
      if (qualityMonitorRef.current) {
        clearInterval(qualityMonitorRef.current);
        qualityMonitorRef.current = null;
      }
    };
  }, [isConnectionSuccessful, videoQuality]);

  // Heartbeat effect to keep connection alive
  useEffect(() => {
    if (!socket || !isConnectionSuccessful) return;

    const heartbeat = () => {
      if (socket && socket.connected) {
        socket.emit('ping');
      }
    };

    // Send heartbeat every 5 seconds (very frequent)
    const heartbeatInterval = setInterval(heartbeat, 5000);
    
    return () => clearInterval(heartbeatInterval);
  }, [socket, isConnectionSuccessful]);

  // Tab visibility handling - Aggressive connection preservation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - maintaining connection aggressively');
        // Force video streams to keep playing even when tab is hidden
        if (localVideoRef.current) {
          localVideoRef.current.play().catch(e => console.log('Local video play error:', e));
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.play().catch(e => console.log('Remote video play error:', e));
        }
        
        // Send more frequent heartbeats when tab is hidden
        const hiddenHeartbeat = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit('ping');
          }
        }, 5000); // Every 5 seconds when hidden
        
        // Store interval to clear later
        (window as any).hiddenHeartbeat = hiddenHeartbeat;
        
      } else {
        console.log('Tab visible - ensuring connection is active');
        // Clear hidden heartbeat
        if ((window as any).hiddenHeartbeat) {
          clearInterval((window as any).hiddenHeartbeat);
          (window as any).hiddenHeartbeat = null;
        }
        
        // Ensure video streams are playing when tab becomes visible
        if (localVideoRef.current && localVideoRef.current.paused) {
          localVideoRef.current.play().catch(e => console.log('Local video play error:', e));
        }
        if (remoteVideoRef.current && remoteVideoRef.current.paused) {
          remoteVideoRef.current.play().catch(e => console.log('Remote video play error:', e));
        }
        
        // Check if connection is still active
        if (peerConnectionRef.current) {
          const connection = peerConnectionRef.current;
          if (connection.connectionState === 'disconnected' || 
              connection.connectionState === 'failed' ||
              connection.iceConnectionState === 'disconnected' ||
              connection.iceConnectionState === 'failed') {
            console.log('Connection lost during tab switch - attempting recovery...');
            setIsConnecting(true);
            setError('Connection lost. Attempting to reconnect...');
            
            // Retry connection immediately
            setTimeout(() => {
              if (peerConnectionRef.current) {
                console.log('Retrying connection after tab switch...');
                setHasCreatedOffer(false);
                setHasReceivedOffer(false);
                createOffer();
              }
            }, 500);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if ((window as any).hiddenHeartbeat) {
        clearInterval((window as any).hiddenHeartbeat);
        (window as any).hiddenHeartbeat = null;
      }
    };
  }, [isConnectionSuccessful, socket]);

  const games: { [key: string]: string } = {
    bgmi: 'BGMI',
    valorant: 'Valorant',
    freefire: 'Free Fire',
    csgo: 'CS:GO',
    fortnite: 'Fortnite',
    apex: 'Apex Legends',
    lol: 'League of Legends',
    dota2: 'Dota 2'
  };

  useEffect(() => {
    if (!socket) {
      console.error('Socket not available for MatchInterface');
      setError('Socket connection not available. Please refresh the page.');
      return;
    }

    if (!socket.connected) {
      console.error('Socket not connected for MatchInterface');
      setError('Socket connection lost. Please wait for reconnection or refresh the page.');
      
      // Try to reconnect
      const reconnectInterval = setInterval(() => {
        if (socket.connected) {
          clearInterval(reconnectInterval);
          setError('');
          // Re-join the room
          socket.emit('join-random-room', roomId);
        }
      }, 2000);
      
      return () => clearInterval(reconnectInterval);
    }

    console.log('Setting up socket listeners for MatchInterface, roomId:', roomId);

    // Join the random room
    socket.emit('join-random-room', roomId);
    console.log('Joining random room:', roomId);

    // Listen for messages
    socket.on('random-connection-message', (data: RandomConnectionMessageData) => {
      console.log('Received message:', data);
      const newMsg: Message = {
        sender: data.sender,
        message: data.message,
        timestamp: new Date(data.timestamp),
        isOwn: data.sender === user?._id
      };
      setMessages(prev => [...prev, newMsg]);
    });

    // Listen for WebRTC signals
    socket.on('webrtc-signal', (data: WebRTCSignalData) => {
      console.log('Received WebRTC signal:', data);
      // Only handle signals from our partner
      if (data.fromUserId === partner.userId) {
        handleWebRTCSignal(data);
      } else {
        console.log('Ignoring WebRTC signal from non-partner user:', data.fromUserId);
      }
    });

    // Listen for video state changes from partner
    socket.on('video-state-change', (data: { fromUserId: string; videoEnabled: boolean }) => {
      console.log('Received video state change from partner:', data);
      if (data.fromUserId === partner.userId) {
        console.log('Partner video state changed to:', data.videoEnabled ? 'ON' : 'OFF');
        
        // Force refresh the remote video element to show/hide partner's video
        if (remoteVideoRef.current && remoteStream) {
          // Temporarily remove and re-add the stream to force refresh
          remoteVideoRef.current.srcObject = null;
          setTimeout(() => {
            if (remoteVideoRef.current && remoteStream) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(e => console.log('Remote video refresh error:', e));
            }
          }, 100);
        }
      }
    });

    // Listen for partner disconnected
    socket.on('partner-disconnected', (data: { roomId: string; disconnectedUserId: string; reason?: string }) => {
      console.log('Partner disconnected event received:', data);
      if (data.roomId === roomId) {
        const reason = data.reason || 'disconnected';
        console.log('Partner disconnected, showing loading screen...');
        
        // Clear remote stream and show loading
        setRemoteStream(null);
        setIsConnecting(true);
        setError('');
        
        // Keep local stream and camera ON for remaining user
        // Don't call cleanup() or onDisconnect()
        console.log('Partner disconnected, keeping user in call with loading screen');
      }
    });

    // Listen for room joined confirmation
    socket.on('room-joined', (data: { roomId: string }) => {
      console.log('Joined room:', data.roomId);
      // When we join the room, if we're the first one, wait for partner
      // If we're the second one, the partner should already be there
      setTimeout(() => {
        if (isConnecting && peerConnectionRef.current && !hasCreatedOffer && !hasReceivedOffer) {
          console.log('Room joined, checking if partner is already there...');
          // Try to create offer after a short delay
          setTimeout(() => {
            if (isConnecting && !hasCreatedOffer && !hasReceivedOffer) {
              console.log('Creating offer after room join delay');
              createOffer();
            }
          }, 1000);
        }
      }, 500);
    });

    // Listen for when another user joins the room
    socket.on('user-joined-room', (data: { roomId: string; userId: string }) => {
      console.log('Another user joined room:', data.userId);
      // If we're still connecting and someone else joined, try to establish connection
      if (isConnecting && data.userId !== user?._id) {
        console.log('Partner joined, attempting to establish connection...');
        // Wait a bit more for the partner to fully join, then create offer
        setTimeout(() => {
          if (peerConnectionRef.current && isConnecting && !hasCreatedOffer && !hasReceivedOffer) {
            console.log('Creating offer after partner joined');
            createOffer();
          }
        }, 2000);
      }
    });

    // Listen for connection errors
    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error in MatchInterface:', error);
      setError('Connection error. Please refresh the page.');
    });

    // Listen for socket disconnect
    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected in MatchInterface:', reason);
      if (reason !== 'io client disconnect') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    return () => {
      console.log('Cleaning up socket listeners for MatchInterface');
      socket.off('random-connection-message');
      socket.off('webrtc-signal');
      socket.off('partner-disconnected');
      socket.off('room-joined');
      socket.off('user-joined-room');
      socket.off('video-state-change');
      socket.off('connect_error');
      socket.off('disconnect');
      // Don't emit leave-random-room here as it might break the socket connection
      // The backend will handle room cleanup when user disconnects
    };
  }, [socket, roomId, user?._id, partner.userId, isConnecting, hasCreatedOffer, hasReceivedOffer]);

  useEffect(() => {
    initializeMedia();
    
    // Set a timeout to stop connecting if it takes too long
    const connectionTimeout = setTimeout(() => {
      if (isConnecting && !remoteStream && !isConnectionSuccessful && peerConnectionRef.current?.connectionState !== 'connected') {
        console.log('Connection timeout - stopping connecting state');
        setIsConnecting(false);
        setError('Connection timeout. Please try again or use the retry button.');
      }
    }, 25000); // 25 seconds timeout
    
    // Also set a shorter timeout to force retry if no progress
    const retryTimeout = setTimeout(() => {
      if (isConnecting && peerConnectionRef.current && 
          peerConnectionRef.current.connectionState === 'new' && 
          !hasCreatedOffer && !hasReceivedOffer && !remoteStream && !isConnectionSuccessful) {
        console.log('No progress made, forcing retry...');
        createOffer();
      }
    }, 8000); // 8 seconds timeout
    
    // Set another timeout to force retry if still connecting after 12 seconds
    const forceRetryTimeout = setTimeout(() => {
      if (isConnecting && peerConnectionRef.current && !remoteStream && !isConnectionSuccessful) {
        console.log('Still connecting after 12 seconds, forcing complete retry...');
        setHasCreatedOffer(false);
        setHasReceivedOffer(false);
        createOffer();
      }
    }, 12000); // 12 seconds timeout

    return () => {
      clearTimeout(connectionTimeout);
      clearTimeout(retryTimeout);
      clearTimeout(forceRetryTimeout);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect to handle remote stream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Setting remote video stream:', remoteStream);
      console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Apply video enhancement
      applyVideoEnhancement(remoteVideoRef.current);
      
      // Clear any connection errors since we have a remote stream
      setError('');
      setIsConnecting(false);
      
      // Try to play the video
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Remote video started playing successfully');
          })
          .catch(e => {
            console.log('Video play error:', e);
            // Try to reload the video element
            setTimeout(() => {
              if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = null;
                setTimeout(() => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    applyVideoEnhancement(remoteVideoRef.current);
                    remoteVideoRef.current.play().catch(e2 => console.log('Retry play error:', e2));
                  }
                }, 100);
              }
            }, 1000);
          });
      }
    }
  }, [remoteStream]);

  // Effect to handle local stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Setting local video stream');
      localVideoRef.current.srcObject = localStream;
      
      // Apply video enhancement
      applyVideoEnhancement(localVideoRef.current);
      
      // Try to play the video
      const playPromise = localVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Local video started playing successfully');
          })
          .catch(e => {
            console.log('Local video play error:', e);
          });
      }
    }
  }, [localStream]);

  const initializeMedia = async () => {
    try {
      // Detect mobile device for optimization
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Enhanced video constraints for better quality
      let constraints = {
        video: videoEnabled ? {
          // Resolution settings - higher quality
          width: { ideal: isMobile ? 1280 : 1920, max: isMobile ? 1920 : 2560, min: 640 },
          height: { ideal: isMobile ? 720 : 1080, max: isMobile ? 1080 : 1440, min: 480 },
          frameRate: { ideal: isMobile ? 30 : 60, max: isMobile ? 60 : 120, min: 15 },
          
          // Quality settings
          aspectRatio: 16/9,
          facingMode: 'user',
          
          // Advanced constraints
          resizeMode: 'crop-and-scale',
          whiteBalanceMode: 'continuous',
          exposureMode: 'continuous',
          focusMode: 'continuous',
          
          // Google-specific optimizations for better quality
          googCpuOveruseDetection: true,
          googCpuUnderuseThreshold: 55,
          googCpuOveruseThreshold: 85,
          googCpuOveruseEncodeUsage: true,
          googCpuOveruseDecodeUsage: true,
          googCpuOveruseEncodeRsdThreshold: 0.5,
          googCpuOveruseDecodeRsdThreshold: 0.5,
          
          // Bandwidth optimization
          googLeakyBucket: true,
          googScreencastMinBitrate: 400,
          googScreencastMaxBitrate: 2000,
          
          // Quality control
          googHighStartBitrate: true,
          googVeryHighStartBitrate: true,
          googCpuAdaptation: true,
          googSuspendBelowMinBitrate: true,
          googScreencastMinPixelsPerSecond: 1000000,
          googScreencastMaxPixelsPerSecond: 10000000
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2, // Stereo for better quality
          volume: 1.0, // Full volume range
          // Advanced noise suppression
          noiseSuppressionLevel: 'high',
          echoCancellationType: 'system',
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
          // Enhanced audio quality
          googNoiseSuppressionLevel: 2,
          googEchoCancellationLevel: 2,
          googAutoGainControlLevel: 2,
          googHighpassFilterLevel: 1,
          googTypingNoiseDetectionLevel: 1,
          latency: 0.01 // 10ms latency
        }
      };

      let stream;
      try {
        // Use global camera context
        stream = await startCamera();
        if (!stream) {
          throw new Error('Failed to start camera');
        }
        console.log('Media stream obtained successfully via global camera context');
      } catch (videoError) {
        console.log('Video failed, trying audio only:', videoError);
        // If video fails, try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
              channelCount: 1,
              volume: 0.8,
              // Advanced noise suppression
              noiseSuppressionLevel: 'high',
              echoCancellationType: 'system',
              googEchoCancellation: true,
              googAutoGainControl: true,
              googNoiseSuppression: true,
              googHighpassFilter: true,
              googTypingNoiseDetection: true,
              googAudioMirroring: false
            }
          });
          setIsVideoOn(false);
          console.log('Audio-only stream obtained successfully');
        } catch (audioError) {
          console.error('Both video and audio failed:', audioError);
          setError('Unable to access camera/microphone. Please check permissions and try again.');
          setIsConnecting(false);
          return;
        }
      }

      setLocalStream(stream);

      // Set initial video state based on videoEnabled prop
      if (!videoEnabled) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          setIsVideoOn(false);
        }
      } else {
        // Ensure video is enabled if videoEnabled is true
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = true;
          setIsVideoOn(true);
        }
      }

      // Ensure audio is working properly
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('Audio track initialized:', audioTrack.label);
        console.log('Audio track enabled:', audioTrack.enabled);
        console.log('Audio track settings:', audioTrack.getSettings());
        setIsMicOn(audioTrack.enabled);
        
        // Add event listeners for audio track state changes
        audioTrack.onended = () => {
          console.log('Local audio track ended');
        };
        audioTrack.onmute = () => {
          console.log('Local audio track muted');
          setIsMicOn(false);
        };
        audioTrack.onunmute = () => {
          console.log('Local audio track unmuted');
          setIsMicOn(true);
        };
      } else {
        console.warn('No audio track found in local stream');
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Try to play the video immediately
        localVideoRef.current.play().catch(e => console.log('Initial local video play error:', e));
        
        // Add event listeners to prevent browser from pausing local video
        localVideoRef.current.addEventListener('pause', () => {
          console.log('Local video paused by browser - attempting to resume');
          if (localVideoRef.current) {
            localVideoRef.current.play().catch(e => console.log('Local video resume error:', e));
          }
        });
        
        localVideoRef.current.addEventListener('suspend', () => {
          console.log('Local video suspended by browser - attempting to resume');
          if (localVideoRef.current) {
            localVideoRef.current.play().catch(e => console.log('Local video resume error:', e));
          }
        });
      }

      // Initialize WebRTC
      initializeWebRTC(stream);
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow permissions and refresh.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError' || error.message.includes('Device in use')) {
        setError('Camera/microphone is in use by another application. Please close other apps using camera/microphone and try again.');
      } else {
        setError('Failed to access camera/microphone: ' + error.message);
      }
      
      setIsConnecting(false);
    }
  };

  const initializeWebRTC = (stream: MediaStream) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.counterpath.com' },
        { urls: 'stun:stun.1und1.de' },
        { urls: 'stun:stun.gmx.net' },
        { urls: 'stun:stun.schlund.de' }
      ],
      iceCandidatePoolSize: 30, // More candidates for better connectivity
      iceTransportPolicy: 'all' as RTCIceTransportPolicy,
      bundlePolicy: 'max-bundle' as RTCBundlePolicy,
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    console.log('WebRTC peer connection created');

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      console.log('Adding track to peer connection:', track.kind, track.enabled, track.readyState);
      const sender = peerConnection.addTrack(track, stream);
      console.log('Track sender created:', sender);
      
      // Ensure track is enabled and prevent browser from pausing
      if (track.readyState === 'live') {
        track.enabled = true;
        
        // Add event listeners to prevent browser from pausing tracks
        track.onmute = () => {
          console.log(`Local ${track.kind} track muted - attempting to unmute`);
          // Force unmute if browser tries to mute
          setTimeout(() => {
            if (track.readyState === 'live') {
              track.enabled = true;
              if (track.kind === 'audio') {
                setIsMicOn(true);
              }
            }
          }, 100);
        };
        
        track.onunmute = () => {
          console.log(`Local ${track.kind} track unmuted`);
          if (track.kind === 'audio') {
            setIsMicOn(true);
          }
        };
        
        track.onended = () => {
          console.log(`Local ${track.kind} track ended`);
          if (track.kind === 'audio') {
            setIsMicOn(false);
          }
        };
      }
    });
    
    // Log all senders to verify tracks are added
    setTimeout(() => {
      const senders = peerConnection.getSenders();
      console.log('Peer connection senders:', senders.map(s => ({
        track: s.track?.kind,
        enabled: s.track?.enabled
      })));
    }, 1000);

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      console.log('Remote stream tracks:', event.streams[0].getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      console.log('Number of streams:', event.streams.length);
      
      if (event.streams && event.streams.length > 0) {
        const stream = event.streams[0];
        console.log('Setting remote stream with tracks:', stream.getTracks().length);
        
        // Ensure video tracks are enabled and prevent browser from pausing them
        stream.getVideoTracks().forEach(track => {
          console.log('Remote video track:', track.kind, track.enabled, track.readyState);
          if (track.readyState === 'live') {
            track.enabled = true;
            // Add event listener for track ended
            track.onended = () => {
              console.log('Remote video track ended');
            };
            track.onmute = () => {
              console.log('Remote video track muted - attempting to unmute');
              // Force unmute if browser tries to mute
              setTimeout(() => {
                if (track.readyState === 'live') {
                  track.enabled = true;
                }
              }, 100);
            };
            track.onunmute = () => {
              console.log('Remote video track unmuted');
            };
          }
        });
        
        // Ensure audio tracks are enabled and properly configured
        stream.getAudioTracks().forEach(track => {
          console.log('Remote audio track:', track.kind, track.enabled, track.readyState);
          if (track.readyState === 'live') {
            track.enabled = true;
            
            // Add event listeners for audio track state changes
            track.onended = () => {
              console.log('Remote audio track ended');
            };
            track.onmute = () => {
              console.log('Remote audio track muted - attempting to unmute');
              // Force unmute if browser tries to mute
              setTimeout(() => {
                if (track.readyState === 'live') {
                  track.enabled = true;
                }
              }, 100);
            };
            track.onunmute = () => {
              console.log('Remote audio track unmuted');
            };
          }
        });
        
        setRemoteStream(stream);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          // Ensure the video plays and prevent browser from pausing it
          remoteVideoRef.current.play().catch(e => console.log('Video play error:', e));
          
          // Add event listeners to prevent browser from pausing video
          remoteVideoRef.current.addEventListener('pause', () => {
            console.log('Remote video paused by browser - attempting to resume');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(e => console.log('Video resume error:', e));
            }
          });
          
          remoteVideoRef.current.addEventListener('suspend', () => {
            console.log('Remote video suspended by browser - attempting to resume');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(e => console.log('Video resume error:', e));
            }
          });
        }
        
        // Stop connecting state and clear errors immediately
        setIsConnecting(false);
        setIsConnectionSuccessful(true);
        setError(''); // Clear any errors immediately
        console.log('Connection established successfully!');
        
        // Double-check to clear any remaining errors after a short delay
        setTimeout(() => {
          setError('');
        }, 500);
      } else {
        console.warn('No streams in track event');
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('WebRTC connection established successfully!');
        setIsConnecting(false);
        setError(''); // Clear any errors
      } else if (peerConnection.connectionState === 'connecting') {
        console.log('WebRTC connection is connecting...');
        // Don't set error yet, let it try to connect
      } else if (peerConnection.connectionState === 'failed') {
        console.log('WebRTC connection failed - attempting recovery...');
        setIsConnecting(true);
        setError('Connection failed. Attempting to reconnect...');
        
        // Immediate retry
        setTimeout(() => {
          if (peerConnectionRef.current) {
            console.log('Retrying connection...');
            setHasCreatedOffer(false);
            setHasReceivedOffer(false);
            createOffer();
          }
        }, 500); // Faster retry
      } else if (peerConnection.connectionState === 'disconnected') {
        console.log('WebRTC connection disconnected - attempting recovery...');
        setIsConnecting(true);
        setError('Connection lost. Attempting to reconnect...');
        
        // Immediate retry
        setTimeout(() => {
          if (peerConnectionRef.current) {
            console.log('Retrying connection...');
            setHasCreatedOffer(false);
            setHasReceivedOffer(false);
            createOffer();
          }
        }, 500); // Faster retry
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected') {
        console.log('ICE connection established!');
        setIsConnecting(false);
        setError(''); // Clear any errors
      } else if (peerConnection.iceConnectionState === 'checking') {
        console.log('ICE connection checking...');
        // This is normal, let it continue
      } else if (peerConnection.iceConnectionState === 'failed') {
        console.log('ICE connection failed - attempting recovery...');
        setIsConnecting(true);
        setError('ICE connection failed. Attempting to reconnect...');
        
        // Restart ICE and retry immediately
        setTimeout(() => {
          if (peerConnectionRef.current) {
            console.log('Restarting ICE and retrying...');
            peerConnectionRef.current.restartIce();
            setHasCreatedOffer(false);
            setHasReceivedOffer(false);
            createOffer();
          }
        }, 500); // Faster retry
      } else if (peerConnection.iceConnectionState === 'disconnected') {
        console.log('ICE connection disconnected - attempting recovery...');
        setIsConnecting(true);
        setError('ICE connection lost. Attempting to reconnect...');
        
        // Immediate retry
        setTimeout(() => {
          if (peerConnectionRef.current) {
            console.log('Retrying ICE connection...');
            setHasCreatedOffer(false);
            setHasReceivedOffer(false);
            createOffer();
          }
        }, 500); // Faster retry
      }
    };

    // Handle ICE gathering state changes
    peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', peerConnection.iceGatheringState);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate');
        socket.emit('webrtc-signal', {
          roomId,
          signal: { type: 'ice-candidate', candidate: event.candidate },
          targetUserId: partner.userId
        });
      } else if (!event.candidate) {
        console.log('ICE gathering complete');
      }
    };

    // Set video codec preferences
    setVideoCodecPreferences();
    
    // Create and send offer after a short delay to ensure both users are ready
    // Use a random delay to avoid both users creating offers at the same time
    const randomDelay = Math.random() * 1000 + 500; // 0.5-1.5 seconds (faster)
    console.log(`Will create offer in ${randomDelay}ms`);
    
    setTimeout(() => {
      if (isConnecting && !hasCreatedOffer && !hasReceivedOffer) {
        console.log('Creating initial offer...');
        createOffer();
      }
    }, randomDelay);
    
    // Also try to create offer when partner joins the room
    // This ensures we don't miss the partner joining event
    
    // Add a backup offer creation after a longer delay
    setTimeout(() => {
      if (isConnecting && !hasCreatedOffer && !hasReceivedOffer && peerConnectionRef.current) {
        console.log('Backup offer creation triggered...');
        createOffer();
      }
    }, 3000);
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current || hasCreatedOffer) {
      console.log('Cannot create offer:', { 
        hasPeerConnection: !!peerConnectionRef.current, 
        hasCreatedOffer 
      });
      return;
    }

    try {
      console.log('Creating WebRTC offer...');
      setHasCreatedOffer(true);
      
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log('Offer created:', offer);
      
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Local description set');

      if (socket && socket.connected) {
        console.log('Sending offer to partner:', partner.userId);
        socket.emit('webrtc-signal', {
          roomId,
          signal: { type: 'offer', sdp: offer },
          targetUserId: partner.userId
        });
        console.log('Offer sent successfully');
      } else {
        console.error('Socket not available or not connected:', { 
          hasSocket: !!socket, 
          isConnected: socket?.connected 
        });
        setError('Socket connection lost. Cannot send offer.');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to create connection offer. Retrying...');
      setHasCreatedOffer(false);
      
      // Retry after a short delay
      setTimeout(() => {
        if (isConnecting && !hasCreatedOffer && !hasReceivedOffer) {
          console.log('Retrying offer creation...');
          createOffer();
        }
      }, 2000);
    }
  };

  const handleWebRTCSignal = async (data: WebRTCSignalData) => {
    if (!peerConnectionRef.current) {
      console.log('No peer connection available, initializing...');
      return;
    }

    try {
      const { signal, fromUserId } = data;
      console.log('Processing signal:', signal.type, 'from:', fromUserId);

      if (signal.type === 'offer' && signal.sdp) {
        console.log('Setting remote description (offer)');
        setHasReceivedOffer(true);
        
        // Check if we already have a remote description
        if (peerConnectionRef.current.remoteDescription) {
          console.log('Already have remote description, ignoring offer');
          return;
        }
        
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        console.log('Remote description set successfully');
        
        console.log('Creating answer');
        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log('Local description set successfully');

        if (socket && socket.connected) {
          console.log('Sending answer to partner:', partner.userId);
          socket.emit('webrtc-signal', {
            roomId,
            signal: { type: 'answer' as const, sdp: answer },
            targetUserId: partner.userId
          });
          console.log('Answer sent successfully');
        } else {
          console.error('Socket not available for sending answer');
        }
      } else if (signal.type === 'answer' && signal.sdp) {
        console.log('Setting remote description (answer)');
        
        // Check if we already have a remote description
        if (peerConnectionRef.current.remoteDescription) {
          console.log('Already have remote description, ignoring answer');
          return;
        }
        
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        console.log('Remote description (answer) set successfully');
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        console.log('Adding ICE candidate');
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          console.log('ICE candidate added successfully');
        } catch (iceError) {
          console.warn('Failed to add ICE candidate:', iceError);
          // This is often not critical, so we don't set an error
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
      setError('Connection error: ' + (error as Error).message);
      
      // If we fail to handle an offer, try to create our own offer
      if (data.signal.type === 'offer') {
        console.log('Failed to handle offer, creating our own offer...');
        setHasReceivedOffer(false);
        setTimeout(() => {
          if (isConnecting && peerConnectionRef.current && !hasCreatedOffer) {
            createOffer();
          }
        }, 2000);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setIsMicOn(newState);
        console.log('Microphone toggled:', newState ? 'ON' : 'OFF');
        
        // Update WebRTC connection if it exists
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const audioSender = senders.find(sender => sender.track?.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          }
        }
      } else {
        console.error('No audio track found');
      }
    } else {
      console.error('No local stream available');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setIsVideoOn(newState);
        console.log('Video toggled:', newState ? 'ON' : 'OFF');
        
        // Force refresh the local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        // Update WebRTC connection if it exists
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            console.log('Replacing video track in WebRTC connection');
            videoSender.replaceTrack(videoTrack).then(() => {
              console.log('Video track replaced successfully');
            }).catch(error => {
              console.error('Error replacing video track:', error);
            });
          } else {
            console.warn('No video sender found in WebRTC connection');
          }
        }
        
        // Also notify the partner about the video state change
        if (socket) {
          socket.emit('video-state-change', {
            roomId,
            videoEnabled: newState,
            targetUserId: partner.userId
          });
        }
      } else {
        console.error('No video track found');
      }
    } else {
      console.error('No local stream available');
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    try {
      await axios.post('/api/random-connections/send-message', {
        roomId,
        message: newMessage.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Add message to local state
      const newMsg: Message = {
        sender: user?._id || '',
        message: newMessage.trim(),
        timestamp: new Date(),
        isOwn: true
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const cleanup = () => {
    console.log('Cleaning up MatchInterface resources...');
    
    // Clear quality monitoring
    if (qualityMonitorRef.current) {
      clearInterval(qualityMonitorRef.current);
      qualityMonitorRef.current = null;
    }
    
    // Use global camera context to stop camera
    globalStopCamera();
    setLocalStream(null);
    
    // Close peer connection
    if (peerConnectionRef.current) {
      console.log('Closing peer connection...');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset all states
    setIsConnecting(false);
    setHasCreatedOffer(false);
    setHasReceivedOffer(false);
    setRemoteStream(null);
    setIsConnectionSuccessful(false);
    setError('');
    setMessages([]);
    setNewMessage('');
    setVideoQuality('high');
    setIsQualityAdjusting(false);
    
    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    console.log('MatchInterface cleanup completed');
  };

  const stopCamera = () => {
    console.log('Stopping camera access...');
    globalStopCamera();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // Monitor global camera state changes
  useEffect(() => {
    console.log('Camera state changed:', { isCameraActive, hasCurrentStream: !!currentStream });
    
    if (!isCameraActive && localStream) {
      console.log('Global camera stopped, clearing local stream');
      setLocalStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    } else if (isCameraActive && currentStream && !localStream) {
      console.log('Global camera started, setting local stream');
      setLocalStream(currentStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = currentStream;
      }
    }
  }, [isCameraActive, currentStream, localStream]);

  const handleReport = () => {
    setShowReportModal(true);
    // TODO: Implement report functionality
    console.log('Report user:', partner.userId);
  };

  const handleDisconnectClick = () => {
    console.log('User clicked disconnect, stopping camera and disconnecting...');
    // Stop camera access for the user who disconnects
    stopCamera();
    // Call the parent's disconnect handler
    onDisconnect();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Clean Header */}
        <div className="flex-shrink-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-blue-500">
                  <img 
                    src={partner.avatar || '/default-avatar.png'} 
                    alt={partner.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-semibold text-white truncate">{partner.displayName}</h2>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <p className="text-gray-400 text-xs truncate">@{partner.username}</p>
                  <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded text-xs flex-shrink-0">
                    <Gamepad2 className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400 font-medium">{games[selectedGame]}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleReport}
                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Report User"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Video Area - Picture-in-Picture Layout */}
        <div className="flex-1 flex flex-col lg:flex-row p-2 sm:p-4 gap-2 sm:gap-4 min-h-0">
          {/* Main Video Container - Partner Video */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            {error && !isConnectionSuccessful && (
              <div className="absolute top-4 left-4 right-4 z-20 p-3 bg-red-500/90 text-white rounded-xl text-sm">
                {error}
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="text-center p-6 bg-gray-900/90 rounded-2xl border border-gray-700">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <h3 className="text-white font-semibold mb-2">
                    {remoteStream ? 'Connecting...' : 'Looking for next partner...'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {remoteStream 
                      ? `Establishing connection with ${partner.displayName}`
                      : 'Searching for another gamer to connect with'
                    }
                  </p>
                  
                  {/* Return to Home Button - Only show when not connecting to existing partner */}
                  {!remoteStream && onReturnToHome && (
                    <button
                      onClick={onReturnToHome}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Return to Home
                    </button>
                  )}
                </div>
              </div>
            )}

            {remoteStream ? (
              <div className="w-full h-full relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log('Remote video metadata loaded');
                    console.log('Remote video muted:', remoteVideoRef.current?.muted);
                    console.log('Remote video volume:', remoteVideoRef.current?.volume);
                  }}
                  onCanPlay={() => {
                    console.log('Remote video can play');
                    // Ensure audio is not muted
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.muted = false;
                      remoteVideoRef.current.volume = 1.0;
                    }
                  }}
                  onError={(e) => console.error('Remote video error:', e)}
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-semibold text-xs">{partner.displayName}</span>
                  </div>
                </div>
                
                {/* Video Quality Indicator */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      videoQuality === 'ultra' ? 'bg-purple-500' :
                      videoQuality === 'high' ? 'bg-green-500' :
                      videoQuality === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-white font-semibold text-xs uppercase">
                      {videoQuality === 'ultra' ? '4K' : 
                       videoQuality === 'high' ? 'HD' : 
                       videoQuality === 'medium' ? 'SD' : 'LOW'}
                    </span>
                    {isQualityAdjusting && (
                      <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  {partner.avatar ? (
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-3 border-blue-500 shadow-xl">
                        <img 
                          src={partner.avatar} 
                          alt={partner.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold border-3 border-blue-500 shadow-xl">
                        {getInitials(partner.displayName)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg animate-pulse"></div>
                    </div>
                  )}
                  <h3 className="text-white font-bold text-lg mb-2">{partner.displayName}</h3>
                  <p className="text-gray-300 text-sm">
                    {isConnecting ? (
                      <span className="flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Connecting...
                      </span>
                    ) : (
                      'Video is off'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Picture-in-Picture: Self Video Overlay */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-16 sm:w-40 sm:h-28 bg-gradient-to-br from-gray-900 to-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600 z-10">
              {localStream ? (
                <div className="w-full h-full relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className={`w-1 h-1 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                      <span className="text-white font-semibold text-xs">You</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  {user?.profile?.avatar ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={user.profile.avatar} 
                        alt="Your Avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-1 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-sm font-bold border-2 border-green-500 shadow-xl">
                        {getInitials(user?.profile?.displayName || user?.username || 'You')}
                      </div>
                      <p className="text-white font-bold text-xs mb-0.5">You</p>
                      <p className="text-gray-300 text-xs">Ready</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Control Bar - Lower Position on Video */}
            <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 z-20 w-full px-2 sm:px-0">
              <div className={`flex items-center justify-center space-x-2 sm:space-x-4 bg-black/90 backdrop-blur-xl px-4 py-3 rounded-2xl sm:rounded-3xl border border-gray-600/50 shadow-2xl sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:shadow-none ${
                isConnecting && !remoteStream ? 'opacity-50 pointer-events-none' : ''
              }`}>
                {/* Mic Control */}
                <button
                  onClick={toggleMic}
                  disabled={isConnecting && !remoteStream}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isMicOn 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'
                  } ${isConnecting && !remoteStream ? 'cursor-not-allowed' : ''}`}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                {/* Video Control */}
                <button
                  onClick={toggleVideo}
                  disabled={isConnecting && !remoteStream}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isVideoOn 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'
                  } ${isConnecting && !remoteStream ? 'cursor-not-allowed' : ''}`}
                  title={isVideoOn ? 'Turn off Video' : 'Turn on Video'}
                >
                  {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                {/* Divider - Hidden on mobile */}
                <div className="hidden sm:block w-px h-8 bg-gray-500/50"></div>

                {/* Skip Match */}
                <button
                  onClick={onNextMatch}
                  disabled={isConnecting && !remoteStream}
                  className={`p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/25 ${
                    isConnecting && !remoteStream ? 'cursor-not-allowed' : ''
                  }`}
                  title="Skip to Next Match"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Report User - Hidden on mobile */}
                <button
                  onClick={handleReport}
                  disabled={isConnecting && !remoteStream}
                  className={`hidden sm:block p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/25 ${
                    isConnecting && !remoteStream ? 'cursor-not-allowed' : ''
                  }`}
                  title="Report User"
                >
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* End Call */}
                <button
                  onClick={handleDisconnectClick}
                  disabled={isConnecting && !remoteStream}
                  className={`p-2 sm:p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 ${
                    isConnecting && !remoteStream ? 'cursor-not-allowed' : ''
                  }`}
                  title="End Call"
                >
                  <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="w-full lg:w-72 bg-gray-900 border-t lg:border-l border-gray-800 flex flex-col h-64 lg:h-auto">
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center text-sm">
                  <MessageCircle className="w-3 h-3 mr-1.5 text-blue-400" />
                  Chat
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 text-xs font-medium">Live</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-1">Chat with {partner.displayName}</p>
            </div>

            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2"
            >
              {messages.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs font-medium mb-1">Start the conversation!</p>
                  <p className="text-gray-500 text-xs">Send a message to begin chatting</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-2 rounded-lg ${
                      msg.isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      <p className="text-xs leading-relaxed">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${partner.displayName}...`}
                  className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchInterface;

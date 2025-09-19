import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

interface CameraContextType {
  startCamera: () => Promise<MediaStream | null>;
  stopCamera: () => void;
  isCameraActive: boolean;
  currentStream: MediaStream | null;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};

interface CameraProviderProps {
  children: React.ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const currentStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      // Stop any existing camera first
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
        setCurrentStream(null);
        setIsCameraActive(false);
      }

      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      currentStreamRef.current = stream;
      setCurrentStream(stream);
      setIsCameraActive(true);
      console.log('Camera started successfully');
      
      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      setIsCameraActive(false);
      setCurrentStream(null);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    try {
      console.log('Stopping camera...');
      
      // Stop current stream
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        currentStreamRef.current = null;
      }
      
      // Also stop any media tracks from DOM elements
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach(element => {
        const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
        if (mediaElement.srcObject) {
          const stream = mediaElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            console.log('Stopping DOM track:', track.kind);
            track.stop();
          });
          mediaElement.srcObject = null;
        }
      });
      
      setCurrentStream(null);
      setIsCameraActive(false);
      console.log('Camera stopped successfully');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }, []);

  // Auto-stop camera only when component unmounts (not on tab switch)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera();
    };

    // Removed visibility change listener - don't stop camera on tab switch
    // The MatchInterface component handles tab visibility for video calls
    // This prevents camera from stopping when user switches tabs during video calls

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopCamera();
    };
  }, [stopCamera]);

  const value: CameraContextType = {
    startCamera,
    stopCamera,
    isCameraActive,
    currentStream
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

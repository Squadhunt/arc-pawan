import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  Image, 
  Send
} from 'lucide-react';
import axios from 'axios';
import OptimizedImage from './OptimizedImage';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length + media.length > 5) {
      setError('Maximum 5 media files allowed');
      return;
    }

    // Check file sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = validFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 50MB.`);
      return;
    }

    setMedia([...media, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
    setMediaPreview(mediaPreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write some content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postData = new FormData();
      postData.append('text', content);
      postData.append('postType', 'general');
      
      media.forEach(file => {
        postData.append('media', file);
      });

      await axios.post('/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setContent('');
      setMedia([]);
      setMediaPreview([]);
      setError('');
      
      // Close modal and refresh posts
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setContent('');
      setMedia([]);
      setMediaPreview([]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Create New Post</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-error-500/20 border border-error-500/30 text-error-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <img
              src={user?.profilePicture || user?.profile?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo='}
              alt="Your profile"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm sm:text-base truncate">{user?.username || 'User'}</p>
              <p className="text-xs sm:text-sm text-gray-400">Share your thoughts</p>
            </div>
          </div>

          {/* Content */}
          <div className="border border-gray-700 rounded-xl p-3 sm:p-4">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's happening in your gaming world?"
              rows={4}
              className="w-full bg-transparent border-none text-white placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base"
              maxLength={1000}
            />
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-700">
              <span className="text-xs sm:text-sm text-gray-400">
                {content.length}/1000
              </span>
              <div className="flex items-center space-x-2">
                <label className="p-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors mobile-touch-target">
                  <Image className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mediaPreview.map((preview, index) => (
                <div key={index} className="relative">
                  {media[index]?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      controls
                      className="w-full h-24 sm:h-32 rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Media preview"
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors mobile-touch-target"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-gray-300 hover:text-white transition-colors disabled:opacity-50 text-sm sm:text-base mobile-touch-target"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base mobile-touch-target"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;

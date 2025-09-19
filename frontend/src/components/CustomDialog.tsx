import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  showCancelButton?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showCancelButton = false,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-2 border-gray-200 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className={`px-6 py-4 rounded-t-xl border-b ${getBackgroundColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {showCancelButton && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;

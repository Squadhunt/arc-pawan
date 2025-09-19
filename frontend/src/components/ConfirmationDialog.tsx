import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'danger';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'text-yellow-500',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700',
          iconBg: 'bg-yellow-100'
        };
      case 'danger':
        return {
          icon: 'text-red-500',
          confirmButton: 'bg-red-600 hover:bg-red-700',
          iconBg: 'bg-red-100'
        };
      default:
        return {
          icon: 'text-blue-500',
          confirmButton: 'bg-blue-600 hover:bg-blue-700',
          iconBg: 'bg-blue-100'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              <AlertCircle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

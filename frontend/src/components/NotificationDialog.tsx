import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'text-green-500',
          button: 'bg-green-600 hover:bg-green-700',
          iconBg: 'bg-green-100',
          IconComponent: CheckCircle
        };
      case 'error':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700',
          iconBg: 'bg-red-100',
          IconComponent: AlertCircle
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          iconBg: 'bg-yellow-100',
          IconComponent: AlertCircle
        };
      default:
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          iconBg: 'bg-blue-100',
          IconComponent: Info
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
              <IconComponent className={`w-5 h-5 ${styles.icon}`} />
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
        <div className="flex items-center justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors ${styles.button}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDialog;

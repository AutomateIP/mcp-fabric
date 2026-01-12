/**
 * Large slide-in panel component for detailed views
 * Takes advantage of more screen space than traditional modals
 */

import { useEffect } from 'react';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'default' | 'large' | 'full';
}

export default function SlidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'default'
}: SlidePanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeWidths = {
    default: '85vw',
    large: '100vw',
    full: '100vw'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-10' : 'bg-opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide Panel */}
      <div className="fixed inset-y-0 right-0 flex">
        <div
          className={`relative transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: sizeWidths[size], maxWidth: '100vw' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-title"
        >
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-start justify-between px-6 py-6">
                <div className="flex-1 min-w-0">
                  <h2
                    id="panel-title"
                    className="text-2xl font-bold text-neutral-900 tracking-tight"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 flex-shrink-0 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors duration-200"
                  aria-label="Close panel"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

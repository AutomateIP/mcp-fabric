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

  const sizeClasses = {
    default: { width: 'w-[85vw] max-w-4xl', position: 'right-0', transform: true },
    large: { width: 'inset-x-0', position: '', transform: false },
    full: { width: 'inset-x-0', position: '', transform: false }
  };

  const config = sizeClasses[size];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-10 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide Panel */}
      <div
        className={`fixed inset-y-0 ${config.position} ${config.width} ${
          config.transform
            ? `transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
            : `transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
          <div className="flex h-full flex-col bg-white shadow-2xl">
            {/* Header - Enhanced with better spacing */}
            <div className="border-b-2 border-neutral-200 bg-gradient-to-r from-primary-50 via-white to-primary-50/30">
              <div className="flex items-start justify-between px-8 py-6">
                <div className="flex-1 min-w-0">
                  <h2
                    id="panel-title"
                    className="text-3xl font-bold text-neutral-900 tracking-tight"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-2 text-base text-neutral-600">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-6 flex-shrink-0 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all duration-200 hover:scale-105"
                  aria-label="Close panel"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable with better spacing, full width */}
            <div className="flex-1 overflow-y-auto bg-neutral-50/30">
              <div className="px-8 py-8">
                {children}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

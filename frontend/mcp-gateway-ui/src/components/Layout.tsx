/**
 * Main layout component with navigation
 * Updated to follow UI Guidelines: consistent spacing, clear hierarchy, accessible navigation
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Default to light mode unless explicitly set to dark in localStorage
    const savedTheme = localStorage.getItem('theme');
    const initialDark = savedTheme === 'dark';

    setIsDark(initialDark);

    // Explicitly set or remove the dark class
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Navigation - Clear visual hierarchy with proper spacing */}
      <nav className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo/Title with clear hierarchy */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-neutral-900 dark:!text-white">MCP Fabric</h1>
              </div>

              {/* Navigation links - Simple, obvious navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                <Link
                  to="/"
                  className={`
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors duration-200
                    ${isActive('/')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:!text-white dark:hover:!text-white dark:hover:bg-neutral-700'
                    }
                  `}
                  aria-current={isActive('/') ? 'page' : undefined}
                >
                  Dashboard
                </Link>
                <Link
                  to="/servers"
                  className={`
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors duration-200
                    ${isActive('/servers')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:!text-white dark:hover:!text-white dark:hover:bg-neutral-700'
                    }
                  `}
                  aria-current={isActive('/servers') ? 'page' : undefined}
                >
                  Servers
                </Link>
                <Link
                  to="/instances"
                  className={`
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors duration-200
                    ${isActive('/instances')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:!text-white dark:hover:!text-white dark:hover:bg-neutral-700'
                    }
                  `}
                  aria-current={isActive('/instances') ? 'page' : undefined}
                >
                  Instances
                </Link>
                <Link
                  to="/tools"
                  className={`
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors duration-200
                    ${isActive('/tools')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:!text-white dark:hover:!text-white dark:hover:bg-neutral-700'
                    }
                  `}
                  aria-current={isActive('/tools') ? 'page' : undefined}
                >
                  Tools
                </Link>
              </div>
            </div>

            {/* Dark mode toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:!text-white dark:hover:!text-white dark:hover:bg-neutral-700 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content - Full width with consistent spacing */}
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-section">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

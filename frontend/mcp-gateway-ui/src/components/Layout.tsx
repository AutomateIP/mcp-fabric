/**
 * Main layout component with navigation
 * Updated to follow UI Guidelines: consistent spacing, clear hierarchy, accessible navigation
 */

import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation - Clear visual hierarchy with proper spacing */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo/Title with clear hierarchy */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-neutral-900">MCP Gateway</h1>
              </div>

              {/* Navigation links - Simple, obvious navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                <Link
                  to="/"
                  className={`
                    inline-flex items-center px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors duration-200
                    ${isActive('/')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }
                  `}
                  aria-current={isActive('/tools') ? 'page' : undefined}
                >
                  Tools
                </Link>
              </div>
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

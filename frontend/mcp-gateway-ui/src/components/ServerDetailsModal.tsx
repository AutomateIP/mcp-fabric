/**
 * Server details slide panel component
 * Enhanced to show git installation info and use more screen space
 */

import { useState, useEffect } from 'react';
import { getServer, getTools } from '../api/services';
import type { Server, Tool } from '../types';
import SlidePanel from './SlidePanel';

interface ServerDetailsModalProps {
  serverId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerDetailsModal({ serverId, isOpen, onClose }: ServerDetailsModalProps) {
  const [server, setServer] = useState<Server | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectionConfig, setShowConnectionConfig] = useState(true); // Start expanded by default

  useEffect(() => {
    if (isOpen && serverId) {
      loadDetails();
    }
  }, [isOpen, serverId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [serverData, toolsData] = await Promise.all([
        getServer(serverId),
        getTools({ server_id: serverId })
      ]);
      setServer(serverData);
      setTools(toolsData);
    } catch (err) {
      setError('Failed to load server details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const installStatusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    installing: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={server?.name || 'Server Details'}
      subtitle={server?.description}
      size="large"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <div className="spinner"></div>
            <div className="text-neutral-600">Loading server details...</div>
          </div>
        </div>
      ) : error ? (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      ) : server ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Server Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-neutral-600">Connection Status</div>
                <div className="mt-1 flex items-center">
                  <span
                    className={`h-3 w-3 rounded-full mr-2 ${
                      server.status === 'connected' ? 'bg-success-500' : server.status === 'error' ? 'bg-red-500' : 'bg-neutral-400'
                    }`}
                  />
                  <span className="text-sm font-medium text-neutral-900 capitalize">{server.status}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Transport</div>
                <div className="mt-1 text-sm font-medium text-neutral-900 capitalize">{server.transport_type}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Tools Discovered</div>
                <div className="mt-1 text-sm font-medium text-neutral-900">{server.tool_count}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Installation & Metadata */}
            <div className="space-y-6 lg:col-span-1">
              {/* Pip Installation Info */}
              {server.installation_type === 'pip' && (
                <div className="card bg-green-50 border-green-300">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Pip Installation
                  </h3>

                  <div className="space-y-3">
                    {server.install_status && (
                      <div>
                        <span className="text-sm text-green-700">Install Status:</span>
                        <div className="mt-1">
                          <span className={`badge ${installStatusColors[server.install_status] || 'badge-neutral'}`}>
                            {server.install_status}
                          </span>
                        </div>
                      </div>
                    )}

                    {server.pip_package && (
                      <div>
                        <span className="text-sm text-green-700">Package:</span>
                        <p className="mt-1 font-mono text-sm text-green-900 bg-white p-2 rounded border border-green-200">
                          {server.pip_package}
                        </p>
                      </div>
                    )}

                    {server.use_uv !== undefined && (
                      <div>
                        <span className="text-sm text-green-700">Install Method:</span>
                        <p className="mt-1 font-medium text-green-900">
                          {server.use_uv ? '⚡ UV (fast)' : 'pip'}
                        </p>
                      </div>
                    )}

                    {server.installation_path && (
                      <div>
                        <span className="text-sm text-green-700">Installation Path:</span>
                        <p className="mt-1 font-mono text-xs text-green-900 break-all bg-white p-2 rounded border border-green-200">
                          {server.installation_path}
                        </p>
                      </div>
                    )}

                    {server.installed_at && (
                      <div>
                        <span className="text-sm text-green-700">Installed:</span>
                        <p className="mt-1 text-green-900">{new Date(server.installed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Git Installation Info */}
              {server.installation_type === 'git' && (
                <div className="card bg-blue-50 border-blue-300">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Git Installation
                  </h3>

                  <div className="space-y-3">
                    {server.install_status && (
                      <div>
                        <span className="text-sm text-blue-700">Install Status:</span>
                        <div className="mt-1">
                          <span className={`badge ${installStatusColors[server.install_status] || 'badge-neutral'}`}>
                            {server.install_status}
                          </span>
                        </div>
                      </div>
                    )}

                    {server.git_repo_url && (
                      <div>
                        <span className="text-sm text-blue-700">Repository:</span>
                        <p className="mt-1 font-mono text-xs text-blue-900 break-all bg-white p-2 rounded border border-blue-200">
                          {server.git_repo_url}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {server.git_branch && (
                        <div>
                          <span className="text-sm text-blue-700">Branch:</span>
                          <p className="mt-1 font-medium text-blue-900">{server.git_branch}</p>
                        </div>
                      )}

                      {server.git_commit_sha && (
                        <div>
                          <span className="text-sm text-blue-700">Commit:</span>
                          <p className="mt-1 font-mono text-xs text-blue-900">{server.git_commit_sha.substring(0, 8)}</p>
                        </div>
                      )}
                    </div>

                    {server.installation_path && (
                      <div>
                        <span className="text-sm text-blue-700">Installation Path:</span>
                        <p className="mt-1 font-mono text-xs text-blue-900 break-all bg-white p-2 rounded border border-blue-200">
                          {server.installation_path}
                        </p>
                      </div>
                    )}

                    {server.installed_at && (
                      <div>
                        <span className="text-sm text-blue-700">Installed:</span>
                        <p className="mt-1 text-blue-900">{new Date(server.installed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="card bg-neutral-50">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Metadata</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-neutral-600">Created:</span>
                    <p className="mt-1 text-neutral-900">{new Date(server.created_at).toLocaleString()}</p>
                  </div>
                  {server.last_connected_at && (
                    <div>
                      <span className="text-sm text-neutral-600">Last Connected:</span>
                      <p className="mt-1 text-neutral-900">{new Date(server.last_connected_at).toLocaleString()}</p>
                    </div>
                  )}
                  {server.session_id && (
                    <div>
                      <span className="text-sm text-neutral-600">Session ID:</span>
                      <p className="mt-1 font-mono text-xs text-neutral-900 break-all bg-white p-2 rounded border border-neutral-200">
                        {server.session_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-neutral-600">Installation Type:</span>
                    <p className="mt-1 text-neutral-900 font-medium capitalize">
                      {server.installation_type || 'system'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Column - Connection Configuration */}
            <div className="space-y-6 lg:col-span-1">
              <div className="card bg-neutral-50 h-full">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Connection Config clicked, current state:', showConnectionConfig);
                    setShowConnectionConfig(!showConnectionConfig);
                  }}
                  className="flex items-center justify-between w-full text-left hover:bg-neutral-100 p-2 -m-2 rounded transition-colors cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Connection Config
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 text-neutral-600 ${showConnectionConfig ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showConnectionConfig && (
                  <div className="mt-4 border-t border-neutral-200 pt-4">
                    <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-[600px] overflow-y-auto">
                      {JSON.stringify(server.connection_config || {}, null, 2)}
                    </pre>
                    {(!server.connection_config || Object.keys(server.connection_config).length === 0) && (
                      <p className="text-sm text-neutral-500 mt-2 italic">
                        Note: Configuration is empty or not available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Tools List */}
            <div className="space-y-6 lg:col-span-1">
              <div className="card bg-white border-2 border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Tools ({tools.length})
                  </h3>
                  {tools.length > 0 && (
                    <span className="text-sm text-neutral-600">
                      {tools.length} tool{tools.length !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>

                {tools.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-neutral-600">No tools discovered yet</p>
                    <p className="text-sm text-neutral-500 mt-1">Tools will appear after successful connection</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {tools.map((tool, idx) => (
                      <div
                        key={tool.id}
                        className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-150 border border-neutral-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-semibold text-primary-600">
                                {tool.name}
                              </span>
                              <span className="text-xs text-neutral-500">#{idx + 1}</span>
                            </div>
                            {tool.description && (
                              <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              onClick={() => window.open(`/api/tools?server_id=${server.id}`, '_blank')}
              className="btn-secondary"
            >
              View Tools API
            </button>
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}

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
    completed: 'badge-success',
    installing: 'badge-neutral',
    failed: 'badge-neutral',
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
             <h3 className="text-xl font-semibold text-neutral-900 mb-4">Server Overview</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
               <div>
                 <div className="text-sm text-neutral-600">Installation Type</div>
                 <div className="mt-1 text-sm font-medium text-neutral-900 capitalize">{server.installation_type || 'system'}</div>
               </div>
               <div>
                 <div className="text-sm text-neutral-600">Created</div>
                 <div className="mt-1 text-sm text-neutral-900">{new Date(server.created_at).toLocaleDateString()}</div>
               </div>
               {server.last_connected_at && (
                 <div>
                   <div className="text-sm text-neutral-600">Last Connected</div>
                   <div className="mt-1 text-sm text-neutral-900">{new Date(server.last_connected_at).toLocaleDateString()}</div>
                 </div>
               )}
               {server.session_id && (
                 <div>
                   <div className="text-sm text-neutral-600">Session ID</div>
                   <div className="mt-1 font-mono text-xs text-neutral-900 break-all bg-neutral-50 p-2 rounded border border-neutral-200">
                     {server.session_id}
                   </div>
                 </div>
               )}
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
             {/* Left Column - Installation & Connection Info */}
             <div className="space-y-6 lg:col-span-2">
                {/* Installation Info */}
                {(server.installation_type === 'pip' || server.installation_type === 'git') && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Installation Details
                    </h3>

                   <div className="space-y-3">
                      {server.install_status && (
                        <div>
                          <span className="text-sm text-neutral-600">Install Status:</span>
                          <div className="mt-1">
                            <span className={`badge ${installStatusColors[server.install_status] || 'badge-neutral'}`}>
                              {server.install_status}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-sm text-neutral-600">Type:</span>
                        <p className="mt-1 font-medium text-neutral-900 capitalize">
                          {server.installation_type}
                        </p>
                      </div>

                      {server.installation_type === 'pip' && server.pip_package && (
                        <div>
                          <span className="text-sm text-neutral-600">Package:</span>
                          <p className="mt-1 font-mono text-sm text-neutral-900 bg-neutral-50 p-2 rounded border border-neutral-200">
                            {server.pip_package}
                          </p>
                        </div>
                      )}

                      {server.installation_type === 'pip' && server.use_uv !== undefined && (
                        <div>
                          <span className="text-sm text-neutral-600">Install Method:</span>
                          <p className="mt-1 font-medium text-neutral-900">
                            {server.use_uv ? '⚡ UV (fast)' : 'pip'}
                          </p>
                        </div>
                      )}

                      {server.installation_type === 'git' && server.git_repo_url && (
                        <div>
                          <span className="text-sm text-neutral-600">Repository:</span>
                          <p className="mt-1 font-mono text-xs text-neutral-900 break-all bg-neutral-50 p-2 rounded border border-neutral-200">
                            {server.git_repo_url}
                          </p>
                        </div>
                      )}

                      {server.installation_type === 'git' && (server.git_branch || server.git_commit_sha) && (
                        <div className="grid grid-cols-2 gap-3">
                          {server.git_branch && (
                            <div>
                              <span className="text-sm text-neutral-600">Branch:</span>
                              <p className="mt-1 font-medium text-neutral-900">{server.git_branch}</p>
                            </div>
                          )}
                          {server.git_commit_sha && (
                            <div>
                              <span className="text-sm text-neutral-600">Commit:</span>
                              <p className="mt-1 font-mono text-xs text-neutral-900">{server.git_commit_sha.substring(0, 8)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {server.installation_path && (
                        <div>
                          <span className="text-sm text-neutral-600">Installation Path:</span>
                          <p className="mt-1 font-mono text-xs text-neutral-900 break-all bg-neutral-50 p-2 rounded border border-neutral-200">
                            {server.installation_path}
                          </p>
                        </div>
                      )}

                      {server.installed_at && (
                        <div>
                          <span className="text-sm text-neutral-600">Installed:</span>
                          <p className="mt-1 text-neutral-900">{new Date(server.installed_at).toLocaleString()}</p>
                        </div>
                      )}
                   </div>
                 </div>
               )}

               {/* Connection Details */}
               <div className="card">
                 <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                   <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                   </svg>
                   Connection Details
                 </h3>
                 <div className="space-y-3">
                   <div>
                     <span className="text-sm text-neutral-600">Transport:</span>
                     <p className="mt-1 font-medium text-neutral-900 capitalize">{server.transport_type}</p>
                   </div>

                   {server.connection_config && Object.keys(server.connection_config).length > 0 && (
                     <div>
                       <span className="text-sm text-neutral-600">Configuration:</span>
                       <div className="mt-2 max-h-[200px] overflow-y-auto">
                         <pre className="bg-neutral-900 text-neutral-100 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap">
                           {JSON.stringify(server.connection_config, null, 2)}
                         </pre>
                       </div>
                     </div>
                   )}

                   {(!server.connection_config || Object.keys(server.connection_config).length === 0) && (
                     <div>
                       <span className="text-sm text-neutral-600">Configuration:</span>
                       <p className="mt-1 text-neutral-500 italic">No additional configuration needed</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>

             {/* Right Column - Tools List */}
             <div className="space-y-6 lg:col-span-3">
               <div className="card">
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
           <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-200">
              <button
                onClick={() => window.open(`/api/tools?server_id=${server.id}`, '_blank')}
                className="bg-primary-50 text-primary-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors duration-200"
              >
                View Tools API
              </button>
              {server.installation_type === 'git' && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/servers/${server.id}/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      if (response.ok) {
                        alert('Server updated successfully! The page will reload.');
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert(`Update failed: ${error.detail}`);
                      }
                     } catch (error) {
                       alert(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
                     }
                  }}
                  className="bg-green-50 text-green-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors duration-200"
                >
                  Update from Repo
                </button>
              )}
              <button
               onClick={onClose}
               className="bg-primary-50 text-primary-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors duration-200"
             >
               Close
             </button>
           </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}

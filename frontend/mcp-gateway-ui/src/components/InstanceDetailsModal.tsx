/**
 * Instance details slide panel component with MCP config display
 * Enhanced to use SlidePanel for better screen space utilization
 */

import { useState, useEffect } from 'react';
import { getInstanceDetails } from '../api/services';
import type { InstanceDetails } from '../types';
import SlidePanel from './SlidePanel';
import InstanceForm from './InstanceForm';

interface InstanceDetailsModalProps {
  instanceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstanceDetailsModal({ instanceId, isOpen, onClose }: InstanceDetailsModalProps) {
  const [details, setDetails] = useState<InstanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && instanceId) {
      loadDetails();
    }
  }, [isOpen, instanceId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInstanceDetails(instanceId);
      setDetails(data);
    } catch (err) {
      setError('Failed to load instance details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = () => {
    if (details) {
      const configText = JSON.stringify(details.mcp_config, null, 2);
      navigator.clipboard.writeText(configText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadDetails(); // Reload the details after successful edit
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${details?.name || 'Instance'}` : (details?.name || 'Instance Details')}
      subtitle={isEditing ? 'Update instance configuration' : details?.description}
      size="large"
      actions={
        !isEditing && !loading && !error && details ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Edit Instance
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <div className="spinner"></div>
            <div className="text-neutral-600">Loading instance details...</div>
          </div>
        </div>
      ) : error ? (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      ) : isEditing ? (
        <InstanceForm
          instanceId={instanceId}
          onSuccess={handleEditSuccess}
          onCancel={handleCancelEdit}
        />
      ) : details ? (
        <div className="space-y-6">
           {/* Status Banner */}
           <div className="card">
             <h3 className="text-xl font-semibold text-neutral-900 mb-4">Instance Overview</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div>
                 <div className="text-sm text-neutral-600">Full Endpoint URL</div>
                 <div className="mt-1 font-mono text-sm font-medium text-neutral-900 break-all bg-neutral-50 p-2 rounded border border-neutral-200">
                   http://localhost:8000{details.endpoint_path}
                 </div>
                 <button
                   onClick={() => navigator.clipboard.writeText(`http://localhost:8000${details.endpoint_path}`)}
                   className="mt-2 bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-medium hover:bg-primary-100 transition-colors duration-200"
                 >
                   Copy URL
                 </button>
               </div>
                <div>
                  <div className="text-sm text-neutral-600">Tools Configured</div>
                  <div className="mt-1 text-sm font-medium text-neutral-900">{details.tool_count}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Transport</div>
                  <div className="mt-1 text-sm font-medium text-neutral-900 capitalize">{details.transport_type || 'http'}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Created</div>
                  <div className="mt-1 text-sm text-neutral-900">{new Date(details.created_at).toLocaleDateString()}</div>
                </div>
               <div>
                 <div className="text-sm text-neutral-600">Instance ID</div>
                 <div className="mt-1 font-mono text-xs text-neutral-900 break-all bg-neutral-50 p-2 rounded border border-neutral-200">
                   {instanceId}
                 </div>
               </div>
               {details.tags.length > 0 && (
                 <div>
                   <div className="text-sm text-neutral-600">Tags</div>
                   <div className="mt-1 flex flex-wrap gap-1">
                     {details.tags.slice(0, 3).map((tag) => (
                       <span key={tag} className="badge-neutral text-xs">
                         {tag}
                       </span>
                     ))}
                     {details.tags.length > 3 && (
                       <span className="badge-neutral text-xs">+{details.tags.length - 3}</span>
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - MCP Configuration */}
              <div className="space-y-6 lg:col-span-2">
                <div className="card h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      MCP Configuration
                    </h3>
                    <button
                      onClick={copyConfig}
                      className="bg-primary-50 text-primary-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors duration-200"
                    >
                      {copied ? '✓ Copied' : 'Copy Config'}
                    </button>
                  </div>
                  <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-[600px] overflow-y-auto">
                    {JSON.stringify(details.mcp_config, null, 2)}
                  </pre>
                  <p className="mt-3 text-sm text-neutral-600 bg-neutral-50 p-3 rounded border border-neutral-200">
                    <strong>How to use:</strong> Copy this configuration and add it to your MCP client settings to connect to this instance.
                  </p>
                </div>
              </div>

              {/* Right Column - Tools List */}
              <div className="space-y-6 lg:col-span-3">
               <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Tools ({details.tools.length})
                  </h3>
                  {details.tools.length > 0 && (
                    <span className="text-sm text-neutral-600">
                      {details.tools.length} tool{details.tools.length !== 1 ? 's' : ''} configured
                    </span>
                  )}
                </div>

                {details.tools.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-neutral-600">No tools configured</p>
                    <p className="text-sm text-neutral-500 mt-1">Edit this instance to add tools</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {details.tools.map((tool, idx) => (
                      <div
                        key={tool.id}
                        className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-150 border border-neutral-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-primary-600">
                                {tool.name}
                              </span>
                              <span className="text-xs text-neutral-500">#{idx + 1}</span>
                              <span className="badge-primary text-xs">
                                {tool.source_server_name}
                              </span>
                            </div>
                            {tool.description && (
                              <p className="mt-2 text-sm text-neutral-600 line-clamp-3">
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
               onClick={() => window.open(`http://localhost:8000${details.endpoint_path}`, '_blank')}
               className="bg-primary-50 text-primary-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors duration-200"
             >
               Open Endpoint
             </button>
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

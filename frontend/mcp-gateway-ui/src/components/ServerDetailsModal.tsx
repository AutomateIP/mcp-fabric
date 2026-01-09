/**
 * Server details modal component
 */

import { useState, useEffect } from 'react';
import { getServer, getTools } from '../api/services';
import type { Server, Tool } from '../types';
import Modal from './Modal';

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

  const statusColors = {
    connected: 'badge-success',
    disconnected: 'badge-neutral',
    error: 'bg-red-100 text-red-700',
    reconnecting: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server Details">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="spinner"></div>
            <div className="text-neutral-600">Loading details...</div>
          </div>
        </div>
      ) : error ? (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      ) : server ? (
        <div className="space-form">
          {/* Basic Info */}
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-neutral-900">{server.name}</h3>
              <span className={`badge ${statusColors[server.status]}`}>
                {server.status}
              </span>
            </div>
            {server.description && (
              <p className="mt-1 text-sm text-neutral-600">{server.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="card bg-neutral-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Transport:</span>
                <p className="text-neutral-900 font-medium mt-1 capitalize">{server.transport_type}</p>
              </div>
              <div>
                <span className="text-neutral-600">Tools:</span>
                <p className="text-neutral-900 font-medium mt-1">{server.tool_count}</p>
              </div>
              <div>
                <span className="text-neutral-600">Created:</span>
                <p className="text-neutral-900 mt-1">
                  {new Date(server.created_at).toLocaleString()}
                </p>
              </div>
              {server.last_connected_at && (
                <div>
                  <span className="text-neutral-600">Last Connected:</span>
                  <p className="text-neutral-900 mt-1">
                    {new Date(server.last_connected_at).toLocaleString()}
                  </p>
                </div>
              )}
              {server.session_id && (
                <div className="col-span-2">
                  <span className="text-neutral-600">Session ID:</span>
                  <p className="text-neutral-900 font-mono text-xs mt-1 break-all">{server.session_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Connection Config */}
          {server.connection_config && (
            <div>
              <h4 className="label mb-2">Connection Configuration</h4>
              <div className="card bg-neutral-50">
                <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(server.connection_config, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tools List */}
          <div>
            <h4 className="label mb-2">Tools ({tools.length})</h4>
            {tools.length === 0 ? (
              <p className="text-sm text-neutral-600">No tools discovered yet</p>
            ) : (
              <div className="border border-neutral-300 rounded-lg max-h-60 overflow-y-auto">
                <div className="divide-y divide-neutral-200">
                  {tools.map((tool) => (
                    <div key={tool.id} className="p-3">
                      <div className="font-medium text-neutral-900">{tool.name}</div>
                      {tool.description && (
                        <p className="mt-1 text-sm text-neutral-600">{tool.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

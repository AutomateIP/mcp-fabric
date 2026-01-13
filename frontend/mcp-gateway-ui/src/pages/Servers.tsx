/**
 * Servers page component
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServers, deleteServer } from '../api/services';
import type { Server } from '../types';
import ServerDetailsModal from '../components/ServerDetailsModal';

export default function Servers() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const data = await getServers();
      setServers(data);
    } catch (err) {
      console.error('Failed to load servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      await deleteServer(id);
      await loadServers();
    } catch (err) {
      console.error('Failed to delete server:', err);
      alert('Failed to delete server');
    }
  };

  const statusColors = {
    connected: 'badge-success',
    disconnected: 'badge-neutral',
    error: 'badge-neutral',
    reconnecting: 'badge-neutral',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner"></div>
          <div className="text-neutral-600">Loading servers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Servers</h2>
          <p className="mt-2 text-base text-neutral-600 max-w-2xl">
            Southbound MCP servers •
            <button
              onClick={() => navigate('/servers/create/quick')}
              className="ml-2 text-green-600 hover:text-green-700 font-medium underline"
            >
              Paste install command ⚡
            </button>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/servers/create/quick')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quick Install</span>
          </button>
          <button
            onClick={() => navigate('/servers/create/advanced')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-700 font-medium rounded-lg border-2 border-neutral-300 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Manual Setup</span>
          </button>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6 mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xl text-neutral-700 font-semibold mb-2">No servers configured yet</p>
          <p className="text-base text-neutral-600 mb-6">Install an MCP server in seconds</p>
          <button
            onClick={() => navigate('/servers/create/quick')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quick Install</span>
          </button>
          <p className="text-sm text-neutral-500 mt-4">
            Example: <code className="bg-neutral-100 px-2 py-1 rounded text-green-700">uv pip install duckduckgo-mcp-server</code>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <div key={server.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-lg font-medium text-neutral-900">{server.name}</h3>
                    <span className={`badge ${statusColors[server.status]}`}>
                      {server.status}
                    </span>
                  </div>
                  {server.description && (
                    <p className="mt-1 text-sm text-neutral-600">{server.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm text-neutral-600">
                  <div className="flex items-center justify-between py-2">
                    <span>Tools</span>
                    <span className="font-medium text-neutral-900">{server.tool_count}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Transport</span>
                    <span className="font-medium text-neutral-900 capitalize">{server.transport_type}</span>
                  </div>
                  {server.installation_type && (
                    <div className="flex items-center justify-between py-2">
                      <span>Install Type</span>
                      <span className="font-medium text-neutral-900">
                        {server.installation_type === 'pip' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                            pip {server.use_uv && '⚡'}
                          </span>
                        )}
                        {server.installation_type === 'git' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                            git
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedServerId(server.id)}
                  className="flex-1 bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors duration-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>

              {server.last_connected_at && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Last connected: {new Date(server.last_connected_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Server Details Modal */}
      {selectedServerId && (
        <ServerDetailsModal
          serverId={selectedServerId}
          isOpen={!!selectedServerId}
          onClose={() => setSelectedServerId(null)}
        />
      )}
    </div>
  );
}

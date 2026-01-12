/**
 * Servers page component
 */

import { useEffect, useState } from 'react';
import { getServers, deleteServer } from '../api/services';
import type { Server } from '../types';
import Modal from '../components/Modal';
import ServerForm from '../components/ServerForm';
import ServerDetailsModal from '../components/ServerDetailsModal';
import QuickInstallModal from '../components/QuickInstallModal';

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQuickInstall, setShowQuickInstall] = useState(false);
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
    error: 'bg-red-100 text-red-700',
    reconnecting: 'bg-yellow-100 text-yellow-700',
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
              onClick={() => setShowQuickInstall(true)}
              className="ml-2 text-green-600 hover:text-green-700 font-medium underline"
            >
              Paste install command ⚡
            </button>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickInstall(true)}
            className="btn-primary flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl text-lg px-6 py-3"
          >
            <span className="text-2xl">⚡</span>
            <span className="font-semibold">Quick Install</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary text-sm"
          >
            Advanced
          </button>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-xl text-neutral-700 font-semibold mb-2">No servers configured yet</p>
          <p className="text-base text-neutral-600 mb-6">Install an MCP server in seconds</p>
          <button
            onClick={() => setShowQuickInstall(true)}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-lg shadow-xl text-lg font-semibold transition-all"
          >
            <span className="text-2xl">⚡</span>
            <span>Quick Install - Paste Command</span>
          </button>
          <p className="text-sm text-neutral-500 mt-4">
            Example: <code className="bg-neutral-100 px-2 py-1 rounded text-green-700">uv pip install duckduckgo-mcp-server</code>
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <ul className="divide-y divide-neutral-200">
            {servers.map((server) => (
              <li key={server.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-neutral-900">{server.name}</h3>
                      <span
                        className={`ml-3 badge ${statusColors[server.status]}`}
                      >
                        {server.status}
                      </span>
                      {server.installation_type === 'pip' && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          pip {server.use_uv && '⚡'}
                        </span>
                      )}
                      {server.installation_type === 'git' && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          git
                        </span>
                      )}
                    </div>
                    {server.description && (
                      <p className="mt-1 text-sm text-neutral-600">{server.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-neutral-600">
                      <span className="capitalize">{server.transport_type}</span>
                      <span className="mx-2">•</span>
                      <span>{server.tool_count} tools</span>
                      {server.last_connected_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Last connected:{' '}
                            {new Date(server.last_connected_at).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => setSelectedServerId(server.id)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(server.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Install Modal */}
      <QuickInstallModal
        isOpen={showQuickInstall}
        onClose={() => setShowQuickInstall(false)}
        onSuccess={() => {
          setShowQuickInstall(false);
          loadServers();
        }}
      />

      {/* Add Server Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add MCP Server"
      >
        <ServerForm
          onSuccess={() => {
            setShowModal(false);
            loadServers();
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

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

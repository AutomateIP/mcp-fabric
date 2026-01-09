/**
 * Servers page component
 */

import { useEffect, useState } from 'react';
import { getServers, deleteServer } from '../api/services';
import type { Server } from '../types';
import Modal from '../components/Modal';
import ServerForm from '../components/ServerForm';
import ServerDetailsModal from '../components/ServerDetailsModal';

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
          <p className="mt-2 text-base text-neutral-600 max-w-2xl">Southbound MCP servers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          Add Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-neutral-600 font-medium">No servers configured</p>
          <p className="text-sm text-neutral-500 mt-1">Add your first MCP server to get started</p>
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

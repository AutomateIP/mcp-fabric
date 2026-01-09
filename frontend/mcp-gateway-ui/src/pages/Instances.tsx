/**
 * Instances page component
 */

import { useEffect, useState } from 'react';
import { getInstances, deleteInstance } from '../api/services';
import type { Instance } from '../types';
import Modal from '../components/Modal';
import InstanceForm from '../components/InstanceForm';
import InstanceDetailsModal from '../components/InstanceDetailsModal';

export default function Instances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const data = await getInstances();
      setInstances(data);
    } catch (err) {
      console.error('Failed to load instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instance?')) return;

    try {
      await deleteInstance(id);
      await loadInstances();
    } catch (err) {
      console.error('Failed to delete instance:', err);
      alert('Failed to delete instance');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner"></div>
          <div className="text-neutral-600">Loading instances...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Instances</h2>
          <p className="mt-2 text-base text-neutral-600 max-w-2xl">Northbound MCP server instances</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          Create Instance
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-neutral-600 font-medium">No instances configured</p>
          <p className="text-sm text-neutral-500 mt-1">Create your first instance to expose tools</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <div key={instance.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900">{instance.name}</h3>
                  {instance.description && (
                    <p className="mt-1 text-sm text-neutral-600">{instance.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm text-neutral-600">
                  <div className="flex items-center justify-between py-2">
                    <span>Tools</span>
                    <span className="font-medium text-neutral-900">{instance.tool_count}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Tags</span>
                    <span className="font-medium text-neutral-900">{instance.tags.length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedInstanceId(instance.id)}
                  className="flex-1 bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors duration-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDelete(instance.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 font-mono truncate">
                  {instance.endpoint_path}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Instance Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Instance"
      >
        <InstanceForm
          onSuccess={() => {
            setShowModal(false);
            loadInstances();
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Instance Details Modal */}
      {selectedInstanceId && (
        <InstanceDetailsModal
          instanceId={selectedInstanceId}
          isOpen={!!selectedInstanceId}
          onClose={() => setSelectedInstanceId(null)}
        />
      )}
    </div>
  );
}

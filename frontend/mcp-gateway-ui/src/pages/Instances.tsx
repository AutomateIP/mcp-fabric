/**
 * Instances page component
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInstances, deleteInstance } from '../api/services';
import type { Instance } from '../types';
import InstanceDetailsModal from '../components/InstanceDetailsModal';

export default function Instances() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
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
          onClick={() => navigate('/instances/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Instance</span>
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6 mx-auto">
            <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-xl text-neutral-700 font-semibold mb-2">No instances configured</p>
          <p className="text-base text-neutral-600 mb-6">Create your first instance to expose tools</p>
          <button
            onClick={() => navigate('/instances/create')}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Instance</span>
          </button>
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

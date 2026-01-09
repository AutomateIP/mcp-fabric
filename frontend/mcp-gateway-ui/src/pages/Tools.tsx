/**
 * Tools page component
 */

import { useEffect, useState } from 'react';
import { getTools } from '../api/services';
import type { Tool } from '../types';
import Modal from '../components/Modal';

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await getTools();
      setTools(data);
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.source_server_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner"></div>
          <div className="text-neutral-600">Loading tools...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Tools</h2>
        <p className="mt-2 text-base text-neutral-600 max-w-2xl">Browse all available tools from MCP servers</p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      {filteredTools.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-neutral-600 font-medium">
            {searchTerm ? 'No tools found matching your search' : 'No tools available'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <ul className="divide-y divide-neutral-200">
            {filteredTools.map((tool) => (
              <li key={tool.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-neutral-900">{tool.name}</h3>
                      <span className="ml-3 badge-primary">
                        {tool.source_server_name}
                      </span>
                    </div>
                    {tool.description && (
                      <p className="mt-1 text-sm text-neutral-600">{tool.description}</p>
                    )}
                    {tool.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tool.tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge-neutral"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTool(tool)}
                    className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                  >
                    View Schema
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-neutral-600">
          Showing {filteredTools.length} of {tools.length} tools
        </p>
      </div>

      {/* Tool Schema Modal */}
      {selectedTool && (
        <Modal
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          title={`Tool Schema: ${selectedTool.name}`}
        >
          <div className="space-form">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{selectedTool.name}</h3>
              {selectedTool.description && (
                <p className="mt-1 text-sm text-neutral-600">{selectedTool.description}</p>
              )}
            </div>

            <div className="card bg-neutral-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Source Server:</span>
                  <p className="text-neutral-900 font-medium mt-1">{selectedTool.source_server_name}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Created:</span>
                  <p className="text-neutral-900 mt-1">
                    {new Date(selectedTool.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {selectedTool.tags.length > 0 && (
              <div>
                <h4 className="label mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTool.tags.map((tag) => (
                    <span key={tag} className="badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="label mb-2">Input Schema</h4>
              <div className="card bg-neutral-50">
                <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(selectedTool.input_schema, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <button onClick={() => setSelectedTool(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

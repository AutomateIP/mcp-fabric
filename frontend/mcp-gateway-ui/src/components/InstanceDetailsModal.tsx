/**
 * Instance details modal component with MCP config display
 */

import { useState, useEffect } from 'react';
import { getInstanceDetails } from '../api/services';
import type { InstanceDetails } from '../types';
import Modal from './Modal';

interface InstanceDetailsModalProps {
  instanceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstanceDetailsModal({ instanceId, isOpen, onClose }: InstanceDetailsModalProps) {
  const [details, setDetails] = useState<InstanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instance Details">
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
      ) : details ? (
        <div className="space-form">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{details.name}</h3>
            {details.description && (
              <p className="mt-1 text-sm text-neutral-600">{details.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="card bg-neutral-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Endpoint:</span>
                <p className="font-mono text-xs text-neutral-900 mt-1 break-all">
                  {details.endpoint_path}
                </p>
              </div>
              <div>
                <span className="text-neutral-600">Tools:</span>
                <p className="text-neutral-900 font-medium mt-1">{details.tool_count}</p>
              </div>
              <div>
                <span className="text-neutral-600">Created:</span>
                <p className="text-neutral-900 mt-1">
                  {new Date(details.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-neutral-600">Updated:</span>
                <p className="text-neutral-900 mt-1">
                  {new Date(details.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {details.tags.length > 0 && (
            <div>
              <h4 className="label mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {details.tags.map((tag) => (
                  <span key={tag} className="badge-neutral">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools List */}
          <div>
            <h4 className="label mb-2">Tools ({details.tools.length})</h4>
            {details.tools.length === 0 ? (
              <p className="text-sm text-neutral-600">No tools configured</p>
            ) : (
              <div className="border border-neutral-300 rounded-lg max-h-60 overflow-y-auto">
                <div className="divide-y divide-neutral-200">
                  {details.tools.map((tool) => (
                    <div key={tool.id} className="p-3">
                      <div className="flex items-center">
                        <span className="font-medium text-neutral-900">{tool.name}</span>
                        <span className="ml-2 badge-primary">
                          {tool.source_server_name}
                        </span>
                      </div>
                      {tool.description && (
                        <p className="mt-1 text-sm text-neutral-600">{tool.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MCP Config Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-between w-full btn-secondary text-left"
            >
              <span>MCP Configuration</span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${showConfig ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showConfig && (
              <div className="mt-3 card bg-neutral-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    Claude Code MCP Configuration
                  </span>
                  <button
                    onClick={copyConfig}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(details.mcp_config, null, 2)}
                </pre>
                <p className="mt-2 text-xs text-neutral-600">
                  Add this configuration to your Claude Code settings to use this MCP instance.
                </p>
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

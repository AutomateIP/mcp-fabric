/**
 * Instance creation/edit form component with tool selector
 */

import { useState, useEffect } from 'react';
import { createInstance, updateInstance, getTools, getTags, getInstanceDetails } from '../api/services';
import type { Tool, Tag } from '../types';

interface InstanceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  instanceId?: string; // If provided, form will be in edit mode
}

export default function InstanceForm({ onSuccess, onCancel, instanceId }: InstanceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [tools, setTools] = useState<Tool[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!instanceId;

  useEffect(() => {
    loadData();
  }, [instanceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toolsData, tagsData] = await Promise.all([
        getTools(),
        getTags(),
      ]);
      setTools(toolsData);
      setTags(tagsData);

      // If in edit mode, load existing instance data
      if (instanceId) {
        const instanceDetails = await getInstanceDetails(instanceId);
        setFormData({
          name: instanceDetails.name,
          description: instanceDetails.description || '',
        });
        // Extract tool IDs from tools array
        setSelectedToolIds(new Set(instanceDetails.tools.map(tool => tool.id)));
        // Tags are already just tag names in the array, need to map to IDs
        const tagIds = tagsData
          .filter(tag => instanceDetails.tags.includes(tag.name))
          .map(tag => tag.id);
        setSelectedTagIds(new Set(tagIds));
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedToolIds.size === 0) {
      setError('Please select at least one tool');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && instanceId) {
        await updateInstance(instanceId, {
          name: formData.name,
          description: formData.description || undefined,
          tool_ids: Array.from(selectedToolIds),
          tag_ids: Array.from(selectedTagIds),
        });
      } else {
        await createInstance({
          name: formData.name,
          description: formData.description || undefined,
          tool_ids: Array.from(selectedToolIds),
          tag_ids: Array.from(selectedTagIds),
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} instance`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTool = (toolId: string) => {
    const newSet = new Set(selectedToolIds);
    if (newSet.has(toolId)) {
      newSet.delete(toolId);
    } else {
      newSet.add(toolId);
    }
    setSelectedToolIds(newSet);
  };

  const toggleTag = (tagId: string) => {
    const newSet = new Set(selectedTagIds);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    setSelectedTagIds(newSet);
  };

  const selectAllTools = () => {
    setSelectedToolIds(new Set(filteredTools.map(t => t.id)));
  };

  const deselectAllTools = () => {
    setSelectedToolIds(new Set());
  };

  const filteredTools = tools.filter(tool => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      tool.name.toLowerCase().includes(search) ||
      tool.description?.toLowerCase().includes(search) ||
      tool.source_server_name.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner"></div>
          <div className="text-neutral-600">Loading tools...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex-1 space-form pb-20">
        {error && (
          <div className="card border-red-300 bg-red-50">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Instance Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Agent 1 Tools"
                  />
                </div>

                <div>
                  <label className="label">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Tag Selection */}
            {tags.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Tags (Optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors duration-200 ${
                        selectedTagIds.has(tag.id)
                          ? 'bg-primary-100 border-primary-300 text-primary-800'
                          : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tool Selection (takes 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Select Tools <span className="text-red-600">*</span>
                </h3>
                <div className="text-sm text-neutral-600 font-medium">
                  {selectedToolIds.size} of {tools.length} selected
                </div>
              </div>

              {/* Search and Actions */}
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input flex-1"
                  placeholder="Search tools by name, description, or server..."
                />
                <button
                  type="button"
                  onClick={selectAllTools}
                  className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg font-medium transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAllTools}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium transition-colors duration-200"
                >
                  Clear
                </button>
              </div>

              {/* Tool List - Reduced height to accommodate sticky footer */}
              <div className="border border-neutral-300 rounded-lg max-h-[calc(100vh-350px)] overflow-y-auto">
                {filteredTools.length === 0 ? (
                  <div className="text-center py-12 text-neutral-600">
                    {tools.length === 0 ? (
                      <div>
                        <p className="font-medium text-lg">No tools available</p>
                        <p className="text-sm mt-2">Onboard a server first to see available tools</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-lg">No matching tools</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {filteredTools.map((tool) => (
                      <label
                        key={tool.id}
                        className="flex items-start p-4 hover:bg-neutral-50 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToolIds.has(tool.id)}
                          onChange={() => toggleTool(tool.id)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                        <div className="ml-3 flex-1">
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
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-4 shadow-lg">
        <div className="flex justify-end space-x-3 max-w-screen-xl mx-auto">
          <button
            type="button"
            onClick={onCancel}
            className="bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors duration-200"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || selectedToolIds.size === 0}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Instance' : 'Create Instance')}
          </button>
        </div>
      </div>
    </div>
  );
}

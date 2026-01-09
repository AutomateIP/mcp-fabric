/**
 * Instance creation/edit form component with tool selector
 */

import { useState, useEffect } from 'react';
import { createInstance, getTools, getTags } from '../api/services';
import type { Tool, Tag } from '../types';

interface InstanceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InstanceForm({ onSuccess, onCancel }: InstanceFormProps) {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toolsData, tagsData] = await Promise.all([
        getTools(),
        getTags(),
      ]);
      setTools(toolsData);
      setTags(tagsData);
    } catch (err) {
      setError('Failed to load tools and tags');
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
      await createInstance({
        name: formData.name,
        description: formData.description || undefined,
        tool_ids: Array.from(selectedToolIds),
        tag_ids: Array.from(selectedTagIds),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create instance');
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
    <form onSubmit={handleSubmit} className="space-form">
      {error && (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-form">
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
            rows={2}
          />
        </div>
      </div>

      {/* Tool Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label">
            Select Tools <span className="text-red-600">*</span>
          </label>
          <div className="text-sm text-neutral-600">
            {selectedToolIds.size} of {tools.length} selected
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            placeholder="Search tools..."
          />
          <button
            type="button"
            onClick={selectAllTools}
            className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAllTools}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-700 font-medium transition-colors duration-200"
          >
            Clear
          </button>
        </div>

        {/* Tool List */}
        <div className="border border-neutral-300 rounded-lg max-h-80 overflow-y-auto">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-neutral-600">
              {tools.length === 0 ? 'No tools available. Onboard a server first.' : 'No matching tools'}
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {filteredTools.map((tool) => (
                <label
                  key={tool.id}
                  className="flex items-start p-3 hover:bg-neutral-50 cursor-pointer transition-colors duration-200"
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

      {/* Tag Selection (Optional) */}
      {tags.length > 0 && (
        <div>
          <label className="label mb-2">
            Tags (Optional)
          </label>
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

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || selectedToolIds.size === 0}
          className="btn-primary"
        >
          {submitting ? 'Creating...' : 'Create Instance'}
        </button>
      </div>
    </form>
  );
}

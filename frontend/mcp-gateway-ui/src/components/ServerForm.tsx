/**
 * Server creation/edit form component
 */

import { useState } from 'react';
import { createServer } from '../api/services';

interface ServerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ServerForm({ onSuccess, onCancel }: ServerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transport_type: 'stdio',
  });

  // STDIO configuration
  const [stdioCommand, setStdioCommand] = useState('');
  const [stdioArgs, setStdioArgs] = useState('');

  // HTTP configuration
  const [httpUrl, setHttpUrl] = useState('');
  const [httpHeaders, setHttpHeaders] = useState('{}');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      // Build connection config based on transport type
      let connection_config: Record<string, any> = {};

      if (formData.transport_type === 'stdio') {
        const cmd = stdioCommand.trim();
        if (!cmd) {
          setError('Command is required for STDIO transport');
          return;
        }
        // Validate that command doesn't contain spaces (likely user error)
        if (cmd.includes(' ')) {
          setError('Command field should only contain the executable name (e.g., "npx"). Put arguments in the Arguments field below, one per line.');
          return;
        }
        const args = stdioArgs
          .split('\n')
          .map(arg => arg.trim())
          .filter(arg => arg.length > 0);

        if (args.length === 0) {
          setError('At least one argument is required for STDIO transport. For npx servers, add "-y" and the package name.');
          return;
        }

        connection_config = {
          command: cmd,
          args: args,
        };
      } else if (formData.transport_type === 'streamable_http') {
        if (!httpUrl.trim()) {
          setError('URL is required for Streamable HTTP transport');
          return;
        }
        try {
          connection_config = {
            url: httpUrl.trim(),
            headers: JSON.parse(httpHeaders),
          };
        } catch {
          setError('Invalid JSON in headers field');
          return;
        }
      }

      await createServer({
        name: formData.name,
        description: formData.description || undefined,
        transport_type: formData.transport_type,
        connection_config,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-form">
      {error && (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Name */}
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
          placeholder="My MCP Server"
        />
      </div>

      {/* Description */}
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

      {/* Transport Type */}
      <div>
        <label className="label">
          Transport Type <span className="text-red-600">*</span>
        </label>
        <select
          value={formData.transport_type}
          onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
          className="input"
        >
          <option value="stdio">STDIO</option>
          <option value="streamable_http">Streamable HTTP</option>
          <option value="sse">SSE (Legacy)</option>
        </select>
      </div>

      {/* STDIO Configuration */}
      {formData.transport_type === 'stdio' && (
        <div className="card bg-neutral-50 space-form">
          <h4 className="font-medium text-neutral-900">STDIO Configuration</h4>

          <div>
            <label className="label">
              Command <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={stdioCommand}
              onChange={(e) => setStdioCommand(e.target.value)}
              className="input"
              placeholder="npx"
            />
            <p className="mt-1 text-xs text-neutral-600">
              <strong>Command only</strong> - the executable name (e.g., "npx", "python", "node")
            </p>
            <p className="mt-1 text-xs text-red-600 font-medium">
              ⚠️ Do NOT include arguments here - put them in the Arguments field below!
            </p>
          </div>

          <div>
            <label className="label">
              Arguments (one per line) <span className="text-red-600">*</span>
            </label>
            <textarea
              value={stdioArgs}
              onChange={(e) => setStdioArgs(e.target.value)}
              className="input font-mono text-sm"
              placeholder={"-y\n@modelcontextprotocol/server-time"}
              rows={6}
            />
            <p className="mt-1 text-xs text-neutral-600">
              Each line becomes one argument. For npx MCP servers, use official packages:
            </p>
            <div className="mt-1 text-xs text-neutral-600 font-mono bg-neutral-100 p-2 rounded">
              -y<br/>
              @modelcontextprotocol/server-{'{name}'}
            </div>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
              <p className="text-yellow-800 font-medium">⚠️ Common Mistake:</p>
              <p className="text-yellow-700 mt-1">
                Don't use <code className="bg-yellow-100 px-1 rounded">@michaellatman/mcp-get</code> -
                that's an installer for Claude Desktop, not an MCP server.
                Use <code className="bg-yellow-100 px-1 rounded">@modelcontextprotocol/server-*</code> packages directly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Streamable HTTP Configuration */}
      {formData.transport_type === 'streamable_http' && (
        <div className="card bg-neutral-50 space-form">
          <h4 className="font-medium text-neutral-900">Streamable HTTP Configuration</h4>

          <div>
            <label className="label">
              URL <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              required
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
              className="input"
              placeholder="https://example.com/mcp"
            />
          </div>

          <div>
            <label className="label">
              Headers (JSON)
            </label>
            <textarea
              value={httpHeaders}
              onChange={(e) => setHttpHeaders(e.target.value)}
              className="input font-mono text-sm"
              placeholder='{"Authorization": "Bearer token"}'
              rows={4}
            />
            <p className="mt-1 text-xs text-neutral-600">
              Optional headers as JSON object
            </p>
          </div>
        </div>
      )}

      {/* SSE Configuration */}
      {formData.transport_type === 'sse' && (
        <div className="card bg-yellow-50 border-yellow-300">
          <p className="text-sm text-yellow-800">
            SSE transport is legacy and may have limited support. Consider using Streamable HTTP instead.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
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
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? 'Creating...' : 'Create Server'}
        </button>
      </div>
    </form>
  );
}

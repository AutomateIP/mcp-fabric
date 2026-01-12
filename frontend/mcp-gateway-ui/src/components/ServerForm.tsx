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
    installation_type: 'system', // 'system' or 'git'
  });

  // STDIO configuration
  const [stdioCommand, setStdioCommand] = useState('');
  const [stdioArgs, setStdioArgs] = useState('');

  // Git installation configuration
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [installCommand, setInstallCommand] = useState('');
  const [setupCommand, setSetupCommand] = useState('');

  // Pip installation configuration
  const [pipPackage, setPipPackage] = useState('');
  const [useUv, setUseUv] = useState(false);

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
        // For git installation, command/args might be detected, but still validate if provided
        if (formData.installation_type === 'system') {
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
        } else if (formData.installation_type === 'git') {
          // For git installation, command/args can be provided or auto-detected
          if (stdioCommand.trim()) {
            const cmd = stdioCommand.trim();
            if (cmd.includes(' ')) {
              setError('Command field should only contain the executable name. Put arguments in the Arguments field below, one per line.');
              return;
            }
            const args = stdioArgs
              .split('\n')
              .map(arg => arg.trim())
              .filter(arg => arg.length > 0);

            connection_config = {
              command: cmd,
              args: args,
            };
          } else {
            // Empty config, will be auto-detected
            connection_config = {};
          }
        }
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

      // Build server creation payload
      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        transport_type: formData.transport_type,
        connection_config,
      };

      // Add installation type specific fields
      if (formData.transport_type === 'stdio') {
        if (formData.installation_type === 'git') {
          // Git installation
          if (!gitRepoUrl.trim()) {
            setError('Git repository URL is required for git installation');
            return;
          }

          // Normalize git URL (accept ssh or https format)
          let normalizedUrl = gitRepoUrl.trim();
          if (normalizedUrl.startsWith('git@')) {
            // Convert SSH format to HTTPS (git@github.com:user/repo.git -> https://github.com/user/repo)
            normalizedUrl = normalizedUrl
              .replace(/^git@([^:]+):/, 'https://$1/')
              .replace(/\.git$/, '');
          }

          payload.installation_type = 'git';
          payload.git_repo_url = normalizedUrl;
          payload.git_branch = gitBranch.trim() || 'main';

          if (installCommand.trim()) {
            payload.install_command = installCommand.trim();
          }
          if (setupCommand.trim()) {
            payload.setup_command = setupCommand.trim();
          }
        } else if (formData.installation_type === 'pip') {
          // Pip installation
          if (!pipPackage.trim()) {
            setError('Package name is required for pip installation');
            return;
          }

          payload.installation_type = 'pip';
          payload.pip_package = pipPackage.trim();
          payload.use_uv = useUv;

          // Connection config is usually empty for pip, will be auto-detected
          payload.connection_config = {};
        } else {
          // System installation
          payload.installation_type = 'system';
        }
      } else {
        payload.installation_type = 'system';
      }

      await createServer(payload);

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

      {/* Installation Type (for STDIO only) */}
      {formData.transport_type === 'stdio' && (
        <div>
          <label className="label">
            Installation Type <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.installation_type}
            onChange={(e) => setFormData({ ...formData, installation_type: e.target.value })}
            className="input"
          >
            <option value="system">System Installed (npx, python, etc.)</option>
            <option value="pip">Install from PyPI (pip/uv)</option>
            <option value="git">Clone from Git Repository</option>
          </select>
          <p className="mt-1 text-xs text-neutral-600">
            {formData.installation_type === 'system'
              ? 'Server is already installed or accessible via npx'
              : formData.installation_type === 'pip'
              ? 'Gateway will install the server package using pip or uv'
              : 'Gateway will clone and install the server from a Git repository'
            }
          </p>
        </div>
      )}

      {/* Git Installation Configuration */}
      {formData.transport_type === 'stdio' && formData.installation_type === 'git' && (
        <div className="card bg-blue-50 border-blue-300 space-form">
          <h4 className="font-medium text-blue-900">Git Repository Configuration</h4>

          <div>
            <label className="label">
              Repository URL <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={gitRepoUrl}
              onChange={(e) => setGitRepoUrl(e.target.value)}
              className="input font-mono text-sm"
              placeholder="https://github.com/username/repo or git@github.com:username/repo.git"
            />
            <p className="mt-1 text-xs text-neutral-600">
              HTTPS or SSH format accepted (SSH will be converted to HTTPS)
            </p>
          </div>

          <div>
            <label className="label">
              Branch
            </label>
            <input
              type="text"
              value={gitBranch}
              onChange={(e) => setGitBranch(e.target.value)}
              className="input"
              placeholder="main"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Default: main
            </p>
          </div>

          <div>
            <label className="label">
              Install Command (optional)
            </label>
            <input
              type="text"
              value={installCommand}
              onChange={(e) => setInstallCommand(e.target.value)}
              className="input font-mono text-sm"
              placeholder="npm install (auto-detected if left empty)"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Override auto-detected install command. Leave empty to auto-detect from package.json, pyproject.toml, etc.
            </p>
          </div>

          <div>
            <label className="label">
              Setup Command (optional)
            </label>
            <input
              type="text"
              value={setupCommand}
              onChange={(e) => setSetupCommand(e.target.value)}
              className="input font-mono text-sm"
              placeholder="npm run build"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Additional build/compile command to run after installation
            </p>
          </div>

          <div>
            <label className="label">
              Command & Arguments (optional)
            </label>
            <input
              type="text"
              value={stdioCommand}
              onChange={(e) => setStdioCommand(e.target.value)}
              className="input font-mono text-sm"
              placeholder="node"
            />
            <p className="mt-1 text-xs text-neutral-600 mb-2">
              Override auto-detected entry point command
            </p>
            <textarea
              value={stdioArgs}
              onChange={(e) => setStdioArgs(e.target.value)}
              className="input font-mono text-sm"
              placeholder={"index.js"}
              rows={3}
            />
            <p className="mt-1 text-xs text-neutral-600">
              Entry point will be auto-detected if not provided (e.g., from package.json or main.py)
            </p>
          </div>
        </div>
      )}

      {/* Pip Installation Configuration */}
      {formData.transport_type === 'stdio' && formData.installation_type === 'pip' && (
        <div className="card bg-green-50 border-green-300 space-form">
          <h4 className="font-medium text-green-900">📦 Quick Install from PyPI</h4>
          <p className="text-sm text-green-700">
            Install MCP servers directly from PyPI using pip or uv (faster alternative)
          </p>

          <div>
            <label className="label">
              Package Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={pipPackage}
              onChange={(e) => setPipPackage(e.target.value)}
              className="input font-mono text-sm"
              placeholder="duckduckgo-mcp-server"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Just the package name (e.g., "duckduckgo-mcp-server", "mcp-memory-server")
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-green-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useUv}
                onChange={(e) => setUseUv(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-neutral-900">
                Use <code className="bg-green-100 text-green-800 px-1 rounded font-mono text-xs">uv pip install</code> (faster)
              </span>
            </label>
            <p className="text-xs text-neutral-600 mt-1 ml-6">
              uv is 10-100x faster than pip. Recommended if available in your environment.
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">💡 Popular MCP Servers:</p>
            <div className="space-y-1 text-xs text-blue-800 font-mono">
              <button
                type="button"
                onClick={() => setPipPackage('duckduckgo-mcp-server')}
                className="block hover:bg-blue-100 px-2 py-1 rounded w-full text-left"
              >
                duckduckgo-mcp-server
              </button>
              <button
                type="button"
                onClick={() => setPipPackage('mcp-memory-server')}
                className="block hover:bg-blue-100 px-2 py-1 rounded w-full text-left"
              >
                mcp-memory-server
              </button>
              <button
                type="button"
                onClick={() => setPipPackage('mcp-server-fetch')}
                className="block hover:bg-blue-100 px-2 py-1 rounded w-full text-left"
              >
                mcp-server-fetch
              </button>
            </div>
            <p className="text-xs text-neutral-600 mt-2">Click to auto-fill</p>
          </div>

          <div className="bg-neutral-100 p-3 rounded">
            <p className="text-sm font-medium text-neutral-900 mb-1">Command Preview:</p>
            <code className="text-xs font-mono text-neutral-700">
              {useUv ? 'uv' : 'pip'} pip install {pipPackage || '<package-name>'}
            </code>
          </div>

          <p className="text-xs text-neutral-500 italic">
            The gateway will automatically detect the entry point after installation. If it can't, you'll be able to configure it manually.
          </p>
        </div>
      )}

      {/* STDIO Configuration */}
      {formData.transport_type === 'stdio' && formData.installation_type === 'system' && (
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

/**
 * Quick Install Form - Simple MCP server installation form
 * Non-modal version for full-page layout
 */

import { useState } from 'react';
import { createServer } from '../api/services';

interface QuickInstallFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuickInstallForm({ onSuccess, onCancel }: QuickInstallFormProps) {
  const [command, setCommand] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCommand = (cmd: string): { package: string; useUv: boolean; name: string } | null => {
    // Remove extra whitespace
    const cleaned = cmd.trim().replace(/\s+/g, ' ');

    let packageName = '';
    let useUv = false;

    if (cleaned.startsWith('uv pip install ')) {
      packageName = cleaned.replace('uv pip install ', '').trim();
      useUv = true;
    } else if (cleaned.startsWith('pip install ')) {
      packageName = cleaned.replace('pip install ', '').trim();
      useUv = false;
    } else if (cleaned.startsWith('uv install ')) {
      packageName = cleaned.replace('uv install ', '').trim();
      useUv = true;
    } else {
      // Assume it's just the package name
      packageName = cleaned;
      useUv = true; // Default to uv for speed
    }

    if (!packageName) return null;

    // Remove flags/options
    packageName = packageName.split(' ')[0];

    // Generate a nice name from package name
    const name = packageName
      .replace(/-mcp-server$/, '')
      .replace(/^mcp-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return { package: packageName, useUv, name };
  };

  const handleQuickInstall = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      setInstalling(true);

      const parsed = parseCommand(command);
      if (!parsed) {
        setError('Please enter a valid package name or install command');
        setInstalling(false);
        return;
      }

      // Create server with minimal config
      await createServer({
        name: parsed.name,
        description: `Auto-installed from ${parsed.package}`,
        transport_type: 'stdio',
        installation_type: 'pip',
        pip_package: parsed.package,
        use_uv: parsed.useUv,
        connection_config: {},
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Installation failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const parsed = parseCommand(command);

  return (
    <form onSubmit={handleQuickInstall} className="space-form">
      {error && (
        <div className="card border-red-300 bg-red-50">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="card max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">⚡ Quick Install</h3>
            <p className="text-lg text-neutral-700 font-medium">
              Just paste: <code className="text-green-700 bg-green-50 px-2 py-1 rounded">uv pip install package-name</code>
            </p>
          </div>

          {/* Main Input */}
          <div>
            <label className="block text-base font-semibold text-neutral-800 mb-3">
              📋 Paste your install command here
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="uv pip install duckduckgo-mcp-server"
              className="w-full px-4 py-4 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-base"
              autoFocus
            />
            <p className="text-sm text-neutral-600 mt-2">
              Works with: <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">uv pip install X</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">pip install X</code>, or just <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">package-name</code>
            </p>
          </div>

          {/* Preview */}
          {parsed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">✓ Ready to install</span>
                <span className={`text-xs px-2 py-1 rounded ${parsed.useUv ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                  {parsed.useUv ? 'UV (fast)' : 'pip'}
                </span>
              </div>
              <div className="text-sm text-green-800">
                <div><strong>Server name:</strong> {parsed.name}</div>
                <div><strong>Package:</strong> <code className="bg-white px-1 rounded">{parsed.package}</code></div>
                <div><strong>Command:</strong> <code className="bg-white px-1 rounded">{parsed.useUv ? 'uv' : 'pip'} pip install {parsed.package}</code></div>
              </div>
            </div>
          )}

          {/* Popular packages */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">💡 Popular packages:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'duckduckgo-mcp-server',
                'mcp-memory-server',
                'mcp-server-fetch',
                'mcp-server-git',
              ].map((pkg) => (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => setCommand(`uv pip install ${pkg}`)}
                  className="text-xs bg-white hover:bg-blue-100 text-blue-800 px-3 py-1 rounded border border-blue-300 transition-colors font-mono"
                >
                  {pkg}
                </button>
              ))}
            </div>
          </div>

          {/* Help text */}
          <p className="text-xs text-neutral-500 text-center">
            The server will be installed, configured, and connected automatically. You can view progress in the servers list.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={installing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!parsed || installing}
          className={`btn-primary ${
            !parsed || installing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {installing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Installing...
            </span>
          ) : (
            '⚡ Install Now'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Create Server Advanced page - Full page for advanced server configuration
 */

import { useNavigate } from 'react-router-dom';
import ServerForm from '../components/ServerForm';

export default function CreateServerAdvanced() {
  const navigate = useNavigate();

  return (
    <div className="space-section">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={() => navigate('/servers')}
            className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
            aria-label="Back to servers"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Add MCP Server</h2>
        </div>
        <p className="text-base text-neutral-600 max-w-2xl ml-9">
          Configure an MCP server with advanced options for transport, installation, and connection settings
        </p>
      </div>

      <ServerForm
        onSuccess={() => navigate('/servers')}
        onCancel={() => navigate('/servers')}
      />
    </div>
  );
}

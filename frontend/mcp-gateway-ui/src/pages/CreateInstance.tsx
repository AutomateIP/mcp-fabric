/**
 * Create Instance page - Full page for instance creation with better space utilization
 */

import { useNavigate } from 'react-router-dom';
import InstanceForm from '../components/InstanceForm';

export default function CreateInstance() {
  const navigate = useNavigate();

  return (
    <div className="space-section">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={() => navigate('/instances')}
            className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
            aria-label="Back to instances"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Create Instance</h2>
        </div>
        <p className="text-base text-neutral-600 max-w-2xl ml-9">
          Select tools from your onboarded servers to create a new northbound MCP server instance
        </p>
      </div>

      <InstanceForm
        onSuccess={() => navigate('/instances')}
        onCancel={() => navigate('/instances')}
      />
    </div>
  );
}

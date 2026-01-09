/**
 * Dashboard page component
 */

import { useEffect, useState } from 'react';
import { getHealth, getStats } from '../api/services';
import type { Health, Stats } from '../types';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthData, statsData] = await Promise.all([getHealth(), getStats()]);
      setHealth(healthData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="spinner"></div>
          <div className="text-neutral-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-300 bg-red-50">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={loadData}
          className="btn-secondary mt-3"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Dashboard</h2>
        <p className="mt-2 text-base text-neutral-600 max-w-2xl">
          Overview of your MCP Gateway system
        </p>
      </div>

      {/* Health Status */}
      {health && (
        <div className="card">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-neutral-600">Status</div>
              <div className="mt-1 flex items-center">
                <span
                  className={`h-3 w-3 rounded-full mr-2 ${
                    health.status === 'healthy' ? 'bg-success-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-neutral-900 capitalize">{health.status}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600">Database</div>
              <div className="mt-1 text-sm font-medium text-neutral-900 capitalize">{health.database}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600">Connected Servers</div>
              <div className="mt-1 text-sm font-medium text-neutral-900">{health.southbound_servers}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600">Active Instances</div>
              <div className="mt-1 text-sm font-medium text-neutral-900">{health.northbound_instances}</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Servers"
              value={stats.total_servers}
              subtitle={`${stats.connected_servers} connected`}
              color="primary"
            />
            <StatsCard title="Total Tools" value={stats.total_tools} color="success" />
            <StatsCard title="Total Instances" value={stats.total_instances} color="primary" />
            <StatsCard title="Total Tags" value={stats.total_tags} color="neutral" />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <button
            className="card hover:shadow-md transition-shadow duration-200 text-left"
            onClick={() => (window.location.href = '/servers')}
          >
            <h4 className="font-medium text-neutral-900">Add Server</h4>
            <p className="mt-1 text-sm text-neutral-600">Onboard a new MCP server</p>
          </button>
          <button
            className="card hover:shadow-md transition-shadow duration-200 text-left"
            onClick={() => (window.location.href = '/instances')}
          >
            <h4 className="font-medium text-neutral-900">Create Instance</h4>
            <p className="mt-1 text-sm text-neutral-600">Set up a new northbound instance</p>
          </button>
          <button
            className="card hover:shadow-md transition-shadow duration-200 text-left"
            onClick={() => (window.location.href = '/tools')}
          >
            <h4 className="font-medium text-neutral-900">Browse Tools</h4>
            <p className="mt-1 text-sm text-neutral-600">View all available tools</p>
          </button>
        </div>
      </div>
    </div>
  );
}

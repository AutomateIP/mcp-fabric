/**
 * API service functions for MCP Gateway
 */

import { apiClient } from './client';
import type { Server, Tool, Instance, Tag, Stats, Health, InstanceDetails } from '../types';

// System endpoints
export const getHealth = async (): Promise<Health> => {
  const response = await apiClient.get<Health>('/api/health');
  return response.data;
};

export const getStats = async (): Promise<Stats> => {
  const response = await apiClient.get<Stats>('/api/stats');
  return response.data;
};

// Server endpoints
export const getServers = async (): Promise<Server[]> => {
  const response = await apiClient.get<Server[]>('/api/servers');
  return response.data;
};

export const getServer = async (id: string): Promise<Server> => {
  const response = await apiClient.get<Server>(`/api/servers/${id}`);
  return response.data;
};

export const createServer = async (data: {
  name: string;
  description?: string;
  transport_type: string;
  connection_config: Record<string, any>;
}): Promise<Server> => {
  const response = await apiClient.post<Server>('/api/servers', data);
  return response.data;
};

export const deleteServer = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/servers/${id}`);
};

// Tool endpoints
export const getTools = async (params?: {
  server_id?: string;
  search_term?: string;
}): Promise<Tool[]> => {
  const response = await apiClient.get<Tool[]>('/api/tools', { params });
  return response.data;
};

export const getTool = async (id: string): Promise<Tool> => {
  const response = await apiClient.get<Tool>(`/api/tools/${id}`);
  return response.data;
};

// Instance endpoints
export const getInstances = async (): Promise<Instance[]> => {
  const response = await apiClient.get<Instance[]>('/api/instances');
  return response.data;
};

export const getInstance = async (id: string): Promise<Instance> => {
  const response = await apiClient.get<Instance>(`/api/instances/${id}`);
  return response.data;
};

export const getInstanceDetails = async (id: string): Promise<InstanceDetails> => {
  const response = await apiClient.get<InstanceDetails>(`/api/instances/${id}/details`);
  return response.data;
};

export const createInstance = async (data: {
  name: string;
  description?: string;
  tool_ids: string[];
  tag_ids?: string[];
}): Promise<Instance> => {
  const response = await apiClient.post<Instance>('/api/instances', data);
  return response.data;
};

export const updateInstance = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    tool_ids?: string[];
    tag_ids?: string[];
  }
): Promise<Instance> => {
  const response = await apiClient.put<Instance>(`/api/instances/${id}`, data);
  return response.data;
};

export const deleteInstance = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/instances/${id}`);
};

// Tag endpoints
export const getTags = async (): Promise<Tag[]> => {
  const response = await apiClient.get<Tag[]>('/api/tags');
  return response.data;
};

export const createTag = async (data: {
  name: string;
  color?: string;
  description?: string;
}): Promise<Tag> => {
  const response = await apiClient.post<Tag>('/api/tags', data);
  return response.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tags/${id}`);
};

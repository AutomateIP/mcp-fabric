/**
 * TypeScript types for MCP Gateway
 */

export interface Server {
  id: string;
  name: string;
  description?: string;
  transport_type: 'stdio' | 'streamable_http' | 'sse';
  connection_config?: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  session_id?: string;
  created_at: string;
  last_connected_at?: string;
  tool_count: number;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  input_schema: Record<string, any>;
  source_server_id: string;
  source_server_name: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface Instance {
  id: string;
  name: string;
  description?: string;
  endpoint_path: string;
  created_at: string;
  updated_at: string;
  tool_count: number;
  tags: string[];
}

export interface InstanceToolInfo {
  id: string;
  name: string;
  description?: string;
  source_server_name: string;
}

export interface InstanceDetails extends Instance {
  tools: InstanceToolInfo[];
  mcp_config: {
    mcpServers: Record<string, {
      url: string;
      transport: string;
    }>;
  };
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  tool_count: number;
  instance_count: number;
}

export interface Stats {
  total_servers: number;
  connected_servers: number;
  total_tools: number;
  total_instances: number;
  total_tags: number;
}

export interface Health {
  status: string;
  database: string;
  southbound_servers: number;
  northbound_instances: number;
}

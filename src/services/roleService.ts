import api from '@/lib/api';

// Types
export interface Permission {
  name: string;
  action: string;
  label: string;
}

export interface PermissionModule {
  module: string;
  label: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  description: string;
  permissions: string[];
  permissions_count: number;
  users_count: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleDetail extends Role {
  users: {
    id: number;
    name: string;
    email: string;
    actif: boolean;
  }[];
}

export interface RoleStats {
  total_roles: number;
  total_permissions: number;
  total_users: number;
  roles_distribution: {
    name: string;
    users_count: number;
  }[];
  permissions_by_module: {
    module: string;
    count: number;
    permissions: string[];
  }[];
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleFilters {
  search?: string;
}

// API Functions
export const roleService = {
  // Liste des rôles
  async getRoles(filters?: RoleFilters): Promise<{ data: Role[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/roles?${params.toString()}`);
    return response.data;
  },

  // Statistiques
  async getStats(): Promise<RoleStats> {
    const response = await api.get('/roles/stats');
    return response.data;
  },

  // Liste des permissions disponibles
  async getPermissions(): Promise<{ data: PermissionModule[]; total: number }> {
    const response = await api.get('/roles/permissions');
    return response.data;
  },

  // Détail d'un rôle
  async getRole(id: number): Promise<RoleDetail> {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // Créer un rôle
  async createRole(data: RoleFormData): Promise<{ message: string; role: Role }> {
    const response = await api.post('/roles', data);
    return response.data;
  },

  // Mettre à jour un rôle
  async updateRole(id: number, data: Partial<RoleFormData>): Promise<{ message: string; role: Role }> {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  // Supprimer un rôle
  async deleteRole(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },

  // Dupliquer un rôle
  async duplicateRole(id: number): Promise<{ message: string; role: Role }> {
    const response = await api.post(`/roles/${id}/duplicate`);
    return response.data;
  },
};

export default roleService;

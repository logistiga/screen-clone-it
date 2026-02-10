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
  page?: number;
  per_page?: number;
  has_users?: boolean;
  is_system?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// API Functions
export const roleService = {
  // Liste des rôles avec pagination
  async getRoles(filters?: RoleFilters): Promise<PaginatedResponse<Role>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.has_users !== undefined) params.append('has_users', filters.has_users.toString());
    if (filters?.is_system !== undefined) params.append('is_system', filters.is_system.toString());
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    
    const response = await api.get(`/admin/roles?${params.toString()}`);
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
    const data = response.data;
    
    // Normaliser les permissions (peuvent être des objets ou des chaînes)
    if (data.permissions && Array.isArray(data.permissions)) {
      data.permissions = data.permissions.map((p: string | { name: string }) => 
        typeof p === 'string' ? p : p?.name
      ).filter((p: string | undefined): p is string => typeof p === 'string' && p.length > 0);
    }
    
    return data;
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

  // Utilisateurs disponibles pour assignation
  async getAvailableUsers(roleId: number, search?: string): Promise<{ data: { id: number; name: string; email: string; actif: boolean; current_role: string | null }[]; total: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const response = await api.get(`/roles/${roleId}/available-users?${params.toString()}`);
    return response.data;
  },

  // Assigner des utilisateurs à un rôle
  async assignUsers(roleId: number, userIds: number[]): Promise<{ message: string; assigned_count: number }> {
    const response = await api.post(`/roles/${roleId}/assign-users`, { user_ids: userIds });
    return response.data;
  },

  // Désassigner un utilisateur d'un rôle
  async unassignUser(roleId: number, userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/roles/${roleId}/users/${userId}`);
    return response.data;
  },
};

export default roleService;

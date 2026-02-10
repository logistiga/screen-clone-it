import api from '@/lib/api';

// Types
export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  permissions?: string[];
}

export interface User {
  id: number;
  nom: string;
  email: string;
  actif: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  roles: UserRole[];
}

export interface UserDetail extends User {
  permissions: string[];
  avatar_url?: string | null;
}

export interface UserStats {
  total: number;
  actifs: number;
  inactifs: number;
  par_role: {
    role: string;
    count: number;
  }[];
  nouveaux_ce_mois: number;
  connexions_aujourdhui: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  actif?: boolean;
  per_page?: number;
  page?: number;
}

export type CreateUserData = {
  nom: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  actif?: boolean;
};

export interface UpdateUserData {
  nom?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
  actif?: boolean;
}

// API Functions
export const userService = {
  // Liste des utilisateurs paginée
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.actif !== undefined) params.append('actif', filters.actif.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Statistiques des utilisateurs
  async getStats(): Promise<UserStats> {
    // On va calculer les stats côté client depuis les données
    const allUsers = await api.get('/utilisateurs?per_page=1000');
    const users: User[] = allUsers.data.data;
    
    const actifs = users.filter(u => u.actif).length;
    const inactifs = users.filter(u => !u.actif).length;
    
    // Grouper par rôle
    const parRole: Record<string, number> = {};
    users.forEach(u => {
      const roleName = u.roles[0]?.name || 'Sans rôle';
      parRole[roleName] = (parRole[roleName] || 0) + 1;
    });
    
    // Nouveaux ce mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nouveauxCeMois = users.filter(u => new Date(u.created_at) >= startOfMonth).length;
    
    // Connexions aujourd'hui (simulation)
    const today = new Date().toISOString().split('T')[0];
    const connexionsAujourdhui = users.filter(u => 
      u.last_login_at && u.last_login_at.startsWith(today)
    ).length;
    
    return {
      total: users.length,
      actifs,
      inactifs,
      par_role: Object.entries(parRole).map(([role, count]) => ({ role, count })),
      nouveaux_ce_mois: nouveauxCeMois,
      connexions_aujourdhui: connexionsAujourdhui,
    };
  },

  // Détail d'un utilisateur
  async getUser(id: number): Promise<UserDetail> {
    const response = await api.get(`/utilisateurs/${id}`);
    return response.data;
  },

  // Créer un utilisateur
  async createUser(data: CreateUserData): Promise<User> {
    const payload: CreateUserData = {
      nom: String(data.nom ?? '').trim().slice(0, 100),
      email: String(data.email ?? '').trim().toLowerCase(),
      password: String(data.password ?? ''),
      password_confirmation: String(data.password_confirmation ?? ''),
      role: String(data.role ?? '').trim(),
      actif: data.actif ?? true,
    };

    // Debug temporaire - affiche le payload complet pour diagnostic
    // eslint-disable-next-line no-console
    console.log('POST /utilisateurs payload:', payload);
    // eslint-disable-next-line no-console
    console.log('payload.nom length:', payload.nom.length);

    const response = await api.post('/utilisateurs', payload);
    return response.data;
  },

  // Mettre à jour un utilisateur
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/utilisateurs/${id}`, data);
    return response.data;
  },

  // Supprimer un utilisateur
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/utilisateurs/${id}`);
    return response.data;
  },

  // Activer/Désactiver un utilisateur
  async toggleActif(id: number): Promise<{ message: string; user: User }> {
    const response = await api.patch(`/utilisateurs/${id}/toggle-actif`);
    return response.data;
  },

  // Liste des rôles disponibles
  async getRoles(): Promise<UserRole[]> {
    const response = await api.get('/utilisateurs/roles');
    return response.data;
  },

  // Profil de l'utilisateur connecté
  async getProfile(): Promise<UserDetail> {
    const response = await api.get('/auth/user');
    return response.data;
  },

  // Mettre à jour le profil
  async updateProfile(data: { nom?: string; email?: string }): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Changer le mot de passe
  async updatePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await api.put('/auth/password', data);
    return response.data;
  },

  // Télécharger une photo de profil
  async uploadAvatar(file: File): Promise<{ message: string; avatar_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Supprimer la photo de profil
  async deleteAvatar(): Promise<{ message: string }> {
    const response = await api.delete('/profile/avatar');
    return response.data;
  },
};

export default userService;

import { fetchApi } from './api';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'SUPER_ADMIN' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  formsCount?: number;
  submissionsCount?: number;
}

export interface UserStats {
  formsCount: number;
  submissionsCount: number;
  formsList: { id: string; title: string }[];
  activityLog: {
    id: string;
    type: 'form_created' | 'form_updated' | 'form_published' | 'submission_received';
    date: string;
    details: string;
  }[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  role?: 'SUPER_ADMIN' | 'CLIENT';
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  company?: string;
  phone?: string;
  website?: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'SUPER_ADMIN' | 'CLIENT';
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  company?: string;
  phone?: string;
  website?: string;
}

/**
 * Gets all users (admin only)
 */
const getAllUsers = async (): Promise<User[]> => {
  try {
    const users = await fetchApi<User[]>('/users');
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Gets a specific user by ID
 */
const getUserById = async (id: string): Promise<User> => {
  try {
    const user = await fetchApi<User>(`/users/${id}`);
    return user;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new user (admin only)
 */
const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    const user = await fetchApi<User>('/users', {
      method: 'POST',
      data: userData,
    });
    return user;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

/**
 * Updates a user
 */
const updateUser = async (id: string, userData: UpdateUserRequest): Promise<User> => {
  try {
    const user = await fetchApi<User>(`/users/${id}`, {
      method: 'PATCH',
      data: userData,
    });
    return user;
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a user (admin only)
 */
const deleteUser = async (id: string): Promise<{ id: string }> => {
  try {
    const result = await fetchApi<{ id: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};

/**
 * Gets detailed statistics for a user
 */
const getUserStats = async (id: string): Promise<UserStats> => {
  try {
    // Use the real backend endpoint to get user stats
    const stats = await fetchApi<UserStats>(`/users/${id}/stats`);
    return stats;
  } catch (error) {
    console.error(`Failed to fetch user stats for ${id}:`, error);
    throw error;
  }
};

/**
 * Reset user password (admin only)
 */
const resetUserPassword = async (id: string, newPassword: string): Promise<User> => {
  try {
    const user = await fetchApi<User>(`/users/${id}/reset-password`, {
      method: 'POST',
      data: { password: newPassword },
    });
    return user;
  } catch (error) {
    console.error(`Failed to reset password for user ${id}:`, error);
    throw error;
  }
};

export const adminService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  resetUserPassword,
}; 
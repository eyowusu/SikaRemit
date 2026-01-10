import api from './axios';

export interface AdminDashboardStats {
  overview: {
    total_users: number;
    active_users: number;
    total_revenue: number;
    revenue_growth: number;
    total_transactions: number;
    transaction_growth: number;
    pending_verifications: number;
    failed_payments: number;
  };
  revenue_by_period: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
  transactions_by_status: Record<string, number>;
  users_by_type: Record<string, number>;
  top_merchants: Array<{
    id: number;
    name: string;
    revenue: number;
    transaction_count: number;
  }>;
  recent_activities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  payment_methods: Record<string, number>;
  geographic_distribution: Record<string, number>;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await api.get('/api/admin/dashboard/stats/');
  return response.data;
}

export async function getAdminUsers(params?: any) {
  const response = await api.get('/api/v1/accounts/admin/users/', { params });
  return response.data;
}

export async function getAdminUserDetail(userId: number) {
  const response = await api.get(`/api/v1/accounts/admin/users/${userId}/`);
  return response.data;
}

export async function updateAdminUser(userId: number, data: any) {
  const response = await api.patch(`/api/v1/accounts/admin/users/${userId}/`, data);
  return response.data;
}

export async function deleteAdminUser(userId: number) {
  const response = await api.delete(`/api/v1/accounts/admin/users/${userId}/`);
  return response.data;
}

export async function getAdminVerifications(params?: any) {
  const response = await api.get('/api/v1/accounts/admin/verifications/pending/', { params });
  return response.data;
}

export async function approveVerification(verificationId: number, notes?: string) {
  const response = await api.post(`/api/v1/accounts/admin/verifications/${verificationId}/approve/`, { notes });
  return response.data;
}

export async function rejectVerification(verificationId: number, reason: string) {
  const response = await api.post(`/api/v1/accounts/admin/verifications/${verificationId}/reject/`, { reason });
  return response.data;
}

export async function exportAdminData(type: string, params?: any) {
  const response = await api.get('/api/v1/accounts/admin/export/', { 
    params: { type, ...params },
    responseType: 'blob'
  });
  return response.data;
}

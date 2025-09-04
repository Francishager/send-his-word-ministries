import { get, post, put, del } from '@/lib/api';

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'PRAYED_FOR' | 'RESOLVED';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  prayerCount: number;
  commentsCount: number;
}

export interface CreatePrayerRequestData {
  title: string;
  description: string;
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface UpdatePrayerRequestData extends Partial<CreatePrayerRequestData> {
  status?: 'PENDING' | 'IN_PROGRESS' | 'PRAYED_FOR' | 'RESOLVED';
}

export interface PrayerRequestComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export const prayerService = {
  // Prayer Requests
  getAllPrayerRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    isPublic?: boolean;
    userId?: string;
  }): Promise<{ requests: PrayerRequest[]; total: number }> => {
    return get<{ requests: PrayerRequest[]; total: number }>('/prayer-requests/', { params });
  },

  getPrayerRequestById: async (requestId: string): Promise<PrayerRequest> => {
    return get<PrayerRequest>(`/prayer-requests/${requestId}/`);
  },

  createPrayerRequest: async (data: CreatePrayerRequestData): Promise<PrayerRequest> => {
    return post<PrayerRequest>('/prayer-requests/', data);
  },

  updatePrayerRequest: async (
    requestId: string,
    data: UpdatePrayerRequestData
  ): Promise<PrayerRequest> => {
    return put<PrayerRequest>(`/prayer-requests/${requestId}/`, data);
  },

  deletePrayerRequest: async (requestId: string): Promise<{ detail: string }> => {
    return del<{ detail: string }>(`/prayer-requests/${requestId}/`);
  },

  // Prayer Actions
  prayForRequest: async (requestId: string): Promise<{ prayerCount: number }> => {
    return post<{ prayerCount: number }>(`/prayer-requests/${requestId}/pray/`);
  },

  // Comments
  getComments: async (requestId: string): Promise<PrayerRequestComment[]> => {
    return get<PrayerRequestComment[]>(`/prayer-requests/${requestId}/comments/`);
  },

  addComment: async (
    requestId: string,
    content: string
  ): Promise<PrayerRequestComment> => {
    return post<PrayerRequestComment>(`/prayer-requests/${requestId}/comments/`, { content });
  },

  deleteComment: async (requestId: string, commentId: string): Promise<{ detail: string }> => {
    return del<{ detail: string }>(`/prayer-requests/${requestId}/comments/${commentId}/`);
  },

  // User-specific endpoints
  getMyPrayerRequests: async (): Promise<PrayerRequest[]> => {
    return get<PrayerRequest[]>('/prayer-requests/my/');
  },

  getPrayedForRequests: async (): Promise<PrayerRequest[]> => {
    return get<PrayerRequest[]>('/prayer-requests/prayed/');
  },

  // Admin endpoints
  updateRequestStatus: async (
    requestId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'PRAYED_FOR' | 'RESOLVED'
  ): Promise<PrayerRequest> => {
    return post<PrayerRequest>(`/prayer-requests/${requestId}/status/`, { status });
  },

  // Search and filter
  searchPrayerRequests: async (query: string): Promise<PrayerRequest[]> => {
    return get<PrayerRequest[]>('/prayer-requests/search/', { params: { q: query } });
  },
};

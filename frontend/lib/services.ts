import { get, post, put, del } from '@/lib/api';

export type StreamProvider = 'youtube' | 'vimeo' | 'custom' | string;

export interface ServiceDTO {
  id: string;
  title: string;
  description?: string;
  status: 'wait' | 'started' | 'ended' | string;
  start_time?: string; // ISO
  end_time?: string;   // ISO
  stream_provider?: StreamProvider;
  stream_embed_url?: string | null;
  stream_source_id?: string | null;
  created_at?: string;
}

export interface ServiceInput {
  title: string;
  description?: string | null;
  status?: 'wait' | 'started' | 'ended' | string;
  start_time?: string | null; // ISO
  end_time?: string | null;   // ISO
  stream_provider?: StreamProvider | null;
  stream_embed_url?: string | null;
  stream_source_id?: string | null;
}

export const servicesApi = {
  async list(): Promise<ServiceDTO[]> {
    return await get<ServiceDTO[]>('/services/', { auth: true });
  },
  async retrieve(id: string): Promise<ServiceDTO> {
    return await get<ServiceDTO>(`/services/${id}/`, { auth: true });
    },
  async create(data: ServiceInput): Promise<ServiceDTO> {
    return await post<ServiceDTO>('/services/', data, { auth: true });
  },
  async update(id: string, data: ServiceInput): Promise<ServiceDTO> {
    return await put<ServiceDTO>(`/services/${id}/`, data, { auth: true });
  },
  async remove(id: string): Promise<void> {
    await del(`/services/${id}/`, { auth: true });
  },
};

import { get, post, put, del } from '@/lib/api';

export interface CampaignDTO {
  id: string;
  title: string;
  description?: string | null;
  goal_amount: string; // decimal as string from API
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignInput {
  title: string;
  description?: string;
  goal_amount: number;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export const campaignsApi = {
  async list(): Promise<CampaignDTO[]> {
    return get<CampaignDTO[]>('/donation-campaigns/', { auth: true });
  },
  async create(data: CampaignInput): Promise<CampaignDTO> {
    return post<CampaignDTO>('/donation-campaigns/', data, { auth: true });
  },
  async update(id: string, data: Partial<CampaignInput>): Promise<CampaignDTO> {
    return put<CampaignDTO>(`/donation-campaigns/${id}/`, data, { auth: true });
  },
  async remove(id: string): Promise<{ detail?: string }> {
    return del<{ detail?: string }>(`/donation-campaigns/${id}/`, { auth: true });
  },
};

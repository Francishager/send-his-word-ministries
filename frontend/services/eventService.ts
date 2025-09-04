import { get, post, put, del } from '@/lib/api';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  isPublic: boolean;
  maxAttendees?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  isPublic?: boolean;
  maxAttendees?: number;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

export const eventService = {
  // Get all events
  getAllEvents: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    isPublic?: boolean;
  }): Promise<{ events: Event[]; total: number }> => {
    return get<{ events: Event[]; total: number }>('/events/', { params });
  },

  // Get a single event by ID
  getEventById: async (eventId: string): Promise<Event> => {
    return get<Event>(`/events/${eventId}/`);
  },

  // Create a new event
  createEvent: async (eventData: CreateEventData): Promise<Event> => {
    return post<Event>('/events/', eventData);
  },

  // Update an existing event
  updateEvent: async (eventId: string, eventData: UpdateEventData): Promise<Event> => {
    return put<Event>(`/events/${eventId}/`, eventData);
  },

  // Delete an event
  deleteEvent: async (eventId: string): Promise<{ detail: string }> => {
    return del<{ detail: string }>(`/events/${eventId}/`);
  },

  // Register for an event
  registerForEvent: async (eventId: string): Promise<{ detail: string }> => {
    return post<{ detail: string }>(`/events/${eventId}/register/`);
  },

  // Cancel event registration
  cancelRegistration: async (eventId: string): Promise<{ detail: string }> => {
    return del<{ detail: string }>(`/events/${eventId}/register/`);
  },

  // Get user's registered events
  getMyEvents: async (): Promise<Event[]> => {
    return get<Event[]>('/events/my/');
  },

  // Get events created by the current user
  getMyCreatedEvents: async (): Promise<Event[]> => {
    return get<Event[]>('/events/created/');
  },

  // Upload event image
  uploadEventImage: async (eventId: string, file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    return post<{ imageUrl: string }>(`/events/${eventId}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

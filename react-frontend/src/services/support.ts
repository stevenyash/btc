import { api } from "./api";

export type SupportTicketStatus = "open" | "in_progress" | "resolved";
export type SupportTicketCategory = "payment" | "lesson_access" | "account" | "other";

export interface SupportTicketSubmission {
  name: string;
  email: string;
  phone: string;
  paymentReference: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
}

export interface CreatedSupportTicket {
  reference: string;
  trackingCode: string;
  status: SupportTicketStatus;
  createdAt: string;
}

export interface TrackedSupportTicket {
  reference: string;
  subject: string;
  status: SupportTicketStatus;
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportTicket {
  id: number;
  reference: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  payment_reference: string | null;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export const supportService = {
  async submitTicket(data: SupportTicketSubmission): Promise<CreatedSupportTicket> {
    const response = await api.post("/support-tickets", data);
    return response.data;
  },

  async trackTicket(trackingCode: string): Promise<TrackedSupportTicket> {
    const response = await api.get(`/support-tickets/track/${encodeURIComponent(trackingCode)}`);
    return response.data;
  },

  async getAdminTickets(
    page: number,
    limit: number,
    status: string,
    search: string
  ): Promise<{ data: AdminSupportTicket[]; total: number }> {
    const response = await api.get("/admin/support-tickets", {
      params: { page, limit, status: status || undefined, search: search || undefined },
    });
    return response.data;
  },

  async updateAdminTicket(
    id: number,
    data: { status: SupportTicketStatus; response: string }
  ): Promise<void> {
    await api.put(`/admin/support-tickets/${id}`, data);
  },
};

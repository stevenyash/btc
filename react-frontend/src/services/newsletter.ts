import { publicApi } from "./api";

export interface NewsletterSubscription {
  email: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

export const newsletterService = {
  async subscribe(email: string): Promise<NewsletterResponse> {
    const response = await publicApi.post("/newsletter/subscribe", { email });
    return response.data;
  },
};

export default newsletterService;

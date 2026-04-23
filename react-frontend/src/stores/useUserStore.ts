import { createGenericStore } from "./createGenericStore";

export interface User {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export const useUserStore = createGenericStore<User>("/users", "user");
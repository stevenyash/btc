import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiService } from "@/services/api";

interface GenericState<T> {
  data: T[];
  item: T | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

interface GenericActions<T> {
  fetchAll: (params?: Record<string, unknown>) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearError: () => void;
  reset: () => void;
}

export function createGenericStore<T extends { id: string }>(
  endpoint: string,
  storeName: string
) {
  type Store = GenericState<T> & GenericActions<T>;

  return create<Store>()(
    devtools(
      (set, get) => ({
        data: [],
        item: null,
        isLoading: false,
        error: null,
        total: 0,
        page: 1,
        limit: 10,

        fetchAll: async (params = {}) => {
          set({ isLoading: true, error: null });
          try {
            const { page, limit } = get();
            const response = await apiService.get<{
              data: T[];
              total: number;
            }>(endpoint, { page, limit, ...params });

            set({
              data: response.data,
              total: response.total,
              isLoading: false,
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to fetch data";
            set({
              error: message,
              isLoading: false,
            });
          }
        },

        fetchOne: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            const item = await apiService.get<T>(`${endpoint}/${id}`);
            set({ item, isLoading: false });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to fetch item";
            set({
              error: message,
              isLoading: false,
            });
          }
        },

        create: async (data: Partial<T>) => {
          set({ isLoading: true, error: null });
          try {
            const newItem = await apiService.post<T>(endpoint, data);
            set((state) => ({
              data: [newItem, ...state.data],
              isLoading: false,
            }));
            return newItem;
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create item";
            set({
              error: message,
              isLoading: false,
            });
            throw error;
          }
        },

        update: async (id: string, data: Partial<T>) => {
          set({ isLoading: true, error: null });
          try {
            const updatedItem = await apiService.put<T>(`${endpoint}/${id}`, data);
            set((state) => ({
              data: state.data.map((item) =>
                item.id === id ? updatedItem : item
              ),
              item: updatedItem,
              isLoading: false,
            }));
            return updatedItem;
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update item";
            set({
              error: message,
              isLoading: false,
            });
            throw error;
          }
        },

        remove: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            await apiService.delete(`${endpoint}/${id}`);
            set((state) => ({
              data: state.data.filter((item) => item.id !== id),
              isLoading: false,
            }));
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete item";
            set({
              error: message,
              isLoading: false,
            });
            throw error;
          }
        },

        setPage: (page: number) => {
          set({ page });
          get().fetchAll();
        },

        setLimit: (limit: number) => {
          set({ limit, page: 1 });
          get().fetchAll();
        },

        clearError: () => set({ error: null }),

        reset: () => {
          set({
            data: [],
            item: null,
            isLoading: false,
            error: null,
            total: 0,
            page: 1,
            limit: 10,
          });
        },
      }),
      { name: `${storeName}-store` }
    )
  );
}
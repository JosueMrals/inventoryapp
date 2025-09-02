import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { Product } from "../types";

export function useProducts() {
  return useQuery<Product[], import("axios").AxiosError>({
    queryKey: ["products"],
    queryFn: async ({ signal }): Promise<Product[]> => {
      const { data } = await api.get<Product[]>("/api/products", { signal });
      return data;
    },
    staleTime: 1000 * 60, // 1 minuto
    retry: 2,
  });
}

// Uso en un componente
const { data: products, isLoading, error } = useProducts();
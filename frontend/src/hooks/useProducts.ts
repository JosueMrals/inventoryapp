import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { Product } from "../types";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data } = await api.get<Product[]>("/api/products");
      return data;
    },
  });
}

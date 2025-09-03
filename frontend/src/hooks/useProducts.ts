import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

export interface Product {
  id: number;
  name: string;
  price: number;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery<Product[], any>(["products"], async () => {
    const res = await api.get<Product[]>("/api/products");
    return res.data;
  });

  const addProduct = useMutation(
    async (product: Omit<Product, "id">) => {
      const res = await api.post<Product>("/api/products", product);
      return res.data;
    },
    {
      onSuccess: (newProduct) => {
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? [...old, newProduct] : [newProduct]
        );
      },
    }
  );

  const editProduct = useMutation(
    async (product: Product) => {
      const res = await api.put<Product>(`/api/products/${product.id}`, product);
      return res.data;
    },
    {
      onSuccess: (updated) => {
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
        );
      },
    }
  );

  const deleteProduct = useMutation(
    async (id: number) => {
      await api.delete(`/api/products/${id}`);
      return id;
    },
    {
      onMutate: async (id) => {
        await queryClient.cancelQueries(["products"]);
        const previous = queryClient.getQueryData<Product[]>(["products"]);
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? old.filter((p) => p.id !== id) : []
        );
        return { previous };
      },
      onError: (err, id, context: any) => {
        if (context?.previous) queryClient.setQueryData(["products"], context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries(["products"]);
      },
    }
  );

  return { productsQuery, addProduct, editProduct, deleteProduct };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useState, useMemo } from "react";
import { Product } from "@/types";
import ProductForm from "@/components/ProductForm";
import ProductModal from "@/components/ProductModal";

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Leer productos
  const { data: products = [], isLoading } = useQuery<Product[], import("axios").AxiosError>(
    ["products"],
    async ({ signal }) => {
      const res = await api.get<Product[]>("/api/products", { signal });
      return res.data;
    },
    { staleTime: 60_000, retry: 2 }
  );

  // Filtrado en tiempo real
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.barcode, String(p.id), String(p.price), p.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  // Agregar
  const addMutation = useMutation<Product, import("axios").AxiosError, Omit<Product, "id">>(
    async (product) => {
      const res = await api.post<Product>("/api/products", product);
      return res.data;
    },
    {
      onSuccess: (newProduct) => {
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? [...old, newProduct] : [newProduct]
        );
        setIsModalOpen(false);
      },
    }
  );

  // Editar
  const editMutation = useMutation<Product, import("axios").AxiosError, Product>(
    async (product) => {
      const res = await api.put<Product>(`/api/products/${product.id}`, product);
      return res.data;
    },
    {
      onSuccess: (updated) => {
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
        );
        setIsModalOpen(false);
      },
    }
  );

  // Eliminar
  const deleteMutation = useMutation<number, import("axios").AxiosError, number>(
    async (id) => {
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
      onError: (_, __, context: any) => {
        if (context?.previous) queryClient.setQueryData(["products"], context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries(["products"]);
      },
    }
  );

  const handleSave = (data: Omit<Product, "id">) => {
    if (selectedProduct) {
      editMutation.mutate({ ...selectedProduct, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  if (isLoading) return <p>Cargando productos...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Buscador */}
      <div className="mb-4 w-80">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, código, id, precio..."
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Botón agregar */}
      <button
        onClick={() => {
          setSelectedProduct(null);
          setIsModalOpen(true);
        }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        + Agregar Producto
      </button>

      {/* Tabla */}
      <table className="border w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border px-2 py-1">Foto</th>
            <th className="border px-2 py-1">Código</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Precio</th>
            <th className="border px-2 py-1">Descripción</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <span className="text-gray-400">Sin foto</span>
                )}
              </td>
              <td className="border px-2 py-1">{p.barcode}</td>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">${p.price.toFixed(2)}</td>
              <td className="border px-2 py-1">{p.description || "—"}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setIsModalOpen(true);
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
                    deleteMutation.mutate(p.id);
                  }}
                  disabled={deleteMutation.isLoading}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No hay productos que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? "Editar Producto" : "Agregar Producto"}
      >
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </ProductModal>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import ProductModal from "@/components/ProductModal";
import { Product } from "@/types";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Obtener productos
  const { data: products = [], isLoading } = useQuery<Product[]>(
    ["products"],
    async () => (await api.get("/api/products")).data
  );

  // Mutaciones
  const addProduct = useMutation<Product, unknown, Omit<Product, "id">>(
    (newProd) => api.post("/api/products", newProd).then((res) => res.data),
    {
      onSuccess: (prod) => queryClient.setQueryData(["products"], (old: any) => [...(old || []), prod]),
    }
  );

  const editProduct = useMutation<Product, unknown, Product>(
    (prod) => api.put(`/api/products/${prod.id}`, prod).then((res) => res.data),
    {
      onSuccess: (updated) =>
        queryClient.setQueryData(["products"], (old: any) =>
          old.map((p: Product) => (p.id === updated.id ? updated : p))
        ),
    }
  );

  const deleteProduct = useMutation<number, unknown, number>(
    (id) => api.delete(`/api/products/${id}`).then(() => id),
    {
      onSuccess: (id) =>
        queryClient.setQueryData(["products"], (old: any) => old.filter((p: Product) => p.id !== id)),
    }
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q) || String(p.price).includes(q)
    );
  }, [products, search]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          Agregar producto
        </button>
      </div>

      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2">ID</th>
            <th className="border px-2">Nombre</th>
            <th className="border px-2">Precio</th>
            <th className="border px-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td className="border px-2">{p.id}</td>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">${p.price}</td>
              <td className="border px-2 flex gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(p);
                    setIsModalOpen(true);
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteProduct.mutate(p.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No hay productos
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingProduct) editProduct.mutate({ ...editingProduct, ...data });
            else addProduct.mutate(data as Omit<Product, "id">);
          }}
        />
      )}
    </div>
  );
}

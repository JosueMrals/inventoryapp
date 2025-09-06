import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useState, useMemo, useEffect } from "react";
import ProductModal from "@/components/ProductModal";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  barcode?: string;
  image?: string; // siempre string o undefined
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Estados
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Leer productos
  const { data: products = [], isLoading } = useQuery<Product[], any>(
    ["products"],
    async () => {
      const res = await api.get("/api/products");
      return res.data;
    }
  );

  // Mutaciones
  const addMutation = useMutation<Product, any, Omit<Product, "id">>(
    (product) => api.post("/api/products", product).then(res => res.data),
    {
      onSuccess: (newProduct) => {
        queryClient.setQueryData<Product[]>(["products"], (old) => old ? [...old, newProduct] : [newProduct]);
        setModalProduct(null);
      },
    }
  );

  const editMutation = useMutation<Product, any, Product>(
    (product) => api.put(`/api/products/${product.id}`, product).then(res => res.data),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData<Product[]>(["products"], (old) =>
          old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
        );
        setModalProduct(null);
      },
    }
  );

  const deleteMutation = useMutation<number, any, number>(
    (id) => api.delete(`/api/products/${id}`).then(() => id),
    {
      onSuccess: (id) => {
        queryClient.setQueryData<Product[]>(["products"], (old) =>
          old ? old.filter((p) => p.id !== id) : []
        );
      },
    }
  );

  // Filtrado en tiempo real
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      String(p.price).includes(q) ||
      (p.barcode?.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Manejo de modal
  const handleEdit = (product: Product) => setModalProduct(product);

  const handleBarcodeScan = (code: string) => {
    const found = products.find((p) => p.barcode === code);
    if (found) setModalProduct(found);
    else setModalProduct({ id: 0, name: "", price: 0, barcode: code });
  };

  // Detectar código de barras automáticamente
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const code = buffer.trim();
        if (code) handleBarcodeScan(code);
        buffer = "";
      } else {
        buffer += e.key;
      }
    };
    window.addEventListener("keypress", handler);
    return () => window.removeEventListener("keypress", handler);
  }, [products]);

  if (isLoading) return <p>Cargando productos...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Buscador */}
      <div className="mb-4 w-80">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, id, precio o código..."
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Tabla */}
      <table className="border w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2">ID</th>
            <th className="border px-2">Nombre</th>
            <th className="border px-2">Precio</th>
            <th className="border px-2">Código</th>
            <th className="border px-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td className="border px-2">{p.id}</td>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">${p.price}</td>
              <td className="border px-2">{p.barcode || "-"}</td>
              <td className="border px-2 flex gap-2">
                <button
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                  onClick={() => handleEdit(p)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                  onClick={() => {
                    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
                    deleteMutation.mutate(p.id);
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-500">
                No hay productos que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct.id === 0 ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          onSubmit={(data) => {
            // Convertimos image a string antes de mutar
            let imageValue: string | undefined = undefined;
            if (typeof data.image === "string") imageValue = data.image;

            const payload: Product = {
              ...modalProduct,
              name: data.name,
              price: data.price,
              description: data.description,
              barcode: data.barcode,
              image: imageValue,
              id: modalProduct.id,
            };

            if (modalProduct.id === 0) {
              addMutation.mutate(payload);
            } else {
              editMutation.mutate(payload);
            }
          }}
        />
      )}
    </div>
  );
}

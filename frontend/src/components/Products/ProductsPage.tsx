import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useState, useEffect } from "react";
import ProductModal from "./ProductModal";
import ProductTable from "./ProductTable";
import ProductSearch from "./ProductSearch";
import Pagination from "./Pagination";
import { Product } from "@/types";

const PAGE_SIZE = 19;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Leer productos
  const { data: products = [], isLoading } = useQuery<Product[], any>(
    ["products"],
    async () => (await api.get("/api/products")).data
  );

  // Mutaciones
  const addMutation = useMutation<Product, any, Omit<Product, "id">>(
    async (product) => {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value as any);
      });
      const res = await api.post("/api/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    {
      onSuccess: (newProduct) => {
        queryClient.setQueryData<Product[]>(["products"], (old) =>
          old ? [...old, newProduct] : [newProduct]
        );
        setModalProduct(null);
      },
    }
  );

  const editMutation = useMutation<Product, any, Product>(
    async (product) => {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value as any);
      });
      const res = await api.put(`/api/products/${product.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
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

  const handleEdit = (product: Product) => setModalProduct(product);

  const handleBarcodeScan = (code: string) => {
    const found = products.find((p) => p.barcode === code);
    if (found) setModalProduct(found);
    else setModalProduct({ id: 0, name: "", price: 0, barcode: code });
  };

  // Escaneo de código de barras automáticamente
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

  // Paginación
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const currentProducts = products.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      <ProductSearch products={products} onSelect={handleEdit} />

      <ProductTable
        products={currentProducts}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct.id === 0 ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          onSubmit={(data) => {
            const payload: Product = {
              ...modalProduct,
              ...data,
              id: modalProduct.id,
            };
            if (modalProduct.id === 0) addMutation.mutate(payload);
            else editMutation.mutate(payload);
          }}
        />
      )}
    </div>
  );
}

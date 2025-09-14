import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import ProductModal from "./ProductModal";
import ProductTable from "./ProductTable";
import ProductSearch from "./ProductSearch";
import Pagination from "./Pagination";
import { Product } from "@/types";
import { db } from "@/offline/db";
import { initSyncManager, isOnline } from "@/offline/syncManager";

const PAGE_SIZE = 20;

function isFile(value: unknown): value is File {
  return value instanceof File;
}

// Excluimos id para evitar enviarlo al backend
function createFormData(data: Omit<Product, "id"> | Product) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("price", data.price.toString());
  if (data.description) formData.append("description", data.description);
  if (data.barcode) formData.append("barcode", data.barcode);
  if (data.image) {
    if (isFile(data.image)) formData.append("image", data.image);
    else if (typeof data.image === "string") formData.append("image", data.image);
  }
  return formData;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref para input oculto de código de barras
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Inicializa el sync manager
  useEffect(() => {
    initSyncManager(setProducts);
  }, []);

  // Cargar productos desde backend o IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        if (isOnline()) {
          const res = await fetch("/api/products");
          const data: Product[] = await res.json();
          setProducts(data);
          await db.products.clear();
          await db.products.bulkPut(data);
        } else {
          const local = await db.products.toArray();
          setProducts(local);
        }
      } catch (err) {
        console.error(err);
        const local = await db.products.toArray();
        setProducts(local);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Guardar producto
  const saveProduct = async (data: Omit<Product, "id">, id?: number) => {
    // Si no hay id, generamos uno temporal negativo para distinguirlo
    const tempId = id ?? -Date.now();
    const product: Product = { ...data, id: tempId };

    // Guardar local
    await db.products.put(product);

    // Actualizar estado local inmediatamente
    setProducts((prev) =>
      id ? prev.map((p) => (p.id === id ? product : p)) : [...prev, product]
    );

    if (!isOnline()) {
      // Offline: agregar operación pendiente
      await db.pendingOps.add({ type: id ? "update" : "add", product });
      return;
    }

    // Online: enviar al backend
    const formData = createFormData(product);
    try {
      const res = await fetch(id ? `/api/products/${id}` : "/api/products", {
        method: id ? "PUT" : "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const saved: Product = await res.json();

      // Si era id temporal, actualizar IndexedDB y estado con id real
      if (tempId < 0) {
        await db.products.delete(tempId);
      }
      await db.products.put(saved);

      setProducts((prev) =>
        tempId < 0
          ? prev.map((p) => (p.id === tempId ? saved : p))
          : prev.map((p) => (p.id === saved.id ? saved : p))
      );
    } catch (err) {
      console.error(err);
      // En caso de error online, agregar a pendingOps para reintento
      await db.pendingOps.add({ type: id ? "update" : "add", product });
    }
  };

  // Eliminar producto
  const deleteProduct = async (id: number) => {
    // Borrar localmente
    await db.products.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (!isOnline()) {
      // Offline: agregar operación pendiente
      await db.pendingOps.add({ type: "delete", product: { id } as Product });
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
    } catch (err) {
      console.error(err);
      // En caso de error online, agregar a pendingOps para reintento
      await db.pendingOps.add({ type: "delete", product: { id } as Product });
    }
  };

  // Manejo mejorado del input de código de barras con input oculto
  useEffect(() => {
    const input = barcodeInputRef.current;
    if (!input) return;

    const handleInput = () => {
      const code = input.value.trim();
      if (code) {
        handleBarcodeScan(code);
        input.value = "";
      }
    };

    input.addEventListener("change", handleInput);
    return () => {
      input.removeEventListener("change", handleInput);
    };
  }, [products]);

  const handleBarcodeScan = (code: string) => {
    const found = products.find((p) => p.barcode === code);
    if (found) setModalProduct(found);
    else setModalProduct({ id: 0, name: "", price: 0, barcode: code });
  };

  if (loading) return <p>Cargando productos...</p>;

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const currentProducts = products.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Input oculto para código de barras */}
      <input
        placeholder="Escanea código de barras"
        ref={barcodeInputRef}
        type="text"
        style={{ position: "absolute", left: "-9999px" }}
        autoComplete="off"
        autoFocus
      />

      <ProductSearch products={products} onSelect={(p) => setModalProduct(p)} />

      <ProductTable
        products={currentProducts}
        onEdit={(p) => setModalProduct(p)}
        onDelete={deleteProduct}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {modalProduct && (
        <ProductModal
          product={modalProduct.id === 0 ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          onSubmit={(data) =>
            saveProduct(data, modalProduct.id === 0 ? undefined : modalProduct.id)
          }
        />
      )}
    </div>
  );
}
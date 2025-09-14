import { useState, useEffect, useRef } from "react";
import ProductModal from "./ProductModal";
import ProductTable from "./ProductTable";
import ProductSearch from "./ProductSearch";
import Pagination from "./Pagination";
import { Product } from "@/types";
import { db } from "@/offline/db";
import { initSyncManager, isOnline } from "@/offline/syncManager";
import api from "@/api/axios";

const PAGE_SIZE = 20;

// Type guard seguro para File (evita problemas con instanceof en TS)
function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

// Crea FormData sin incluir id
function createFormData(data: Omit<Product, "id"> | Product) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("price", data.price.toString());
  if (data.description) formData.append("description", data.description);
  if (data.barcode) formData.append("barcode", data.barcode);
  if (data.image) {
    if (isFile(data.image)) {
      formData.append("image", data.image);
    } else if (typeof data.image === "string") {
      formData.append("image", data.image);
    }
  }
  return formData;
}

// Helpers para normalizar respuestas del backend
function hasData<T>(payload: unknown): payload is { data: T } {
  return (
    !!payload &&
    typeof payload === "object" &&
    "data" in (payload as any) &&
    !Array.isArray((payload as any).data)
  );
}

function hasArrayData<T>(payload: unknown): payload is { data: T[] } {
  return (
    !!payload &&
    typeof payload === "object" &&
    Array.isArray((payload as any).data)
  );
}

function normalizeEntityResponse<T>(payload: unknown): T {
  return hasData<T>(payload) ? (payload as { data: T }).data : (payload as T);
}

function normalizeCollectionResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (hasArrayData<T>(payload)) return (payload as { data: T[] }).data;
  throw new Error("Formato de respuesta inesperado");
}

export default function ProductsPage() {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref para input oculto de código de barras
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Inicializa el sync manager con callback para refrescar estado desde IndexedDB
  useEffect(() => {
    initSyncManager(setProducts);
  }, []);

  // Cargar productos desde backend o IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        if (isOnline()) {
          const res = await api.get("/api/products");
          const list = normalizeCollectionResponse<Product>(res.data);
          setProducts(list);
          await db.products.clear();
          await db.products.bulkPut(list);
        } else {
          const local = await db.products.toArray();
          setProducts(local);
        }
      } catch (err) {
        console.error("[LOAD] Error desde backend. Intentando IndexedDB:", err);
        const local = await db.products.toArray();
        setProducts(local);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Guardar producto (create/update)
  const saveProduct = async (data: Omit<Product, "id">, id?: number) => {
    // Usa id temporal negativo si es nuevo
    const tempId = id ?? -Date.now();
    const product: Product = { ...data, id: tempId };

    // Guardar local inmediato (optimistic update)
    await db.products.put(product);
    setProducts((prev) =>
      id ? prev.map((p) => (p.id === id ? product : p)) : [...prev, product]
    );

    if (!isOnline()) {
      // Offline: cola de pendingOps para sync
      await db.pendingOps.add({ type: id ? "update" : "add", product });
      return;
    }

    // Online: enviar al backend con FormData
    const formData = createFormData(product);
    try {
      const res = await api.request({
        url: id ? `/api/products/${id}` : "/api/products",
        method: id ? "PUT" : "POST",
        data: formData,
        // No fijes Content-Type manual: axios lo añade con boundary
      });

      const saved = normalizeEntityResponse<Product>(res.data);

      if (!saved || typeof saved.id !== "number") {
        console.warn("[SAVE] Respuesta sin producto. Refrescando listado.");
        const reload = await api.get("/api/products");
        const list = normalizeCollectionResponse<Product>(reload.data);
        setProducts(list);
        await db.products.clear();
        await db.products.bulkPut(list);
        return;
      }

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
      console.error("[SAVE] Error online. Encolando operación:", err);
      await db.pendingOps.add({ type: id ? "update" : "add", product });
    }
  };

  // Eliminar producto
  const deleteProduct = async (id: number) => {
    // Borrado local optimista
    await db.products.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (!isOnline()) {
      await db.pendingOps.add({ type: "delete", product: { id } as Product });
      return;
    }

    try {
      await api.delete(`/api/products/${id}`);
    } catch (err) {
      console.error("[DELETE] Error online. Encolando operación:", err);
      await db.pendingOps.add({ type: "delete", product: { id } as Product });
    }
  };

  // Input oculto para escáner
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
import { db } from "./db";
import api from "@/api/axios";
import { Product } from "@/types";

let isSyncing = false;

export function isOnline(): boolean {
  return window.navigator.onLine;
}

// Función para verificar si un valor es un File
function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

// Crear FormData para enviar producto al backend (sin id)
function createFormData(product: Omit<Product, "id"> | Product) {
  const formData = new FormData();
  formData.append("name", product.name);
  formData.append("price", product.price.toString());
  if (product.description) formData.append("description", product.description);
  if (product.barcode) formData.append("barcode", product.barcode);
  if (product.image) {
    if (isFile(product.image)) {
      formData.append("image", product.image);
    } else if (typeof product.image === "string") {
      formData.append("image", product.image);
    }
  }
  return formData;
}

// Función para sincronizar operaciones pendientes
export async function syncPendingOperations(onUpdateProducts?: (products: Product[]) => void) {
  const pendingOps = await db.pendingOps.toArray();

  for (const op of pendingOps) {
    try {
      if (op.type === "add") {
        // En add, enviamos POST sin id (eliminamos id temporal)
        const { id, ...productData } = op.product;
        const formData = createFormData(productData);

        const res = await api.post<Product>("/api/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const saved = res.data;

        // Actualizar IndexedDB: borrar producto con id temporal y agregar el guardado con id real
        await db.products.delete(op.product.id!);
        await db.products.put(saved);

        if (onUpdateProducts) {
          const allProducts = await db.products.toArray();
          onUpdateProducts(allProducts);
        }

        if (op.id !== undefined) await db.pendingOps.delete(op.id);
      } else if (op.type === "update") {
        // En update, enviamos PUT con id real
        const formData = createFormData(op.product);

        await api.put(`/api/products/${op.product.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Actualizar IndexedDB con producto actualizado
        await db.products.put(op.product);

        if (onUpdateProducts) {
          const allProducts = await db.products.toArray();
          onUpdateProducts(allProducts);
        }

        if (op.id !== undefined) await db.pendingOps.delete(op.id);
      } else if (op.type === "delete") {
        // En delete, enviamos DELETE con id
        await api.delete(`/api/products/${op.product.id}`);

        // Borrar localmente ya se hizo al crear la operación pendiente

        if (onUpdateProducts) {
          const allProducts = await db.products.toArray();
          onUpdateProducts(allProducts);
        }

        if (op.id !== undefined) await db.pendingOps.delete(op.id);
      }
    } catch (err) {
      console.error("[SYNC] Error procesando operación pendiente", op, err);
      // No eliminar la operación pendiente para reintento futuro
    }
  }
}

// Sincroniza todos los datos locales al backend
export async function syncAll(onUpdateProducts?: (products: Product[]) => void) {
  if (!isOnline() || isSyncing) return;
  isSyncing = true;

  try {
    await syncPendingOperations(onUpdateProducts);
    console.log("[SYNC] Operaciones pendientes sincronizadas con éxito");
  } catch (err) {
    console.error("[SYNC] Error sincronizando", err);
  } finally {
    isSyncing = false;
  }
}

// Cargar productos desde el backend y guardarlos localmente
export async function refreshLocalProducts(onUpdateProducts?: (products: Product[]) => void) {
  if (!isOnline()) return;

  try {
    const res = await api.get<Product[]>("/api/products");
    await db.products.clear();
    await db.products.bulkPut(res.data);

    if (onUpdateProducts) onUpdateProducts(res.data);
  } catch (err) {
    console.error("[SYNC] Error actualizando productos locales", err);
  }
}

// Escuchar cambio de estado online/offline
export function initSyncManager(onUpdateProducts?: (products: Product[]) => void) {
  window.addEventListener("online", async () => {
    console.log("[SYNC] Internet reconectado. Sincronizando...");
    await syncAll(onUpdateProducts);
    await refreshLocalProducts(onUpdateProducts);
  });

  window.addEventListener("offline", () => {
    console.warn("[SYNC] Se perdió la conexión. Trabajando en modo offline...");
  });
}

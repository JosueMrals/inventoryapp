import { db } from "./db";
import api from "@/api/axios";
import { Product } from "@/types";

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

export async function addPendingOperation(
  type: "add" | "update" | "delete",
  product: Product
) {
  await db.pendingOps.add({ type, product });
}

export async function syncPendingOperations() {
  const ops = await db.pendingOps.toArray();

  for (const op of ops) {
    try {
      if (op.type === "add") {
        const { id, ...productData } = op.product;
        const formData = createFormData(productData);

        const res = await api.post<Product>("/api/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await db.products.put(res.data); // actualizamos local

      } else if (op.type === "update" && op.product.id) {
        const formData = createFormData(op.product);

        const res = await api.put<Product>(`/api/products/${op.product.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await db.products.put(res.data);

      } else if (op.type === "delete" && op.product.id) {
        await api.delete(`/api/products/${op.product.id}`);
        await db.products.delete(op.product.id);
      }

      if (op.id !== undefined) {
        await db.pendingOps.delete(op.id);
      } else {
        console.warn("Operación pendiente sin id, no se puede eliminar", op);
      }
    } catch (err) {
      console.error("Error sincronizando operación pendiente", op, err);
      // si falla, dejamos la operación en cola para reintento
    }
  }
}

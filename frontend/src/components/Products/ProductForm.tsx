import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { Product } from "@/types";

interface ProductFormProps {
  product?: Product; // undefined si es nuevo
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");

  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  const addMutation = useMutation<Product, any, Omit<Product, "id">>(
    (data) => api.post("/api/products", data).then(res => res.data),
    {
      onSuccess: (newProduct) => {
        queryClient.setQueryData<Product[]>(["products"], (old) => old ? [...old, newProduct] : [newProduct]);
        onClose();
      },
    }
  );

  const editMutation = useMutation<Product, any, Product>(
    (data) => api.put(`/api/products/${data.id}`, data).then(res => res.data),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData<Product[]>(["products"], (old) =>
          old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
        );
        onClose();
      },
    }
  );

  const handleSubmit = () => {
    let valid = true;

    if (!name.trim()) { setNameError("El nombre es requerido"); valid = false; } else { setNameError(""); }
    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setPriceError("El precio debe ser mayor a 0"); valid = false; } else { setPriceError(""); }

    if (!valid) return;

    const payload = {
      name: name.trim(),
      price: parsedPrice,
      description: description.trim() || undefined,
      barcode: barcode.trim() || undefined
    };

    if (product?.id) editMutation.mutate({ ...product, ...payload });
    else addMutation.mutate(payload);
  };

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description || "");
      setBarcode(product.barcode || "");
    }
  }, [product]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="border p-2 rounded"
      />
      {nameError && <p className="text-red-600 text-sm">{nameError}</p>}

      <input
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Precio"
        className="border p-2 rounded"
      />
      {priceError && <p className="text-red-600 text-sm">{priceError}</p>}

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="border p-2 rounded"
      />

      <input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Código de barras (opcional)"
        className="border p-2 rounded"
      />

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          {product ? "Actualizar" : "Agregar"}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

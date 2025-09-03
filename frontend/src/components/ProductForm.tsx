import { useState, useEffect } from "react";
import { Product } from "@/hooks/useProducts";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    setName(product?.name || "");
    setPrice(product?.price.toString() || "");
    setNameError("");
    setPriceError("");
  }, [product]);

  const handleSubmit = () => {
    let valid = true;

    if (!name.trim()) {
      setNameError("El nombre no puede estar vacío.");
      valid = false;
    } else setNameError("");

    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("El precio debe ser mayor a 0.");
      valid = false;
    } else setPriceError("");

    if (!valid) return;

    onSubmit({ name: name.trim(), price: parsedPrice });
    setName("");
    setPrice("");
  };

  return (
    <div className="flex flex-col gap-2 w-80 mb-4">
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
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Precio"
        className="border p-2 rounded"
      />
      {priceError && <p className="text-red-600 text-sm">{priceError}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          {product ? "Actualizar" : "Agregar"}
        </button>
        {product && onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

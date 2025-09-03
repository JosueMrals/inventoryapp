import { useState, useEffect } from "react";
import { Product } from "@/types";
import { UseMutateFunction } from "@tanstack/react-query";

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: UseMutateFunction<Product, unknown, Omit<Product, "id"> | Product, unknown>;
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");

  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
    } else {
      setName("");
      setPrice("");
    }
  }, [product]);

  const handleSubmit = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("El nombre no puede estar vacío");
      valid = false;
    } else setNameError("");

    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("El precio debe ser mayor a 0");
      valid = false;
    } else setPriceError("");

    if (!valid) return;

    if (product) {
      onSave({ ...product, name: name.trim(), price: parsedPrice });
    } else {
      onSave({ name: name.trim(), price: parsedPrice });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-80">
        <h2 className="text-xl font-bold mb-4">{product ? "Editar Producto" : "Agregar Producto"}</h2>

        <input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full mb-1"
        />
        {nameError && <p className="text-red-600 text-sm mb-2">{nameError}</p>}

        <input
          placeholder="Precio"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 rounded w-full mb-1"
        />
        {priceError && <p className="text-red-600 text-sm mb-2">{priceError}</p>}

        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            {product ? "Actualizar" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

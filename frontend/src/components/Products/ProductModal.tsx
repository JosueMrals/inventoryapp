import { useState, useEffect } from "react";
import { Product } from "@/types";

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: Omit<Product, "id">) => void;
}

export default function ProductModal({ product, onClose, onSubmit }: ProductModalProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [image, setImage] = useState<File | null>(null);

  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  // Reset modal state al cambiar producto
  useEffect(() => {
    setName(product?.name || "");
    setPrice(product?.price.toString() || "");
    setDescription(product?.description || "");
    setBarcode(product?.barcode || "");
    setImage(null);
    setNameError("");
    setPriceError("");
  }, [product]);

  const handleSave = () => {
    let valid = true;

    if (!name.trim()) { 
      setNameError("El nombre es obligatorio."); 
      valid = false; 
    } else setNameError("");

    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { 
      setPriceError("El precio debe ser mayor a 0."); 
      valid = false; 
    } else setPriceError("");

    if (!valid) return;

    // Preparamos la data para enviar
    const data: Omit<Product, "id"> = {
      name: name.trim(),
      price: parsedPrice,
      description: description.trim(),
      barcode: barcode.trim(),
      image: typeof image === "string"
        ? image
        : (typeof product?.image === "string" ? product.image : undefined)
    };

    onSubmit(data);  // llama a la mutación de ProductsPage
    setImage(null);  // limpiamos input de imagen
    onClose();       // cerramos modal
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">{product ? "Editar Producto" : "Agregar Producto"}</h2>

        <div className="flex flex-col gap-2 mb-2">
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
          />
          {nameError && <p className="text-red-600 text-sm">{nameError}</p>}

          <input
            type="number"
            placeholder="Precio"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border p-2 rounded"
          />
          {priceError && <p className="text-red-600 text-sm">{priceError}</p>}

          <input
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="Código de barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="border p-2 rounded"
          />

          <label className="block text-sm font-medium text-gray-700">Imagen del producto</label>
          <input
            placeholder="Imagen"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />

          {product?.image && typeof product.image === "string" && !image && (
            <img src={product.image} alt={product.name} className="mt-2 w-24 h-24 object-cover border rounded" />
          )}

          {image && (
            <img src={URL.createObjectURL(image)} alt="Nueva imagen" className="mt-2 w-24 h-24 object-cover border rounded" />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            {product ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

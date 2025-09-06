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
  const [image, setImage] = useState<File | string | null>(product?.image || null);

  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  // Validaciones
  const validate = () => {
    let valid = true;
    if (!name.trim()) { setNameError("El nombre es obligatorio."); valid = false; } 
    else setNameError("");

    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setPriceError("El precio debe ser mayor a 0."); valid = false; } 
    else setPriceError("");

    return valid;
  };

  // Guardar producto
  const handleSave = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      barcode: barcode.trim(),
      image: image instanceof File ? image.name : image || undefined,
    });

    onClose();
  };

  // Mostrar preview de imagen si es File
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (image && image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof image === "string") {
      setPreview(image);
    } else {
      setPreview(null);
    }
  }, [image]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">{product ? "Editar Producto" : "Agregar Producto"}</h2>

        <div className="flex flex-col gap-2 mb-2">
          <input
            placeholder="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border p-2 rounded"
          />
          {nameError && <p className="text-red-600 text-sm">{nameError}</p>}

          <input
            type="number"
            placeholder="Precio"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="border p-2 rounded"
          />
          {priceError && <p className="text-red-600 text-sm">{priceError}</p>}

          <input
            placeholder="Descripción"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="Código de barras"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="file"
            placeholder="Imagen"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />

          {preview && <img src={preview} alt="Preview" className="w-32 h-32 object-cover mt-2 rounded border" />}
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

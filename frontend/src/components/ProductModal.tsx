import { useState, useEffect } from "react";

interface ProductModalProps {
  product?: {
    id: number;
    name: string;
    price: number;
    description?: string;
    barcode?: string;
    image?: string;
  };
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    price: number;
    description?: string;
    barcode?: string;
    image?: File | string | null;
  }) => void;
}

export default function ProductModal({ product, onClose, onSubmit }: ProductModalProps) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [image, setImage] = useState<File | string | null>(product?.image || null);
  const [preview, setPreview] = useState<string | null>(product?.image || null);

  const [errors, setErrors] = useState({ name: "", price: "" });

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    if (typeof image === "string") {
      setPreview(image);
    } else if (image instanceof File) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(image);
    }
  }, [image]);

  const handleSubmit = () => {
    let valid = true;
    const errs = { name: "", price: "" };

    if (!name.trim()) {
      errs.name = "El nombre es obligatorio.";
      valid = false;
    }
    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      errs.price = "El precio debe ser mayor a 0.";
      valid = false;
    }
    setErrors(errs);

    if (!valid) return;

    onSubmit({
      name: name.trim(),
      price: parsedPrice,
      description: description.trim() || undefined,
      barcode: barcode.trim() || undefined,
      image,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded w-96 relative">
        <h2 className="text-xl font-bold mb-4">{product ? "Editar Producto" : "Nuevo Producto"}</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="border p-2 rounded w-full mb-1"
        />
        {errors.name && <p className="text-red-600 text-sm mb-2">{errors.name}</p>}

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
          className="border p-2 rounded w-full mb-1"
        />
        {errors.price && <p className="text-red-600 text-sm mb-2">{errors.price}</p>}

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          className="border p-2 rounded w-full mb-1"
        />

        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Código de barras"
          className="border p-2 rounded w-full mb-1"
        />

        <label className="block mb-2 mt-2">
          Imagen:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="mb-2 rounded w-32 h-32 object-cover" />
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

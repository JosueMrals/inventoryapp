import { useForm } from "react-hook-form";
import { Product } from "@/types";

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
}

export default function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<Product, "id">>({
    defaultValues: initialData ?? {
      name: "",
      price: 0,
      barcode: "",
      description: "",
      imageUrl: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-4"
    >
      {/* Nombre */}
      <div>
        <label className="block font-semibold">Nombre</label>
        <input
          {...register("name", { required: "El nombre es obligatorio" })}
          placeholder="Ej. Coca Cola"
          className="border p-2 rounded w-full"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      {/* Precio */}
      <div>
        <label className="block font-semibold">Precio</label>
        <input
          type="number"
          step="0.01"
          {...register("price", {
            required: "El precio es obligatorio",
            min: { value: 0.01, message: "El precio debe ser mayor que 0" },
          })}
          placeholder="Ej. 25.50"
          className="border p-2 rounded w-full"
        />
        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
      </div>

      {/* Código de barras */}
      <div>
        <label className="block font-semibold">Código de Barras</label>
        <input
          {...register("barcode", { required: "El código de barras es obligatorio" })}
          placeholder="Ej. 7501035910109"
          className="border p-2 rounded w-full"
        />
        {errors.barcode && <p className="text-red-500 text-sm">{errors.barcode.message}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label className="block font-semibold">Descripción</label>
        <textarea
          {...register("description")}
          placeholder="Ej. Bebida gaseosa de 600ml"
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Imagen */}
      <div>
        <label className="block font-semibold">Foto (URL opcional)</label>
        <input
          {...register("imageUrl")}
          placeholder="Ej. https://misfotos.com/cocacola.jpg"
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {initialData ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

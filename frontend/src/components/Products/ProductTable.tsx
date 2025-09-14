import { Product } from "@/types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  return (
    <table className="border w-full mb-4">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2">ID</th>
          <th className="border px-2">Imagen</th>
          <th className="border px-2">Nombre</th>
          <th className="border px-2">Precio</th>
          <th className="border px-2">Código</th>
          <th className="border px-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td className="border px-2">{p.id}</td>
            <td className="border px-2 flex justify-center">
              {p.image ? (
                <img
                  src={typeof p.image === "string" ? p.image : ""}
                  alt={p.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <span className="text-gray-400 text-sm">Sin imagen</span>
              )}
            </td>
            <td className="border px-2">{p.name}</td>
            <td className="border px-2">${p.price}</td>
            <td className="border px-2">{p.barcode || "-"}</td>
            <td className="border px-2 flex gap-2">
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                onClick={() => onEdit(p)}
              >
                Editar
              </button>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                onClick={() => onDelete(p.id)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

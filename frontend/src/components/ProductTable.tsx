import { Product } from "@/hooks/useProducts";
import { useState, useMemo } from "react";

interface ProductTableProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  rowsPerPage?: number;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  rowsPerPage = 5,
}: ProductTableProps) {
  const [sortKey, setSortKey] = useState<keyof Product>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [products, sortKey, sortAsc]);

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const handleSort = (key: keyof Product) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <>
      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            {["id", "name", "price"].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key as keyof Product)}
                className="border px-2 cursor-pointer select-none"
              >
                {key.toUpperCase()} {sortKey === key ? (sortAsc ? "↑" : "↓") : ""}
              </th>
            ))}
            <th className="border px-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((p) => (
            <tr key={p.id}>
              <td className="border px-2">{p.id}</td>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">${p.price}</td>
              <td className="border px-2 flex gap-2">
                <button
                  onClick={() => onEdit(p)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No hay productos.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 py-1">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

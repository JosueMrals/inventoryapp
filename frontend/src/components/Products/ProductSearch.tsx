import { useState, useMemo } from "react";
import { Product } from "@/types";

interface Props {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function ProductSearch({ products, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      String(p.price).includes(q) ||
      (p.barcode || "").includes(q)
    );
  }, [products, query]);

  return (
    <div className="mb-4 w-80">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, id, precio o código..."
        className="border p-2 rounded w-full"
      />
      {query && (
        <ul className="mt-2 max-h-40 overflow-auto border rounded bg-white">
          {filteredProducts.slice(0, 6).map((p) => (
            <li
              key={`suggest-${p.id}`}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(p)}
            >
              {p.name} - ${p.price}
            </li>
          ))}
          {filteredProducts.length === 0 && <li className="px-2 py-1 text-gray-500">Sin resultados</li>}
        </ul>
      )}
    </div>
  );
}

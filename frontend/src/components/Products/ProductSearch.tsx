import { useState, useMemo, useRef, useEffect } from "react";
import { Product } from "@/types";

interface Props {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function ProductSearch({ products, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      String(p.price).includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  // Limpia con tecla Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && query) {
        setQuery("");
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="mb-4 w-80">
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, id, precio o código..."
          className="border p-2 pr-8 rounded w-full"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Limpiar"
          >
            {/* Icono X (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

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
          {filteredProducts.length === 0 && (
            <li className="px-2 py-1 text-gray-500">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}
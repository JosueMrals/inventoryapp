import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useState, useMemo } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  // Search
  const [query, setQuery] = useState("");

  // Leer productos (tipado y uso de signal)
  const { data: products = [], isLoading } = useQuery<Product[], import("axios").AxiosError>(
    ["products"],
    async ({ signal }) => {
      const res = await api.get<Product[]>("/api/products", { signal });
      return res.data;
    },
    {
      staleTime: 60_000,
      retry: 2,
    }
  );

  // Filtrado en tiempo real (useMemo para evitar recalculos innecesarios)
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        String(p.price).toLowerCase().includes(q)
      );
    });
  }, [products, query]);

  // Agregar producto (retorna Product)
  const addMutation = useMutation<Product, import("axios").AxiosError, Omit<Product, "id">>(
    async (product) => {
      const res = await api.post<Product>("/api/products", product);
      return res.data;
    },
    {
      onSuccess: (newProduct) => {
        // añadir al cache para mejor UX
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? [...old, newProduct] : [newProduct]
        );
        resetForm();
      },
      onError: () => {
        alert("Error al agregar el producto.");
      },
    }
  );

  // Editar producto (retorna Product)
  const editMutation = useMutation<Product, import("axios").AxiosError, Product>(
    async (product) => {
      const res = await api.put<Product>(`/api/products/${product.id}`, product);
      return res.data;
    },
    {
      onSuccess: (updated) => {
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
        );
        resetForm();
      },
      onError: () => {
        alert("Error al actualizar el producto.");
      },
    }
  );

  // Eliminar producto (optimista)
  const deleteMutation = useMutation<number, import("axios").AxiosError, number>(
    async (id) => {
      await api.delete(`/api/products/${id}`);
      return id;
    },
    {
      onMutate: async (id) => {
        await queryClient.cancelQueries(["products"]);
        const previous = queryClient.getQueryData<Product[]>(["products"]);
        queryClient.setQueryData<Product[] | undefined>(["products"], (old) =>
          old ? old.filter((p) => p.id !== id) : []
        );
        return { previous };
      },
      onError: (err, id, context: any) => {
        if (context?.previous) {
          queryClient.setQueryData(["products"], context.previous);
        }
        alert("Error al eliminar el producto.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["products"]);
      },
    }
  );

  // Manejo de formulario
  const handleSubmit = () => {
    let valid = true;

    if (!name.trim()) {
      setNameError("El nombre no puede estar vacío.");
      valid = false;
    } else {
      setNameError("");
    }

    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("El precio debe ser mayor a 0.");
      valid = false;
    } else {
      setPriceError("");
    }

    if (!valid) return;

    if (editingProduct) {
      editMutation.mutate({ id: editingProduct.id, name: name.trim(), price: parsedPrice });
    } else {
      addMutation.mutate({ name: name.trim(), price: parsedPrice });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setNameError("");
    setPriceError("");
  };

  if (isLoading) return <p>Cargando productos...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Formulario */}
      <div className="flex flex-col gap-2 mb-4 w-80">
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
            disabled={addMutation.isLoading || editMutation.isLoading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {editingProduct ? (editMutation.isLoading ? "Actualizando..." : "Actualizar") : addMutation.isLoading ? "Agregando..." : "Agregar"}
          </button>
          {editingProduct && (
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Buscador en tiempo real */}
      <div className="mb-4 w-80">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, id o precio..."
          className="border p-2 rounded w-full"
          aria-label="Buscar productos"
        />
        {/* Sugerencias rápidas */}
        {query.trim().length > 0 && (
          <ul className="mt-2 max-h-40 overflow-auto border rounded bg-white">
            {filteredProducts.slice(0, 6).map((p) => (
              <li
                key={`suggest-${p.id}`}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  // al clicar una sugerencia, seleccionarla y enfocarse en la fila (aquí se pone en el query para mantener el filtro)
                  setQuery(p.name);
                }}
              >
                {p.name} ${p.price}
              </li>
            ))}
            {filteredProducts.length === 0 && <li className="px-2 py-1 text-sm text-gray-500">Sin resultados</li>}
          </ul>
        )}
      </div>

      {/* Tabla */}
      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2">ID</th>
            <th className="border px-2">Nombre</th>
            <th className="border px-2">Precio</th>
            <th className="border px-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td className="border px-2">{p.id}</td>
              <td className="border px-2">{p.name}</td>
              <td className="border px-2">${p.price}</td>
              <td className="border px-2 flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
                    deleteMutation.mutate(p.id);
                  }}
                  disabled={deleteMutation.isLoading}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No hay productos que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

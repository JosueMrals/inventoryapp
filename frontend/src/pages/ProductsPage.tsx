import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");

  // 📌 Leer productos
  const { data: products = [], isLoading } = useQuery<Product[]>(["products"], async () => {
    const res = await api.get("/products");
    return res.data;
  });

  // 📌 Crear producto
  const addMutation = useMutation(
    (product: Omit<Product, "id">) => api.post("/products", product),
    { onSuccess: () => queryClient.invalidateQueries(["products"]) }
  );

  // 📌 Actualizar producto
  const updateMutation = useMutation(
    (product: Product) => api.put(`/products/${product.id}`, product),
    { onSuccess: () => queryClient.invalidateQueries(["products"]) }
  );

  // 📌 Eliminar producto
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/products/${id}`),
    { onSuccess: () => queryClient.invalidateQueries(["products"]) }
  );

  if (isLoading) return <p>Cargando productos...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>

      {/* Crear producto */}
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Precio"
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            if (!newName.trim() || !newPrice || newPrice <= 0) {
              alert("Nombre y precio válidos son obligatorios.");
              return;
            }
            addMutation.mutate({ name: newName, price: Number(newPrice) });
            setNewName("");
            setNewPrice("");
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Agregar
        </button>
      </div>

      {/* Tabla */}
      <table className="border w-full">
        <thead>
          <tr>
            <th className="border px-3 py-2">ID</th>
            <th className="border px-3 py-2">Nombre</th>
            <th className="border px-3 py-2">Precio</th>
            <th className="border px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="border px-3 py-2">{p.id}</td>
              <td className="border px-3 py-2">{p.name}</td>
              <td className="border px-3 py-2">${p.price.toFixed(2)}</td>
              <td className="border px-3 py-2 flex gap-2">
                <button
                  onClick={() => {
                    const newName = prompt("Nuevo nombre:", p.name);
                    const newPrice = prompt("Nuevo precio:", p.price.toString());
                    if (newName && newPrice && !isNaN(Number(newPrice))) {
                      updateMutation.mutate({ ...p, name: newName, price: Number(newPrice) });
                    }
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(p.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

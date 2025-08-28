import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      return res.data;
    },
  });

  if (isLoading) return <p>Cargando productos...</p>;
  if (error) return <p>Error al cargar productos</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Listado de Productos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((prod) => (
          <Card key={prod.id}>
            <CardContent>
              <h3 className="text-lg font-semibold">{prod.name}</h3>
              <p>Precio: ${prod.price}</p>
              <p>Stock: {prod.stock}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

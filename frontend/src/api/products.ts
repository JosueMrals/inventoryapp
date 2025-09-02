export interface Product {
  id: number;
  name: string;
  price: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${API_URL}/products`);
  console.log("Fetching products from:", `${API_URL}/products`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json();
};

export const createProduct = async (product: Omit<Product, "id">) => {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Error al crear producto");
  return res.json();
};

// Aquí puedes agregar updateProduct, deleteProduct

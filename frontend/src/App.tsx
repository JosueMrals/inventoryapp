import { useProducts } from "./hooks/useProducts";

function App() {
  const { data, isLoading, error } = useProducts();

  if (isLoading) return <p>Cargando productos...</p>;
  if (error) return <p>Error al cargar productos</p>;

  return (
    <div>
      <h1>Productos</h1>
      <ul>
        {data?.map((prod) => (
          <li key={prod.id}>
            {prod.name} - ${prod.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProductsPage from "./ProductsPage";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [page, setPage] = useState("home");

  return (
    <div className="flex h-screen">
      {/* Sidebar recibe la función de navegación */}
      <Sidebar onNavigate={setPage} />

      <main className="flex-1 p-6">
        {page === "home" && (
          <Card>
            <CardContent>
              <h1 className="text-xl font-bold">Bienvenido al Dashboard</h1>
            </CardContent>
          </Card>
        )}

        {page === "products" && <ProductsPage />}
      </main>
    </div>
  );
}

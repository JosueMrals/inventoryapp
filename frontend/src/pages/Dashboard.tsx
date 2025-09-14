import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProductsPage from "../components/Products/ProductsPage";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [page, setPage] = useState("home");
  const [sidebarWidth, setSidebarWidth] = useState(250);

  return (
    <div className="flex h-screen">
      {/* Sidebar recibe la función de navegación */}
      <Sidebar onWidthChange={setSidebarWidth} onNavigate={setPage} />

      <main className="transition-all duration-200 flex-1" style={{ marginLeft: sidebarWidth }}>
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

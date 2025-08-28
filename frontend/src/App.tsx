import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
//import { Home } from "./pages/Home";
import { Inventory } from "./pages/Inventory";
//import { NotFound } from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <aside
            className={`fixed z-40 top-0 left-0 h-full w-64 bg-white shadow-md transition-transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-64"
            }`}
          >
            <div className="p-4 text-xl font-bold text-indigo-600">StartupApp</div>
            <nav className="px-4 space-y-2">
              <Link
                to="/"
                className="block p-2 rounded hover:bg-indigo-50 text-gray-700"
              >
                Dashboard
              </Link>
              <Link
                to="/inventory"
                className="block p-2 rounded hover:bg-indigo-50 text-gray-700"
              >
                Inventario
              </Link>
            </nav>
          </aside>

          {/* Content area */}
          <div className="flex flex-col flex-1">
            <header className="bg-white shadow p-4 flex justify-between items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-3 py-2 bg-indigo-600 text-white rounded"
              >
                {sidebarOpen ? "Cerrar" : "Menu"}
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                Inventario con Escáner
              </h1>
            </header>

            <main className="flex-1 p-6">
              <Routes>
                <Route path="/pages/Inventory" element={<Inventory />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
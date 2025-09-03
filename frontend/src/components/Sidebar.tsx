import { Home, Package } from "lucide-react";

interface SidebarProps {
  onNavigate?: (page: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-700">
        Inventario
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <button
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 w-full text-left"
          onClick={() => onNavigate?.("home")}
        >
          <Home size={18} /> Dashboard
        </button>

        <button
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 w-full text-left"
          onClick={() => onNavigate?.("products")}
        >
          <Package size={18} /> Productos
        </button>
      </nav>
    </aside>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Package, ChevronLeft, ChevronRight } from "lucide-react";

type PageId = string;

interface SidebarItem {
  id: PageId;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  currentPage?: PageId;
  onNavigate?: (page: PageId) => void;
  items?: SidebarItem[];
  collapsible?: boolean;
  title?: string;
  autoCollapseOnScroll?: boolean;
  scrollThreshold?: number;
  // Nuevo: informa el ancho en píxeles para que el layout aplique margin-left
  onWidthChange?: (widthPx: number) => void;
}

const DEFAULT_ITEMS: SidebarItem[] = [
  { id: "home", label: "Dashboard", icon: <Home size={18} /> },
  { id: "products", label: "Productos", icon: <Package size={18} /> },
];

const LS_MANUAL_KEY = "sidebar:manualCollapsed";
// Tailwind: w-16 = 4rem = 64px, w-60 = 15rem = 240px
const WIDTH_COLLAPSED = 64;
const WIDTH_EXPANDED = 240;

export default function Sidebar({
  currentPage = "home",
  onNavigate,
  items = DEFAULT_ITEMS,
  collapsible = true,
  title = "Inventario",
  autoCollapseOnScroll = true,
  scrollThreshold = 80,
  onWidthChange,
}: SidebarProps) {
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(() => {
    try {
      const raw = localStorage.getItem(LS_MANUAL_KEY);
      if (raw === null) return null;
      return JSON.parse(raw) as boolean;
    } catch {
      return null;
    }
  });
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const collapsed = manualCollapsed !== null ? manualCollapsed : autoCollapsed;

  // Notifica el ancho actual al layout para desplazar el main
  useEffect(() => {
    onWidthChange?.(collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED);
  }, [collapsed, onWidthChange]);

  // Refs y foco por teclado
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  // Auto-colapso por scroll (dirección y umbral)
  useEffect(() => {
    if (!autoCollapseOnScroll || manualCollapsed !== null) return;

    let lastY = window.scrollY || 0;
    let ticking = false;

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentY - lastY;

          if (currentY > scrollThreshold && delta > 4) setAutoCollapsed(true);
          if (delta < -4 || currentY <= scrollThreshold) setAutoCollapsed(false);

          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [autoCollapseOnScroll, scrollThreshold, manualCollapsed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const count = items.length;
    const nextIndex = (focusIndex + dir + count) % count;
    setFocusIndex(nextIndex);
    buttonsRef.current[nextIndex]?.focus();
  };

  const widthClass = collapsed ? "w-16" : "w-60";
  const labelClass = collapsed ? "hidden" : "inline";
  const containerTitle = useMemo(() => (collapsed ? title[0] ?? "I" : title), [collapsed, title]);

  const toggleCollapsed = () => {
    setManualCollapsed((prev) => {
      if (prev === null) return !collapsed; // toma estado actual como base
      return !prev;
    });
  };
  const resetToAuto = () => setManualCollapsed(null);

  return (
    <aside
      // FIX: fixed + h-screen garantiza fondo visible SIEMPRE en todo el scroll
      className={`${widthClass} fixed left-0 top-0 h-screen z-40 bg-gray-900 text-white
                  flex flex-col transition-all duration-200`}
      aria-label="Barra lateral de navegación"
    >
      <div className="p-3 font-bold text-lg border-b border-gray-700 flex items-center justify-between">
        <span className="truncate" title={collapsed ? title : undefined}>
          {containerTitle}
        </span>

        {collapsible && (
          <div className="flex items-center gap-1">
            {manualCollapsed !== null && (
              <button
                type="button"
                onClick={resetToAuto}
                className="text-gray-300 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                title="Volver a modo automático"
                aria-label="Volver a modo automático"
              >
                A
              </button>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              title={collapsed ? "Expandir" : "Colapsar"}
              className="text-gray-300 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        )}
      </div>

      <nav
        className="flex-1 p-2 space-y-1 overflow-y-auto"
        role="navigation"
        aria-label="Secciones"
        onKeyDown={handleKeyDown}
      >
        {items.map((item, idx) => {
          const active = item.id === currentPage;
          const baseBtn =
            "flex items-center gap-2 p-2 rounded w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/70";
          const color = active
            ? "bg-gray-800 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white";
          return (
            <button
              key={item.id}
              ref={(el) => { buttonsRef.current[idx] = el; }}
              type="button"
              className={`${baseBtn} ${color}`}
              onClick={() => onNavigate?.(item.id)}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              tabIndex={idx === focusIndex ? 0 : -1}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`${labelClass} truncate`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
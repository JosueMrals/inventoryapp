import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export function Inventory() {
  const [codes, setCodes] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setCodes([...codes, input.trim()]);
    setInput("");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Inventario</h2>
      <form onSubmit={handleScan} className="flex gap-2 mb-4">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escanea o escribe un código..."
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Agregar
        </button>
      </form>
      <ul className="space-y-2">
        {codes.map((code, idx) => (
          <li
            key={idx}
            className="p-2 border rounded bg-white shadow-sm text-gray-800"
          >
            {code}
          </li>
        ))}
      </ul>
    </div>
  );
}
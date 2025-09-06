import { useState, useEffect } from "react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [buffer, setBuffer] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.trim()) {
          onScan(buffer.trim());
        }
        setBuffer("");
      } else {
        setBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buffer, onScan]);

  return (
    <div className="p-2 border rounded bg-gray-50 mb-4">
      <p className="text-sm text-gray-600">Escanea un código de barras...</p>
      <p className="font-mono">{buffer}</p>
    </div>
  );
}

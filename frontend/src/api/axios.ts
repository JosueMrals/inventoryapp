import axios from "axios";

// Base URL de la API en Render
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://inventoryapp-h48b.onrender.com/api",
});

export default api;

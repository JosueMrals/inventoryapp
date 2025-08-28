import axios from "axios";

// Base URL de la API en Render
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5173",
});

export default api;

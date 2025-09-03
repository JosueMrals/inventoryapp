import axios from "axios";

// Base URL de la API en Render
const baseURL = import.meta.env.VITE_API_URL;
console.log("API base URL:", baseURL);

const api = axios.create({
  baseURL,
});

export default api;

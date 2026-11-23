import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const api = axios.create({
  baseURL: `${API_URL}/rest/v1`,
  headers: {
    "Content-Type": "application/json",
    apikey: API_KEY,
  },
});

export default api;
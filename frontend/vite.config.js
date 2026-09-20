import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose to local network (0.0.0.0)
    port: 5173,        // keep default Vite port
    strictPort: true, // fail if port is already in use
  },
});

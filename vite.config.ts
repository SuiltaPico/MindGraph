import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import unocssPlugin from "unocss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [unocssPlugin(), solid()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    host: host || false,
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // hmr: host
    //   ? {
    //       protocol: "ws",
    //       host: host,
    //       port: 1430,
    //     }
    //   : undefined,
    hmr: false
  },
}));

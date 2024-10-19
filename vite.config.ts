import { resolve } from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import UnoCSS from "unocss/vite";
import autoprefixer from "autoprefixer";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [UnoCSS({}), solid(), tsconfigPaths() as any],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  // 防止 vite 掩盖 Rust 错误
  clearScreen: false,
  server: {
    // tauri 开发的固定主机和端口
    host: host || false,
    port: 1420,
    strictPort: true,
    watch: {
      // 忽略监视 `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // 为了防止节点的无限循环渲染问题，需要禁用热更新
    hmr: false,
  },
}));

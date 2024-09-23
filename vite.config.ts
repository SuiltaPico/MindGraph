import csstoolsPostcssSass from "@csstools/postcss-sass";
import { resolve } from "path";
import postcssScss from "postcss-scss";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid(), tsconfigPaths() as any],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
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
    // 为了防止节点的无线循环渲染问题，需要临时禁用热更新
    // hmr: host
    //   ? {
    //       protocol: "ws",
    //       host: host,
    //       port: 1430,
    //     }
    //   : undefined,
    hmr: false,
  },
  css: {
    postcss: {
      plugins: [csstoolsPostcssSass()],
      syntax: postcssScss,
    },
  },
}));

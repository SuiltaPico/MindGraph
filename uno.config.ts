import { defineConfig, presetUno } from "unocss";
import { presetScrollbar } from "unocss-preset-scrollbar";

export default defineConfig({
  content: {
    filesystem: ["./**/*.{tsx}"],
  },
  presets: [
    presetUno({}),
    presetScrollbar({
      noCompatible: false,
    }),
  ],
});

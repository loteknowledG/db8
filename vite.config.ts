import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

const base = process.env.DB8_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [tailwindcss()],
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    cache: true,
  },
});

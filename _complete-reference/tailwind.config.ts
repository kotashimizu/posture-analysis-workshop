import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans JP",
          "Yu Gothic",
          "YuGothic",
          "Hiragino Sans",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
} satisfies Config;

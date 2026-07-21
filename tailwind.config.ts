import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pt: {
          bg: "#eceeeb",
          card: "rgba(255,255,255,0.72)",
          green: "#008033",
          "green-dim": "rgba(0,128,51,0.07)",
          "green-dark": "#005a22",
          border: "rgba(0,0,0,0.06)",
          text: "#1a1a1a",
          muted: "rgba(0,0,0,0.45)",
          dim: "rgba(0,0,0,0.18)",
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Noto Sans TC"', "sans-serif"],
        body: ["'Plus Jakarta Sans'", '"Noto Sans TC"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

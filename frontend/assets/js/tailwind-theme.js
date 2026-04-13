tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "#f6efe3",
        background: "#f2e7d6",
        primary: "#1f3346",
        "primary-container": "#38556d",
        secondary: "#1f6a5b",
        "secondary-container": "#c7ded4",
        tertiary: "#8c5d32",
        "surface-container": "#ead8bf",
        "surface-container-low": "#f1e2cc",
        "surface-container-high": "#dfc9ad",
        "surface-container-highest": "#d4b795",
        "surface-container-lowest": "#fff8ee",
        "surface-variant": "#dbc3a6",
        "on-background": "#182430",
        "on-surface": "#182430",
        "on-surface-variant": "#5b534b",
        outline: "#8c7660",
        "outline-variant": "#d8c5ad",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff"
      },
      fontFamily: {
        headline: ["Newsreader"],
        body: ["Newsreader"],
        label: ["Manrope"]
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      boxShadow: {
        editorial: "0 18px 46px rgba(30, 45, 64, 0.16)"
      }
    }
  }
};

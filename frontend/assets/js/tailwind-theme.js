tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "#f7f9f5",
        background: "#edf3ee",
        primary: "#173f36",
        "primary-container": "#28615a",
        secondary: "#3a55a4",
        "secondary-container": "#dbe5ff",
        tertiary: "#a66321",
        "surface-container": "#e2ebe3",
        "surface-container-low": "#eef4ed",
        "surface-container-high": "#d7e5d9",
        "surface-container-highest": "#c1d2c6",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#d6ddd6",
        "on-background": "#17211f",
        "on-surface": "#17211f",
        "on-surface-variant": "#4f5a56",
        outline: "#69766f",
        "outline-variant": "#c5d0c8",
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

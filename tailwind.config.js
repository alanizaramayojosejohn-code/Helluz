/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Importante: deshabilitar preflight si usas Angular Material
  corePlugins: {
    preflight: false,
  }
}
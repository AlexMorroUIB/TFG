import {defineConfig} from "vite";

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [".ltim.uib.es"],
    port: 80, // Specify the Vite dev server port
    /*proxy: {
      '/api': 'http://localhost:3000', // Proxy API requests to the Node.js server
    },*/
  },
});

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		strictPort: true,
		proxy: {
			"/socket.io": {
				target: "http://localhost:8082",
				changeOrigin: true,
				ws: true,
			},
		},
	},
	build: {
		target: "es2018",
		outDir: "build",
		emptyOutDir: true,
	},
})

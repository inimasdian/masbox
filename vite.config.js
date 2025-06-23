// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.js'),
			name: 'Masbox',
			fileName: (format) => `masbox.${format}.js`,
			formats: ['umd'],
		},
		outDir: 'dist',
		minify: false, // kita minify manual
		rollupOptions: {
			external: [], // kalau pakai dependensi eksternal, masukkan di sini
			output: {
				exports: 'named',
			},
		},
	},
});

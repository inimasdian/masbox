// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.js'),
			name: 'Masbox',
			formats: ['es'],
			fileName: () => 'masbox.js',
		},
		outDir: 'dist',
		minify: false,
		rollupOptions: {
			external: [],
			output: {
				exports: 'named',
			},
		},
	},
});

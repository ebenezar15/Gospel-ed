import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds one self-contained index.html (all JS, CSS and content inlined) so it can be published as an Artifact.
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: { target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 20_000 },
});

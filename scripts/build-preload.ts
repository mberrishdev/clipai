import { build } from 'bun';

const result = await build({
  entrypoints: ['./src/main/preload.ts'],
  outdir: './dist/main',
  target: 'node',
  format: 'cjs',
  external: ['electron'],
  minify: false,
});

if (!result.success) {
  console.error('Build failed');
  process.exit(1);
}

console.log('Preload script built successfully to dist/main');

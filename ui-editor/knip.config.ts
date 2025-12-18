import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	entry: [
		'src/router.tsx',
		'src/routes/**/*.tsx',
		'src/routes/**/*.ts',
		'vite.config.ts',
	],
	project: ['src/**/*.{ts,tsx}'],
	ignore: [
		'src/routeTree.gen.ts', // Generated file
		'**/*.test.{ts,tsx}',
		'**/*.spec.{ts,tsx}',
	],
	ignoreDependencies: [
		// TanStack Start dependencies that might be flagged but are needed
	],
	ignoreExportsUsedInFile: true,
}

export default config


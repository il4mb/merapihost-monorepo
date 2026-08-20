import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        tsconfigPaths() // This hooks into your tsconfig.json paths automatically!
    ],
    test: {
        // Your other test configs...
    }
})

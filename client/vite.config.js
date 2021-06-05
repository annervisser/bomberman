import viteImagemin from 'vite-plugin-imagemin';
import tscc from '@tscc/rollup-plugin-tscc';

/** @type {import('vite-plugin-imagemin').VitePluginImageMin} */
let imageMinConfig = {
    verbose: true
};

/**
 * @type {import('vite').UserConfig}
 */
const config = {
    build: {
        outDir: "dist/",
        terserOptions: {
            mangle: {
                properties: false
            },
            compress: true,
        },
        sourcemap: true,
        chunkSizeWarningLimit: 12,
        assetsInlineLimit: 0
    },
    plugins: [
        tscc({
            specFile: "./tscc.spec.json"
        }),
        viteImagemin(imageMinConfig)
    ]
}

export default config

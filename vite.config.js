import viteImagemin from 'vite-plugin-imagemin';

/** @type {import('vite-plugin-imagemin').VitePluginImageMin} */
let imageMinConfig = {
    verbose: true
};

/**
 * @type {import('vite').UserConfig}
 */
const config = {
    build: {
        terserOptions: {
            mangle: {
                properties: true
            },
            compress: true,
        },
        sourcemap: true,
        chunkSizeWarningLimit: 6,
    },
    plugins: [
        viteImagemin(imageMinConfig)
    ]
}

export default config

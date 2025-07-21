/**
 * Asset Loader
 * Handles loading and caching of various asset types
 */
export class AssetLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        
        // Loaders for different asset types
        this.textureLoader = null; // Will be THREE.TextureLoader
        this.gltfLoader = null;    // Will be THREE.GLTFLoader
        this.audioLoader = null;   // For audio assets
        
        this.basePath = './assets/';
    }

    // Initialize loaders (call this after THREE.js is available)
    initializeLoaders() {
        if (typeof THREE !== 'undefined') {
            this.textureLoader = new THREE.TextureLoader();
            this.gltfLoader = new THREE.GLTFLoader();
        }
    }

    setBasePath(path) {
        this.basePath = path.endsWith('/') ? path : path + '/';
    }

    // Generic asset loading
    async loadAsset(path, type = 'auto') {
        const fullPath = this.basePath + path;
        
        // Check cache first
        if (this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }

        // Check if already loading
        if (this.loadingPromises.has(fullPath)) {
            return this.loadingPromises.get(fullPath);
        }

        // Determine type from extension if auto
        if (type === 'auto') {
            type = this.getTypeFromPath(path);
        }

        // Start loading
        const promise = this.loadAssetByType(fullPath, type);
        this.loadingPromises.set(fullPath, promise);

        try {
            const asset = await promise;
            this.cache.set(fullPath, asset);
            this.loadingPromises.delete(fullPath);
            return asset;
        } catch (error) {
            this.loadingPromises.delete(fullPath);
            throw error;
        }
    }

    getTypeFromPath(path) {
        const extension = path.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
                return 'texture';
            case 'gltf':
            case 'glb':
                return 'model';
            case 'mp3':
            case 'wav':
            case 'ogg':
                return 'audio';
            case 'json':
                return 'json';
            default:
                return 'text';
        }
    }

    async loadAssetByType(path, type) {
        switch (type) {
            case 'texture':
                return this.loadTexture(path);
            case 'model':
                return this.loadModel(path);
            case 'audio':
                return this.loadAudio(path);
            case 'json':
                return this.loadJSON(path);
            case 'text':
                return this.loadText(path);
            default:
                throw new Error(`Unknown asset type: ${type}`);
        }
    }

    // Specific asset type loaders
    loadTexture(path) {
        return new Promise((resolve, reject) => {
            if (!this.textureLoader) {
                reject(new Error('Texture loader not initialized'));
                return;
            }

            this.textureLoader.load(
                path,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }

    loadModel(path) {
        return new Promise((resolve, reject) => {
            if (!this.gltfLoader) {
                reject(new Error('GLTF loader not initialized'));
                return;
            }

            this.gltfLoader.load(
                path,
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
            );
        });
    }

    async loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            
            audio.addEventListener('canplaythrough', () => {
                resolve(audio);
            });
            
            audio.addEventListener('error', () => {
                reject(new Error(`Failed to load audio: ${path}`));
            });
            
            audio.load();
        });
    }

    async loadJSON(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${path}`);
        }
        return response.json();
    }

    async loadText(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load text: ${path}`);
        }
        return response.text();
    }

    // Utility methods
    isLoaded(path) {
        const fullPath = this.basePath + path;
        return this.cache.has(fullPath);
    }

    getAsset(path) {
        const fullPath = this.basePath + path;
        return this.cache.get(fullPath);
    }

    unloadAsset(path) {
        const fullPath = this.basePath + path;
        const asset = this.cache.get(fullPath);
        
        // Dispose of Three.js assets
        if (asset && asset.dispose) {
            asset.dispose();
        }
        
        this.cache.delete(fullPath);
    }

    clearCache() {
        // Dispose of all cached assets
        for (const [path, asset] of this.cache) {
            if (asset && asset.dispose) {
                asset.dispose();
            }
        }
        
        this.cache.clear();
        this.loadingPromises.clear();
    }

    // Preload multiple assets
    async preloadAssets(assetList) {
        const promises = assetList.map(asset => {
            if (typeof asset === 'string') {
                return this.loadAsset(asset);
            } else {
                return this.loadAsset(asset.path, asset.type);
            }
        });

        return Promise.all(promises);
    }

    // Get cache stats
    getCacheStats() {
        return {
            cachedAssets: this.cache.size,
            loadingAssets: this.loadingPromises.size,
            cacheSize: this.calculateCacheSize()
        };
    }

    calculateCacheSize() {
        // This is a rough estimate
        return this.cache.size * 100; // Placeholder calculation
    }
}

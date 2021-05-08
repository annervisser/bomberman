import {Sprite} from './image';

export enum Sprites {
    Heart,
    SolidBlue,
}

export const spriteLocations: {
    [key in Sprites]: {
        file: string;
        x: number;
        width: number;
        y: number;
        height: number;
    }
} = {
    [Sprites.Heart]: {
        file: '/sprites/8x8.png',
        x: 40,
        y: 40,
        width: 8,
        height: 8
    },
    [Sprites.SolidBlue]: {
        file: '/sprites/8x8.png',
        x: 5,
        y: 65,
        width: 8,
        height: 8
    },
};

export class SpriteStore {
    private loadingSprites = new Map<Sprites, Promise<Sprite>>();

    private sprites = new Map<Sprites, Sprite>();

    loadSprite(spriteName: Sprites): void {
        if (this.loadingSprites.has(spriteName) || this.sprites.has(spriteName)) {
            throw Error('This sprite is already loading or loaded');
        }

        const spriteData = spriteLocations[spriteName];

        const spritePromise = this.createImage(spriteData.file)
            .then((image) => {
                const sprite = new Sprite(image, spriteData.x, spriteData.y, spriteData.width, spriteData.height);
                this.sprites.set(spriteName, sprite);
                this.loadingSprites.delete(spriteName);
                return sprite;
            });

        this.loadingSprites.set(spriteName, spritePromise);
    }

    getSprite(spriteName: Sprites): Sprite {
        const sprite = this.sprites.get(spriteName);
        if (!sprite) {
            throw Error('Sprite not loaded');
        }
        return sprite;
    }

    async loadAllSprites(): Promise<Sprite[]> {
        return Promise.all(this.loadingSprites.values());
    }

    private createImage(file: string): Promise<HTMLImageElement> {
        const image = new Image();

        const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', reject);
        });

        image.src = file;
        return loadPromise;
    }
}

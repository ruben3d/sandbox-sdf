
export interface SDFSettings {
    width: number;
    height: number;
    spread: number;
}

export class SDFGenerator {

    constructor(private settings: SDFSettings) {
        // Empty
    }

    generate(sampler: DistanceSampler, settings?: SDFSettings) {
        const cfg = settings || this.settings;
        return this.generateSignedDistanceField(sampler, cfg);
    }

    private generateSignedDistanceField(sampler: DistanceSampler, cfg: SDFSettings): ImageData {
        const target = new ImageData(cfg.width, cfg.height);

        for (let y = 0; y < target.height; y++) {
            for (let x = 0; x < target.width; x++) {
                const distance = sampler.sample(x, y, target.width, target.height, cfg.spread);
                const value = (distance * 255) | 0;
                const base = (y * target.width + x) * 4;
                target.data[base] = value;
                target.data[base + 1] = value;
                target.data[base + 2] = value;
                target.data[base + 3] = 255;
            }
        }

        return target;
    }
}

interface DistanceSampler {
    sample(targetX: number, targetY: number, targetWidth: number, targetHeight: number, targetSpread: number): number;
}

abstract class ShapeDistanceSampler implements DistanceSampler {
    sample(targetX: number, targetY: number, targetWidth: number, targetHeight: number, targetSpread: number): number {
        const frameSize = Math.min(targetWidth, targetHeight);
        const scaledSpread = 2.0 * targetSpread / frameSize;
        const x = 2.0 * (targetWidth / frameSize) * (targetX - targetWidth * 0.5) / targetWidth;
        const y = 2.0 * (targetHeight / frameSize) * (targetY - targetHeight * 0.5) / targetHeight;
        const d = -this.distance(x, -y);
        return Math.max(0.0, Math.min((d / scaledSpread + 1.0) * 0.5, 1.0));
    }

    protected abstract distance(x: number, y: number): number;
}

export interface CircleSamplerSettings {
    radius: number; // [0,1]
}

export class CircleDistanceSampler extends ShapeDistanceSampler {

    constructor(private settings: CircleSamplerSettings) { super(); }

    // sdCircle
    protected distance(x: number, y: number): number {
        return Math.sqrt(x * x + y * y) - this.settings.radius;
    }
}

export interface BoxSamplerSettings {
    halfWidth: number;
    halfHeight: number;
    topLeftRadius: number;
    topRightRadius: number;
    bottomLeftRadius: number;
    bottomRightRadius: number;
}

export class BoxDistanceSampler extends ShapeDistanceSampler {

    constructor(private settings: BoxSamplerSettings) { super(); }

    // sdRoundedBox
    protected distance(x: number, y: number): number {
        let bx = this.settings.halfWidth;
        let by = this.settings.halfHeight;
        let rx = Math.min(this.settings.topRightRadius, this.settings.halfWidth, this.settings.halfHeight);
        let ry = Math.min(this.settings.bottomRightRadius, this.settings.halfWidth, this.settings.halfHeight);
        let rz = Math.min(this.settings.topLeftRadius, this.settings.halfWidth, this.settings.halfHeight);
        let rw = Math.min(this.settings.bottomLeftRadius, this.settings.halfWidth, this.settings.halfHeight);

        rx = x > 0.0 ? rx : rz;
        ry = x > 0.0 ? ry : rw;
        rx = y > 0.0 ? rx : ry;
        let qx = Math.abs(x) - bx + rx;
        let qy = Math.abs(y) - by + rx;

        const t0 = Math.min(Math.max(qx, qy), 0.0);
        qx = Math.max(qx, 0.0);
        qy = Math.max(qy, 0.0);
        const t1 = Math.sqrt(qx * qx + qy * qy);
        return t0 + t1 - rx;
    }
}

export enum ImageSamplerDistanceMethod {
    LINEAR,
    MANHATTAN,
}

export interface ImageSamplerSettings {
    distanceMethod: ImageSamplerDistanceMethod;
}

export class ImageDistanceSampler implements DistanceSampler {

    private linear: boolean;

    constructor(private image: ImageData, settings: ImageSamplerSettings) {
        this.linear = settings.distanceMethod === ImageSamplerDistanceMethod.LINEAR
    }

    setImage(image: ImageData) {
        this.image = image;
    }

    setDistanceMethod(method: ImageSamplerDistanceMethod) {
        this.linear = method === ImageSamplerDistanceMethod.LINEAR
    }

    sample(targetX: number, targetY: number, targetWidth: number, _: number, targetSpread: number): number {
        const sourceScale = this.image.width / targetWidth;
        const scaledSpread = targetSpread * sourceScale;
        const srcX = targetX * sourceScale;
        const srcY = targetY * sourceScale;
        const minX = Math.max(0, srcX - scaledSpread);
        const minY = Math.max(0, srcY - scaledSpread);
        const maxX = Math.min(this.image.width - 1, srcX + scaledSpread);
        const maxY = Math.min(this.image.height - 1, srcY + scaledSpread);

        const distanceFn = this.linear ? this.pointLinearDistanceSq : this.pointManhattanDistance;
        const inside = this.isInside(this.image.data[4 * (srcX + srcY * this.image.width)]);
        let minDistance = Number.POSITIVE_INFINITY;

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                //if (pointDistanceSq(px, py, x, y) > spread * spread) continue;
                const currentInside = this.isInside(this.image.data[4 * (x + y * this.image.width)]);
                if (inside === currentInside) continue;

                const distance = distanceFn(srcX, srcY, x, y);
                minDistance = Math.min(minDistance, distance);
            }
        }

        if (this.linear) {
            minDistance = Math.sqrt(minDistance);
        }

        minDistance = Math.max(0.0, Math.min(minDistance, scaledSpread)) / scaledSpread * 0.5;

        if (inside) {
            return 0.5 + minDistance;
        } else {
            return 0.5 - minDistance;
        }
    }

    private isInside(value: number): boolean {
        return value > 127;
    }

    private pointLinearDistanceSq(x0: number, y0: number, x1: number, y1: number): number {
        const dx = x1 - x0;
        const dy = y1 - y0;
        return dx * dx + dy * dy;
    }

    private pointManhattanDistance(x0: number, y0: number, x1: number, y1: number): number {
        const dx = x1 - x0;
        const dy = y1 - y0;
        return Math.abs(dx) + Math.abs(dy);
    }
}

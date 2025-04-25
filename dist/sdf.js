export class SDFGenerator {
    constructor(settings) {
        this.settings = settings;
    }
    generate(sampler, settings) {
        const cfg = settings || this.settings;
        return this.generateSignedDistanceField(sampler, cfg);
    }
    generateSignedDistanceField(sampler, cfg) {
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
class ShapeDistanceSampler {
    constructor(settings) {
        this.settings = settings;
    }
    sample(targetX, targetY, targetWidth, targetHeight, targetSpread) {
        const frameSize = Math.min(targetWidth, targetHeight);
        const scaledSpread = 2.0 * targetSpread / frameSize;
        const x = 2.0 * (targetWidth / frameSize) * (targetX - targetWidth * 0.5) / targetWidth;
        const y = 2.0 * (targetHeight / frameSize) * (targetY - targetHeight * 0.5) / targetHeight;
        const d = this.settings.thickness > 0.0 ? -Math.abs(this.distance(x, -y)) + this.settings.thickness : -this.distance(x, -y);
        return Math.max(0.0, Math.min((d / scaledSpread + 1.0) * 0.5, 1.0));
    }
}
export class CircleDistanceSampler extends ShapeDistanceSampler {
    constructor(settings) {
        super(settings);
        this.settings = settings;
    }
    distance(x, y) {
        return Math.sqrt(x * x + y * y) - this.settings.radius;
    }
}
export class BoxDistanceSampler extends ShapeDistanceSampler {
    constructor(settings) {
        super(settings);
        this.settings = settings;
    }
    distance(x, y) {
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
export var ImageSamplerDistanceMethod;
(function (ImageSamplerDistanceMethod) {
    ImageSamplerDistanceMethod[ImageSamplerDistanceMethod["LINEAR"] = 0] = "LINEAR";
    ImageSamplerDistanceMethod[ImageSamplerDistanceMethod["MANHATTAN"] = 1] = "MANHATTAN";
})(ImageSamplerDistanceMethod || (ImageSamplerDistanceMethod = {}));
export class ImageDistanceSampler {
    constructor(image, settings) {
        this.image = image;
        this.linear = settings.distanceMethod === ImageSamplerDistanceMethod.LINEAR;
    }
    setImage(image) {
        this.image = image;
    }
    setDistanceMethod(method) {
        this.linear = method === ImageSamplerDistanceMethod.LINEAR;
    }
    sample(targetX, targetY, targetWidth, _, targetSpread) {
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
                const currentInside = this.isInside(this.image.data[4 * (x + y * this.image.width)]);
                if (inside === currentInside)
                    continue;
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
        }
        else {
            return 0.5 - minDistance;
        }
    }
    isInside(value) {
        return value > 127;
    }
    pointLinearDistanceSq(x0, y0, x1, y1) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        return dx * dx + dy * dy;
    }
    pointManhattanDistance(x0, y0, x1, y1) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        return Math.abs(dx) + Math.abs(dy);
    }
}
//# sourceMappingURL=sdf.js.map
/**
 * World-space pixel coordinate for an entity.
 */
export class Position {
    /**
     * @param {number} x Horizontal pixel position.
     * @param {number} y Vertical pixel position.
     */
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

/**
 * Per-frame movement vector in pixels.
 */
export class Velocity {
    /**
     * @param {number} x Horizontal speed applied each movement tick.
     * @param {number} y Vertical speed applied each movement tick.
     */
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

/**
 * Static image used by render systems, primarily for maze boundaries.
 */
export class Sprite {
    /**
     * @param {HTMLImageElement} image Loaded image element.
     * @param {number} width Render width in pixels.
     * @param {number} height Render height in pixels.
     */
    constructor(image, width, height) {
        this.image = image
        this.width = width
        this.height = height
    }
}

/**
 * Circular hit area for moving actors and collectables.
 */
export class CircleCollider {
    /**
     * @param {number} radius Radius in pixels.
     */
    constructor(radius) {
        this.radius = radius
    }
}

/**
 * Rectangular hit area for maze tiles.
 */
export class BoxCollider {
    /**
     * @param {number} width Width in pixels.
     * @param {number} height Height in pixels.
     */
    constructor(width, height) {
        this.width = width
        this.height = height
    }
}

/**
 * Marker and animation state for the player-controlled Pacman entity.
 */
export class PlayerControlled {
    constructor() {
        this.rotation = 0
        this.radians = 0.75
        this.openRate = 0.12
    }
}

/**
 * Movement state for a ghost.
 */
export class GhostAI {
    /**
     * @param {string} color Fill color used while the ghost is not scared.
     * @param {number} speed Movement speed in pixels per frame.
     * @param {{column: number, row: number}|null} cageExit Tile the ghost should path toward before joining the maze.
     * @param {number} cageReleaseDelay Milliseconds to wait before leaving the cage.
     */
    constructor(color = "red", speed = 4, cageExit = null, cageReleaseDelay = 0) {
        this.color = color
        this.speed = speed
        this.cageExit = cageExit
        this.cageReleaseDelay = cageReleaseDelay
        this.prevCollisions = []
    }
}

/**
 * Collectable score pellet.
 */
export class Pellet {
    /**
     * @param {number} value Score awarded when collected.
     */
    constructor(value = 10) {
        this.value = value
    }
}

/**
 * Collectable that makes ghosts temporarily vulnerable.
 */
export class PowerUp {
    /**
     * @param {number} duration Vulnerable duration in milliseconds.
     */
    constructor(duration = 5000) {
        this.duration = duration
    }
}

/**
 * Marker for solid maze geometry.
 */
export class Boundary {
    /**
     * @param {string} kind Level-map symbol that created this boundary.
     */
    constructor(kind) {
        this.kind = kind
    }
}

/**
 * Temporary ghost state applied while a power-up is active.
 */
export class Scared {
    /**
     * @param {number} remaining Milliseconds before the scared state expires.
     */
    constructor(remaining = 5000) {
        this.remaining = remaining
    }
}

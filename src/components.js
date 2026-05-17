export class Position {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

export class Velocity {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

export class Sprite {
    constructor(image, width, height) {
        this.image = image
        this.width = width
        this.height = height
    }
}

export class CircleCollider {
    constructor(radius) {
        this.radius = radius
    }
}

export class BoxCollider {
    constructor(width, height) {
        this.width = width
        this.height = height
    }
}

export class PlayerControlled {
    constructor() {
        this.rotation = 0
        this.radians = 0.75
        this.openRate = 0.12
    }
}

export class GhostAI {
    constructor(color = "red", speed = 4, cageExit = null, cageReleaseDelay = 0) {
        this.color = color
        this.speed = speed
        this.cageExit = cageExit
        this.cageReleaseDelay = cageReleaseDelay
        this.prevCollisions = []
    }
}

export class Pellet {
    constructor(value = 10) {
        this.value = value
    }
}

export class PowerUp {
    constructor(duration = 5000) {
        this.duration = duration
    }
}

export class Boundary {
    constructor(kind) {
        this.kind = kind
    }
}

export class Scared {
    constructor(remaining = 5000) {
        this.remaining = remaining
    }
}

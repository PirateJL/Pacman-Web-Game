export class CanvasResource {
    constructor(canvas, context) {
        this.canvas = canvas
        this.context = context
    }
}

export class InputResource {
    constructor() {
        this.keys = {
            up: { pressed: false },
            left: { pressed: false },
            down: { pressed: false },
            right: { pressed: false }
        }
        this.lastKey = ""
        this.currentKeyboardType = null
    }
}

export class GameState {
    constructor(scoreElement) {
        this.score = 0
        this.scoreElement = scoreElement
        this.animationId = null
        this.paused = true
        this.ready = false
        this.ended = false
        this.lastTimestamp = 0
    }
}

export class AssetCache {
    constructor() {
        this.images = new Map()
    }

    image(src) {
        if (!this.images.has(src)) {
            const image = new Image()
            image.src = src
            this.images.set(src, image)
        }

        return this.images.get(src)
    }
}

export class AudioResource {
    constructor(basePath = "./sounds/") {
        this.basePath = basePath
        this.files = {
            intro: "Intro.wav",
            waka: "waka.mp3",
            extraPacman: "pacman_extrapac.mp3",
            eatFruit: "pacman_eatfruit.mp3",
            powerDot: "power_dot.mp3",
            winGame: "gameWin.mp3",
            endGame: "gameOver.mp3",
            eatGhost: "eat_ghost.mp3"
        }
    }

    play(name, params = null) {
        const file = this.files[name]
        if (!file) return null

        const audio = new Audio(this.basePath + file)
        if (params && params.onEnded) audio.onended = params.onEnded
        const playResult = audio.play()
        if (playResult && playResult.catch) playResult.catch(() => {})

        return audio
    }
}

export class PlaySoundEvent {
    constructor(name, params = null) {
        this.name = name
        this.params = params
    }
}

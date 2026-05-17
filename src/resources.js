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
    constructor(hudElements = {}) {
        this.score = 0
        this.highScore = this.loadHighScore()
        this.levelIndex = 0
        this.level = 1
        this.lives = 3
        this.powerUpsLeft = 0
        this.activePowerUps = 0
        this.hudElements = hudElements
        this.scoreElement = hudElements.score
        this.animationId = null
        this.paused = true
        this.ready = false
        this.ended = false
        this.gameOverVisible = false
        this.levelCompleteVisible = false
        this.finalWinVisible = false
        this.lastTimestamp = 0
        this.levelStartState = null
        this.onGameOver = null
        this.onLevelComplete = null
        this.onGameWon = null
        this.updateHud()
    }

    addScore(value) {
        this.score += value
        if (this.score > this.highScore) {
            this.highScore = this.score
            this.saveHighScore()
        }
        this.updateHud()
    }

    setLives(lives) {
        this.lives = Math.max(0, lives)
        this.updateHud()
    }

    setLevelIndex(levelIndex) {
        this.levelIndex = levelIndex
        this.level = levelIndex + 1
        this.updateHud()
    }

    captureLevelStartState() {
        this.levelStartState = {
            levelIndex: this.levelIndex,
            level: this.level,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives
        }
    }

    restoreLevelStartState() {
        if (!this.levelStartState) this.captureLevelStartState()

        this.levelIndex = this.levelStartState.levelIndex
        this.level = this.levelStartState.level
        this.score = this.levelStartState.score
        this.highScore = this.levelStartState.highScore
        this.lives = this.levelStartState.lives
        this.saveHighScore()
        this.updateHud()
    }

    resetRun() {
        this.score = 0
        this.levelIndex = 0
        this.level = 1
        this.lives = 3
        this.updateHud()
    }

    setPowerUps(powerUpsLeft, activePowerUps) {
        this.powerUpsLeft = powerUpsLeft
        this.activePowerUps = activePowerUps
        this.updateHud()
    }

    updateHud() {
        this.setText("score", this.score)
        this.setText("highScore", this.highScore)
        this.setText("level", this.level)
        this.setText("lives", this.lives)
        this.setText("powerUps", `${this.activePowerUps} active / ${this.powerUpsLeft} left`)
    }

    setText(key, value) {
        if (this.hudElements[key]) this.hudElements[key].textContent = value
    }

    loadHighScore() {
        try {
            return Number(window.localStorage.getItem("PacmanWebGameHighScore")) || 0
        } catch (exception) {
            return 0
        }
    }

    saveHighScore() {
        try {
            window.localStorage.setItem("PacmanWebGameHighScore", String(this.highScore))
        } catch (exception) {}
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
        this.muted = false
        this.activeAudio = new Set()
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

    setMuted(muted) {
        this.muted = muted
        for (const audio of this.activeAudio) {
            audio.muted = muted
        }
    }

    toggleMuted() {
        this.setMuted(!this.muted)
        return this.muted
    }

    play(name, params = null) {
        const file = this.files[name]
        if (!file) return null

        const audio = new Audio(this.basePath + file)
        audio.muted = this.muted
        this.activeAudio.add(audio)
        audio.onended = () => {
            this.activeAudio.delete(audio)
            params?.onEnded?.()
        }
        const playResult = audio.play()
        if (playResult && playResult.catch) {
            playResult.catch(() => {
                this.activeAudio.delete(audio)
            })
        }

        return audio
    }
}

export class PlaySoundEvent {
    constructor(name, params = null) {
        this.name = name
        this.params = params
    }
}

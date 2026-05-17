/**
 * Shared canvas handles used by rendering systems.
 */
export class CanvasResource {
    /**
     * @param {HTMLCanvasElement} canvas Game canvas element.
     * @param {CanvasRenderingContext2D} context 2D rendering context for the game canvas.
     */
    constructor(canvas, context) {
        this.canvas = canvas
        this.context = context
    }
}

/**
 * Current keyboard state, separated from DOM events so systems can read it each frame.
 */
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

/**
 * Mutable run state and HUD bridge for score, level progress, pause state, and game-end callbacks.
 */
export class GameState {
    /**
     * @param {{score?: HTMLElement, highScore?: HTMLElement, level?: HTMLElement, lives?: HTMLElement, powerUps?: HTMLElement}} hudElements
     * Elements that mirror the current game state.
     */
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

    /**
     * Adds score, persists a new high score, and refreshes the HUD.
     *
     * @param {number} value Points to add.
     */
    addScore(value) {
        this.score += value
        if (this.score > this.highScore) {
            this.highScore = this.score
            this.saveHighScore()
        }
        this.updateHud()
    }

    /**
     * Updates the current life count.
     *
     * @param {number} lives New life count. Negative values are clamped to zero.
     */
    setLives(lives) {
        this.lives = Math.max(0, lives)
        this.updateHud()
    }

    /**
     * Sets the zero-based level index and the one-based display level.
     *
     * @param {number} levelIndex Level index in the LEVELS array.
     */
    setLevelIndex(levelIndex) {
        this.levelIndex = levelIndex
        this.level = levelIndex + 1
        this.updateHud()
    }

    /**
     * Stores the state that retrying the current level should restore.
     */
    captureLevelStartState() {
        this.levelStartState = {
            levelIndex: this.levelIndex,
            level: this.level,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives
        }
    }

    /**
     * Restores score, lives, and level metadata to the last captured level start.
     */
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

    /**
     * Starts a fresh run from level one with default lives.
     */
    resetRun() {
        this.score = 0
        this.levelIndex = 0
        this.level = 1
        this.lives = 3
        this.updateHud()
    }

    /**
     * Updates the HUD summary of remaining power-ups and active scared ghosts.
     *
     * @param {number} powerUpsLeft Number of uncollected power-ups left in the level.
     * @param {number} activePowerUps Number of ghosts currently affected by a power-up.
     */
    setPowerUps(powerUpsLeft, activePowerUps) {
        this.powerUpsLeft = powerUpsLeft
        this.activePowerUps = activePowerUps
        this.updateHud()
    }

    /**
     * Renders all tracked state values into the HUD.
     */
    updateHud() {
        this.setText("score", this.score)
        this.setText("highScore", this.highScore)
        this.setText("level", this.level)
        this.setText("lives", this.lives)
        this.setText("powerUps", `${this.activePowerUps} active / ${this.powerUpsLeft} left`)
    }

    /**
     * Writes a value to one HUD element if it exists.
     *
     * @param {string} key Key from the hudElements object.
     * @param {string|number} value Display value.
     */
    setText(key, value) {
        if (this.hudElements[key]) this.hudElements[key].textContent = value
    }

    /**
     * @returns {number} Best score stored in localStorage, or zero when storage is unavailable.
     */
    loadHighScore() {
        try {
            return Number(window.localStorage.getItem("PacmanWebGameHighScore")) || 0
        } catch (exception) {
            return 0
        }
    }

    /**
     * Persists the current high score when localStorage is available.
     */
    saveHighScore() {
        try {
            window.localStorage.setItem("PacmanWebGameHighScore", String(this.highScore))
        } catch (exception) {}
    }
}

/**
 * Lazy image cache keyed by source URL.
 */
export class AssetCache {
    constructor() {
        this.images = new Map()
    }

    /**
     * Returns one shared image element for a URL, creating it on first use.
     *
     * @param {string} src Image URL.
     * @returns {HTMLImageElement}
     */
    image(src) {
        if (!this.images.has(src)) {
            const image = new Image()
            image.src = src
            this.images.set(src, image)
        }

        return this.images.get(src)
    }
}

/**
 * Sound-effect player that tracks active audio so mute state applies immediately.
 */
export class AudioResource {
    /**
     * @param {string} basePath Public sound asset path.
     */
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

    /**
     * Applies mute state to future and already playing sounds.
     *
     * @param {boolean} muted Whether audio should be muted.
     */
    setMuted(muted) {
        this.muted = muted
        for (const audio of this.activeAudio) {
            audio.muted = muted
        }
    }

    /**
     * Toggles mute state.
     *
     * @returns {boolean} The new muted value.
     */
    toggleMuted() {
        this.setMuted(!this.muted)
        return this.muted
    }

    /**
     * Plays a named sound effect from the configured file map.
     *
     * @param {string} name Key from this.files.
     * @param {{onEnded?: Function}|null} params Optional completion callback.
     * @returns {HTMLAudioElement|null} Created audio element, or null for unknown sounds.
     */
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

/**
 * ECS event requesting a sound effect after gameplay systems mutate the world.
 */
export class PlaySoundEvent {
    /**
     * @param {string} name Sound name handled by AudioResource.
     * @param {{onEnded?: Function}|null} params Optional audio playback parameters.
     */
    constructor(name, params = null) {
        this.name = name
        this.params = params
    }
}

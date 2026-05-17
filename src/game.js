import { Schedule, World } from "archetype-ecs-lib"
import { DevTools, LevelSelectorTool } from "./devtools.js"
import { Utils } from "./utils.js"
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, loadLevel } from "./level.js"
import {
    AssetCache,
    AudioResource,
    CanvasResource,
    GameState,
    InputResource
} from "./resources.js"
import { registerSystems, SYSTEM_PHASES } from "./systems.js"

/**
 * Thin audio facade that keeps legacy Game.Audio.* calls mapped to AudioResource.
 */
class GameAudio {
    /**
     * @param {GameController} game Owning game controller.
     */
    constructor(game) {
        this.game = game
    }

    playIntro(params = null) { return this.game.audio?.play("intro", params) }
    playWaka(params = null) { return this.game.audio?.play("waka", params) }
    playExtraPacman(params = null) { return this.game.audio?.play("extraPacman", params) }
    playEatFruit(params = null) { return this.game.audio?.play("eatFruit", params) }
    playPowerDot(params = null) { return this.game.audio?.play("powerDot", params) }
    playWinGame(params = null) { return this.game.audio?.play("winGame", params) }
    playEndGame(params = null) { return this.game.audio?.play("endGame", params) }
    playEatGhost(params = null) { return this.game.audio?.play("eatGhost", params) }
}

/**
 * Safe localStorage wrapper. Browsers can throw when storage is disabled.
 */
class Storage {
    /**
     * @param {string} key Storage key.
     * @returns {string|null|boolean} Stored value, null, or false when storage is unavailable.
     */
    static localStorageGet(key) {
        let local = false
        try { local = window.localStorage.getItem(key) } catch (exception) {}
        return local
    }

    /**
     * @param {string} key Storage key.
     * @param {string} value Value to persist.
     * @returns {undefined|boolean} setItem result, or false when storage is unavailable.
     */
    static localStorageSet(key, value) {
        let local = false
        try { local = window.localStorage.setItem(key, value) } catch (exception) {}
        return local
    }
}

/**
 * Keyboard-layout mapping used by inputSystem.
 */
class KeyControl {
    static mouve = {
        azerty: {
            up: ["ArrowUp", "z"],
            down: ["ArrowDown", "s"],
            left: ["ArrowLeft", "q"],
            right: ["ArrowRight", "d"]
        },
        qwerty: {
            up: ["ArrowUp", "w"],
            down: ["ArrowDown", "s"],
            left: ["ArrowLeft", "a"],
            right: ["ArrowRight", "d"]
        }
    }

    /**
     * @param {string} keyboardType Keyboard layout name, such as AZERTY or QWERTY.
     * @returns {{up: string[], down: string[], left: string[], right: string[]}}
     */
    static getLayout(keyboardType) {
        return this.mouve[keyboardType.toLowerCase()]
    }

    static getKeyUP(keyboardType) {
        return this.getLayout(keyboardType).up
    }

    static getKeyLeft(keyboardType) {
        return this.getLayout(keyboardType).left
    }

    static getKeyDown(keyboardType) {
        return this.getLayout(keyboardType).down
    }

    static getKeyRight(keyboardType) {
        return this.getLayout(keyboardType).right
    }
}

/**
 * Legacy modal prompt helper used by older UI flows.
 */
class PromptWindow {
    constructor() {
        this.promptL = Utils.Functions.load("promptContent")
        this.promptWrapL = Utils.Functions.load("prompt")
        this.promptAnchorL = Utils.Functions.load("promptAnchor")
        this.darkenL = Utils.Functions.load("darken")
        this.promptOn = 0
        this.promptOptionFocus = 0
        this.promptOptionsN = 0
        this.promptNoClose = false
    }

    /**
     * Renders and opens a prompt.
     *
     * @param {string} str HTML prompt content.
     * @param {(string|[string, string, string?])[]} options Button labels or [label, onclick, style] tuples.
     * @param {string=} style Optional prompt wrapper class suffix.
     */
    Prompt(str, options, style) {
        if (!Utils.Functions.empty(style)) this.promptWrapL.className = "framed " + style
        else this.promptWrapL.className = "framed"

        if (str.match(/^<id [a-zA-Z0-9]+>/)) {
            const id = str.match(/^<id ([a-zA-Z0-9]+)>/)[1]
            str = str.replace(/^<id [a-zA-Z0-9]+>/, "")
            str = `<div id="promptContent${id}">${str}</div>`
        }
        if (str.includes("<noClose>")) {
            str = str.replace("<noClose>", "")
            this.promptNoClose = true
        }

        let opts = ""
        this.promptOptionsN = 0
        for (let i = 0; i < options.length; i++) {
            if (options[i] == "br") {
                opts += "<br>"
            } else {
                if (typeof options[i] == "string") options[i] = [options[i], "const p = new Game.PromptWindow(); p.ClosePrompt();"]
                else if (!options[i][1]) options[i] = [options[i][0], "const p = new Game.PromptWindow(); p.ClosePrompt();", options[i][2]]

                options[i][1] = options[i][1].replace(/'/g, "&#39;").replace(/"/g, "&#34;")
                opts += "<a id=\"promptOption" + i + "\" class=\"option\" " + (options[i][2] ? "style=\"" + options[i][2] + "\" " : "") + "onclick=\"" + options[i][1] + "\">" + options[i][0] + "</a>"
                this.promptOptionsN++
            }
        }

        this.promptL.innerHTML = str + "<div class=\"optionBox\">" + opts + "</div>"
        this.promptAnchorL.style.display = "block"
        this.darkenL.style.display = "block"
        this.promptL.focus()
        this.promptOn = true
        this.promptOptionFocus = 0
        this.FocusPromptOption(0)
        this.UpdatePrompt()
        if (!this.promptNoClose) Utils.Functions.load("promptClose").style.display = "block"
        else Utils.Functions.load("promptClose").style.display = "none"
    }

    /**
     * Centers the prompt vertically in the viewport.
     */
    UpdatePrompt() {
        this.promptAnchorL.style.top = Math.floor((window.innerHeight - this.promptWrapL.offsetHeight) / (16 - 2)) + "px"
    }

    /**
     * Fires the currently focused prompt option.
     */
    ConfirmPrompt() {
        if (!Utils.Functions.empty(this.promptOn) && Utils.Functions.load("promptOption" + this.promptOptionFocus) &&
            Utils.Functions.load("promptOption" + this.promptOptionFocus).style.display != "none") {
            Utils.Functions.FireEvent(Utils.Functions.load("promptOption" + this.promptOptionFocus), "click")
        }
    }

    /**
     * Closes the prompt and clears focus state.
     *
     * @returns {false|undefined} False when no prompt is open.
     */
    ClosePrompt() {
        if (!this.promptOn) return false
        this.promptAnchorL.style.display = "none"
        this.darkenL.style.display = "none"
        this.promptOn = 0
        this.promptOptionFocus = 0
        this.promptOptionsN = 0
        this.promptNoClose = false
    }

    /**
     * Moves keyboard focus between visible prompt options.
     *
     * @param {number} dir Direction offset, usually -1, 0, or 1.
     * @param {number=} tryN Internal recursion guard.
     */
    FocusPromptOption(dir, tryN) {
        let id = this.promptOptionFocus + dir
        if (id < 0) id = this.promptOptionsN - 1
        if (id >= this.promptOptionsN) id = 0

        const promptOptionId = Utils.Functions.load("promptOption" + id)
        while (id >= 0 && id < this.promptOptionsN && (!Utils.Functions.empty(promptOptionId) || promptOptionId.style.display == "none")) {
            id += (dir || 1)
        }
        if (Utils.Functions.load("promptOption" + id) && Utils.Functions.load("promptOption" + id).style.display != "none") {
            if (Utils.Functions.load("promptOption" + this.promptOptionFocus) != null) {
                Utils.Functions.load("promptOption" + this.promptOptionFocus).classList.remove("focused")
            }
            this.promptOptionFocus = id
            if (Utils.Functions.load("promptOption" + this.promptOptionFocus) != null) {
                Utils.Functions.load("promptOption" + this.promptOptionFocus).classList.add("focused")
            }
        } else if (!Utils.Functions.empty(tryN) && dir != 0) {
            this.promptOptionFocus = id
            this.FocusPromptOption(dir, 1)
        }
    }
}

/**
 * Coordinates DOM setup, ECS resources, game loop lifecycle, and HUD overlays.
 */
class GameController {
    constructor() {
        this.READY = false
        this.PAUSE = true
        this.world = null
        this.schedule = null
        this.state = null
        this.input = null
        this.audio = null
        this.assets = null
        this.devTools = null
        this.controlsHud = null
        this.pauseHud = null
        this.gameOverHud = null
        this.levelCompleteHud = null
        this.finalWinHud = null
        this.introHud = null
        this.introStep = "title"
        this.selectedKeyboardType = null
        this.countdownTimer = null
        this.muted = false
        this.availableKeyboards = ["AZERTY", "QWERTY"]
        this.currentKeyboardType = null
        this.Storage = Storage
        this.KeyControll = KeyControl
        this.PromptWindow = PromptWindow
        this.Audio = new GameAudio(this)
        this.animate = this.animate.bind(this)
        this.resizeBoard = this.resizeBoard.bind(this)
    }

    /**
     * Boots the ECS world, creates shared resources, loads the first level, and starts the loop.
     */
    init() {
        const hudElements = {
            score: document.getElementById("score"),
            highScore: document.getElementById("highScore"),
            level: document.getElementById("level"),
            lives: document.getElementById("lives"),
            powerUps: document.getElementById("powerUps")
        }
        const gameCanvas = document.getElementById("TheGame")
        const gameCanvasContext = gameCanvas.getContext("2d")
        gameCanvas.width = GAME_WIDTH
        gameCanvas.height = GAME_HEIGHT

        const world = new World()
        const schedule = new Schedule()
        const assets = new AssetCache()
        const input = new InputResource()
        const state = new GameState(hudElements)
        const audio = new AudioResource()
        state.onGameOver = () => this.showGameOverHud()
        state.onLevelComplete = () => this.showLevelCompleteHud()
        state.onGameWon = () => this.showFinalWinHud()

        world.setResource(CanvasResource, new CanvasResource(gameCanvas, gameCanvasContext))
        world.setResource(InputResource, input)
        world.setResource(GameState, state)
        world.setResource(AssetCache, assets)
        world.setResource(AudioResource, audio)

        loadLevel(world, assets, state.levelIndex)
        state.captureLevelStartState()
        registerSystems(schedule, world, this.KeyControll)

        this.world = world
        this.schedule = schedule
        this.assets = assets
        this.state = state
        this.input = input
        this.audio = audio

        this.initKeyControl()
        this.initGameControls()
        this.initIntroHud()
        this.initMovementKeys()
        this.initGameOverHud()
        this.initWinHuds()
        this.initDevTools()
        this.resizeBoard()
        window.addEventListener("resize", this.resizeBoard)
        this.READY = true
        state.ready = true
        this.animate()
    }

    /**
     * Scales the visual board to fit the viewport while preserving canvas resolution.
     */
    resizeBoard() {
        const board = document.querySelector(".game-board")
        const canvas = document.getElementById("TheGame")
        const hud = document.querySelector(".hud")
        if (!board || !canvas || !hud) return

        const shellPadding = 32
        const availableWidth = Math.max(240, window.innerWidth - 40)
        const availableHeight = Math.max(260, window.innerHeight - hud.offsetHeight - shellPadding - 12)
        const scale = Math.min(availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT, 1.6)
        const width = Math.floor(GAME_WIDTH * scale)
        const height = Math.floor(GAME_HEIGHT * scale)

        board.style.width = `${width}px`
        board.style.height = `${height}px`
        board.style.setProperty("--grid-size", `${TILE_SIZE * scale}px`)
        canvas.style.width = "100%"
        canvas.style.height = "100%"
    }

    /**
     * Mounts optional devtools and binds the D+T toggle chord.
     */
    initDevTools() {
        this.devTools = new DevTools({
            game: this,
            root: document.getElementById("devTools")
        })

        this.devTools
            .register(new LevelSelectorTool())
            .mount()
        this.devTools.hide()
        
        const pressedKeys = new Set()
        let chordWasDown = false

        window.addEventListener("keydown", event => {
            pressedKeys.add(event.key.toLowerCase())

            const chordIsDown = pressedKeys.has("d") && pressedKeys.has("t")
            if (!chordIsDown || chordWasDown) return

            chordWasDown = true
            this.devTools.toggle()
        })

        window.addEventListener("keyup", event => {
            pressedKeys.delete(event.key.toLowerCase())
            if (!pressedKeys.has("d") || !pressedKeys.has("t")) chordWasDown = false
        })

        console.info("Devtools ready: press D+T")
    }

    /**
     * Reloads the world at a specific level, preserving run state and UI controls.
     *
     * @param {number} levelIndex Zero-based target level index.
     */
    goToLevel(levelIndex) {
        if (!this.world || !this.assets || !this.state) return

        this.state.setLevelIndex(levelIndex)
        this.state.ended = false
        this.state.gameOverVisible = false
        this.state.levelCompleteVisible = false
        this.state.finalWinVisible = false
        this.state.lastTimestamp = 0
        loadLevel(this.world, this.assets, levelIndex)
        this.state.captureLevelStartState()
        this.state.updateHud()
        this.hideGameOverHud()
        this.hideWinHuds()
        this.hidePauseHud()
        this.updateControlButtons()

        if (!this.state.paused && this.state.animationId === null) {
            this.animate()
        }
    }

    /**
     * Main animation frame callback.
     *
     * @param {number} timestamp requestAnimationFrame timestamp in milliseconds.
     */
    animate(timestamp = 0) {
        if (!this.state || this.state.paused || this.state.ended) return

        const dt = Math.min((timestamp - this.state.lastTimestamp) / 1000 || 1 / 60, 0.1)
        this.state.lastTimestamp = timestamp
        this.state.animationId = requestAnimationFrame(this.animate)
        this.schedule.run(this.world, dt, SYSTEM_PHASES)
        this.devTools?.update()
    }

    /**
     * Binds pause and mute controls for both buttons and keyboard shortcuts.
     */
    initGameControls() {
        this.controlsHud = {
            pause: document.getElementById("pauseToggle"),
            mute: document.getElementById("muteToggle")
        }
        this.pauseHud = {
            root: document.getElementById("pauseHud"),
            resume: document.getElementById("resumeGame")
        }

        this.muted = this.Storage.localStorageGet("PacmanWebGameMuted") === "true"
        this.audio?.setMuted(this.muted)
        this.controlsHud.pause?.addEventListener("click", () => this.togglePause())
        this.controlsHud.mute?.addEventListener("click", () => this.toggleMute())
        this.pauseHud.resume?.addEventListener("click", () => this.resumeGame())

        window.addEventListener("keydown", event => {
            if (event.repeat) return

            const key = event.key.toLowerCase()
            if (key === "p") {
                event.preventDefault()
                this.togglePause()
            } else if (key === "m") {
                event.preventDefault()
                this.toggleMute()
            }
        })

        this.updateControlButtons()
    }

    /**
     * @returns {boolean} Whether pause can be toggled in the current UI/game state.
     */
    canTogglePause() {
        return Boolean(
            this.state &&
            this.input?.currentKeyboardType &&
            this.introHud?.root?.hidden &&
            !this.state.ended &&
            !this.state.gameOverVisible &&
            !this.state.levelCompleteVisible &&
            !this.state.finalWinVisible
        )
    }

    /**
     * Switches between paused and running states when allowed.
     */
    togglePause() {
        if (!this.canTogglePause()) {
            this.updateControlButtons()
            return
        }

        if (this.state.paused) this.resumeGame()
        else this.pauseGame()
    }

    /**
     * Pauses the game loop and opens the pause HUD.
     */
    pauseGame() {
        if (!this.canTogglePause() || this.state.paused) return

        this.clearInput()
        this.PAUSE = true
        this.state.paused = true
        cancelAnimationFrame(this.state.animationId)
        this.state.animationId = null
        this.showPauseHud()
        this.updateControlButtons()
    }

    /**
     * Resumes the game loop from pause.
     */
    resumeGame() {
        if (!this.canTogglePause() || !this.state.paused) return

        this.clearInput()
        this.hidePauseHud()
        this.PAUSE = false
        this.state.paused = false
        this.state.lastTimestamp = 0
        if (this.state.animationId === null) this.animate()
        this.updateControlButtons()
    }

    showPauseHud() {
        if (this.pauseHud?.root) this.pauseHud.root.hidden = false
        this.pauseHud?.resume?.focus()
    }

    hidePauseHud() {
        if (this.pauseHud?.root) this.pauseHud.root.hidden = true
    }

    /**
     * Toggles persisted mute state and updates active audio.
     */
    toggleMute() {
        this.muted = this.audio?.toggleMuted() ?? !this.muted
        this.Storage.localStorageSet("PacmanWebGameMuted", String(this.muted))
        this.updateControlButtons()
    }

    /**
     * Synchronizes pause/mute button labels, disabled state, and aria state.
     */
    updateControlButtons() {
        if (this.controlsHud?.pause) {
            const isPaused = Boolean(this.state?.paused && this.pauseHud?.root && !this.pauseHud.root.hidden)
            this.controlsHud.pause.textContent = isPaused ? "Resume" : "Pause"
            this.controlsHud.pause.disabled = !this.canTogglePause()
            this.controlsHud.pause.setAttribute("aria-pressed", String(isPaused))
        }
        if (this.controlsHud?.mute) {
            this.controlsHud.mute.textContent = this.muted ? "Sound" : "Mute"
            this.controlsHud.mute.setAttribute("aria-pressed", String(this.muted))
        }
    }

    /**
     * Restores saved keyboard layout but keeps gameplay paused until intro completes.
     */
    initKeyControl() {
        this.currentKeyboardType = this.Storage.localStorageGet("PacmanWebGameKeyboard")
        this.selectedKeyboardType = this.currentKeyboardType || "QWERTY"
        this.input.currentKeyboardType = null
        this.PAUSE = true
        this.state.paused = true
    }

    /**
     * Builds the intro overlay and keyboard-layout selection flow.
     */
    initIntroHud() {
        this.introHud = {
            root: document.getElementById("introHud"),
            titlePanel: document.getElementById("introTitlePanel"),
            controlsPanel: document.getElementById("introControlsPanel"),
            countdownPanel: document.getElementById("introCountdownPanel"),
            keyboardOptions: document.getElementById("keyboardOptions"),
            start: document.getElementById("introStart"),
            confirm: document.getElementById("introConfirm"),
            countdown: document.getElementById("introCountdown")
        }

        if (!this.introHud.root) return

        this.renderKeyboardOptions()
        this.showIntroStep("title")
        this.introHud.start?.addEventListener("click", () => this.showIntroStep("controls"))
        this.introHud.confirm?.addEventListener("click", () => this.startIntroCountdown())

        window.addEventListener("keydown", event => {
            if (!this.introHud?.root || this.introHud.root.hidden) return

            if (this.introStep === "title" && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault()
                this.showIntroStep("controls")
            } else if (this.introStep === "controls") {
                if (event.key === "Enter") {
                    event.preventDefault()
                    this.startIntroCountdown()
                } else if (event.key === "Escape" || event.key === "Backspace") {
                    event.preventDefault()
                    this.showIntroStep("title")
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault()
                    this.changeSelectedKeyboard(-1)
                } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault()
                    this.changeSelectedKeyboard(1)
                }
            }
        })
    }

    /**
     * Shows one panel of the intro overlay.
     *
     * @param {"title"|"controls"|"countdown"} step Intro step to show.
     */
    showIntroStep(step) {
        if (!this.introHud?.root) return

        this.introStep = step
        this.introHud.titlePanel.hidden = step !== "title"
        this.introHud.controlsPanel.hidden = step !== "controls"
        this.introHud.countdownPanel.hidden = step !== "countdown"

        if (step === "title") {
            this.introHud.start?.focus()
        } else if (step === "controls") {
            this.renderKeyboardOptions()
            this.introHud.confirm?.focus()
        }
    }

    /**
     * Rebuilds the keyboard layout chooser from availableKeyboards.
     */
    renderKeyboardOptions() {
        if (!this.introHud?.keyboardOptions) return

        this.introHud.keyboardOptions.innerHTML = ""
        for (const keyboardType of this.availableKeyboards) {
            const button = document.createElement("button")
            const isSelected = keyboardType === this.selectedKeyboardType
            const keys = keyboardType === "AZERTY" ? ["Z", "Q", "S", "D"] : ["W", "A", "S", "D"]

            button.type = "button"
            button.className = `keyboard-option${isSelected ? " is-selected" : ""}`
            button.setAttribute("aria-pressed", String(isSelected))
            button.innerHTML = `
                <span class="keyboard-option-label">${keyboardType}</span>
                <span class="keyboard-option-keys" aria-hidden="true">
                    <span class="keyboard-key-grid">
                        <span></span>
                        <span class="keycap">${keys[0]}</span>
                        <span></span>
                        <span class="keycap">${keys[1]}</span>
                        <span class="keycap">${keys[2]}</span>
                        <span class="keycap">${keys[3]}</span>
                    </span>
                    <span class="keyboard-key-grid">
                        <span></span>
                        <span class="keycap">&uarr;</span>
                        <span></span>
                        <span class="keycap">&larr;</span>
                        <span class="keycap">&darr;</span>
                        <span class="keycap">&rarr;</span>
                    </span>
                </span>
            `
            button.addEventListener("click", () => {
                this.selectedKeyboardType = keyboardType
                this.renderKeyboardOptions()
                this.introHud.confirm?.focus()
            })
            this.introHud.keyboardOptions.appendChild(button)
        }
    }

    /**
     * Moves keyboard-layout selection with wrapping.
     *
     * @param {number} direction Direction offset, typically -1 or 1.
     */
    changeSelectedKeyboard(direction) {
        const currentIndex = this.availableKeyboards.indexOf(this.selectedKeyboardType)
        const nextIndex = (currentIndex + direction + this.availableKeyboards.length) % this.availableKeyboards.length
        this.selectedKeyboardType = this.availableKeyboards[nextIndex]
        this.renderKeyboardOptions()
    }

    /**
     * Confirms keyboard layout, plays the intro sound, then starts gameplay after the countdown.
     */
    startIntroCountdown() {
        if (!this.introHud?.root || this.introStep === "countdown") return

        this.selectKeyboard(this.selectedKeyboardType)
        this.showIntroStep("countdown")

        const steps = ["3", "2", "1", "GO!"]
        let stepIndex = 0
        this.introHud.countdown.textContent = steps[stepIndex]
        this.Audio.playIntro()

        clearInterval(this.countdownTimer)
        this.countdownTimer = setInterval(() => {
            stepIndex++
            if (stepIndex < steps.length) {
                this.introHud.countdown.textContent = steps[stepIndex]
                return
            }

            clearInterval(this.countdownTimer)
            this.countdownTimer = null
            this.beginGameplay()
        }, 700)
    }

    /**
     * Stores the active keyboard layout in both input state and localStorage.
     *
     * @param {string} keyboardType Keyboard layout name.
     */
    selectKeyboard(keyboardType) {
        this.Storage.localStorageSet("PacmanWebGameKeyboard", keyboardType)
        this.currentKeyboardType = keyboardType
        this.input.currentKeyboardType = keyboardType
        this.selectedKeyboardType = keyboardType
    }

    /**
     * Closes the intro overlay and starts the animation loop.
     */
    beginGameplay() {
        if (!this.state || !this.introHud?.root) return

        this.clearInput()
        this.introHud.root.hidden = true
        this.PAUSE = false
        this.state.paused = false
        this.state.lastTimestamp = 0
        this.hidePauseHud()
        this.updateControlButtons()
        if (this.state.animationId === null) this.animate()
    }

    /**
     * Binds retry/start-over controls for the game-over overlay.
     */
    initGameOverHud() {
        this.gameOverHud = {
            root: document.getElementById("gameOverHud"),
            retry: document.getElementById("retryLevel"),
            startOver: document.getElementById("startOver")
        }

        this.gameOverHud.retry?.addEventListener("click", () => this.retryLevel())
        this.gameOverHud.startOver?.addEventListener("click", () => this.startOver())

        window.addEventListener("keydown", event => {
            if (!this.state?.gameOverVisible) return

            if (event.key === "Enter") {
                event.preventDefault()
                this.retryLevel()
            } else if (event.key === "Escape" || event.key === "Backspace") {
                event.preventDefault()
                this.startOver()
            }
        })
    }

    /**
     * Opens the game-over overlay after a losing collision.
     */
    showGameOverHud() {
        if (!this.state || !this.gameOverHud?.root) return

        this.hidePauseHud()
        this.state.gameOverVisible = true
        this.gameOverHud.root.hidden = false
        this.gameOverHud.retry?.focus()
        this.updateControlButtons()
    }

    /**
     * Closes the game-over overlay and clears its state flag.
     */
    hideGameOverHud() {
        if (this.gameOverHud?.root) this.gameOverHud.root.hidden = true
        if (this.state) this.state.gameOverVisible = false
        this.updateControlButtons()
    }

    /**
     * Binds level-complete and final-win overlays.
     */
    initWinHuds() {
        this.levelCompleteHud = {
            root: document.getElementById("levelCompleteHud"),
            title: document.getElementById("levelCompleteTitle"),
            score: document.getElementById("levelCompleteScore"),
            next: document.getElementById("nextLevel")
        }
        this.finalWinHud = {
            root: document.getElementById("finalWinHud"),
            score: document.getElementById("finalWinScore"),
            startOver: document.getElementById("finalWinStartOver")
        }

        this.levelCompleteHud.next?.addEventListener("click", () => this.continueToNextLevel())
        this.finalWinHud.startOver?.addEventListener("click", () => this.startOver())

        window.addEventListener("keydown", event => {
            if (this.state?.levelCompleteVisible && event.key === "Enter") {
                event.preventDefault()
                this.continueToNextLevel()
            } else if (this.state?.finalWinVisible && event.key === "Enter") {
                event.preventDefault()
                this.startOver()
            }
        })
    }

    /**
     * Opens the level-complete overlay and displays current level score.
     */
    showLevelCompleteHud() {
        if (!this.state || !this.levelCompleteHud?.root) return

        this.clearInput()
        this.hidePauseHud()
        this.state.levelCompleteVisible = true
        if (this.levelCompleteHud.title) {
            this.levelCompleteHud.title.textContent = `Level ${this.state.level} Clear`
        }
        if (this.levelCompleteHud.score) {
            this.levelCompleteHud.score.textContent = `Score ${this.state.score}`
        }
        this.levelCompleteHud.root.hidden = false
        this.levelCompleteHud.next?.focus()
        this.updateControlButtons()
    }

    /**
     * Opens the final-win overlay after the last level.
     */
    showFinalWinHud() {
        if (!this.state || !this.finalWinHud?.root) return

        this.clearInput()
        this.hidePauseHud()
        this.state.finalWinVisible = true
        if (this.finalWinHud.score) {
            this.finalWinHud.score.textContent = `Final Score ${this.state.score}`
        }
        this.finalWinHud.root.hidden = false
        this.finalWinHud.startOver?.focus()
        this.updateControlButtons()
    }

    /**
     * Closes all win-state overlays and clears their state flags.
     */
    hideWinHuds() {
        if (this.levelCompleteHud?.root) this.levelCompleteHud.root.hidden = true
        if (this.finalWinHud?.root) this.finalWinHud.root.hidden = true
        if (this.state) {
            this.state.levelCompleteVisible = false
            this.state.finalWinVisible = false
        }
        this.updateControlButtons()
    }

    /**
     * Advances to the next level while preserving score and lives.
     */
    continueToNextLevel() {
        if (!this.world || !this.assets || !this.state) return

        this.clearInput()
        this.hideWinHuds()
        this.state.setLevelIndex(this.state.levelIndex + 1)
        this.state.ended = false
        this.state.paused = !this.input.currentKeyboardType
        this.state.lastTimestamp = 0
        this.state.animationId = null
        loadLevel(this.world, this.assets, this.state.levelIndex)
        this.state.captureLevelStartState()
        this.state.updateHud()
        this.updateControlButtons()

        if (!this.state.paused) this.animate()
    }

    /**
     * Restarts the current level from its captured start state.
     */
    retryLevel() {
        if (!this.world || !this.assets || !this.state) return

        this.state.restoreLevelStartState()
        this.restartFromState()
    }

    /**
     * Resets the whole run to level one.
     */
    startOver() {
        if (!this.world || !this.assets || !this.state) return

        this.state.resetRun()
        this.state.captureLevelStartState()
        this.restartFromState()
    }

    /**
     * Reloads the current level using existing GameState values.
     */
    restartFromState() {
        this.clearInput()
        this.state.ended = false
        this.state.paused = !this.input.currentKeyboardType
        this.state.lastTimestamp = 0
        this.state.animationId = null
        this.hideGameOverHud()
        this.hideWinHuds()
        this.hidePauseHud()
        loadLevel(this.world, this.assets, this.state.levelIndex)
        this.state.updateHud()
        this.updateControlButtons()

        if (!this.state.paused) this.animate()
    }

    /**
     * Clears held movement keys so stale input does not leak between UI states.
     */
    clearInput() {
        this.input.keys.up.pressed = false
        this.input.keys.left.pressed = false
        this.input.keys.down.pressed = false
        this.input.keys.right.pressed = false
        this.input.lastKey = ""
    }

    /**
     * Binds movement keys into InputResource for the input system to consume.
     */
    initMovementKeys() {
        addEventListener("keydown", ({ key }) => {
            if (
                !this.input.currentKeyboardType ||
                this.state?.paused ||
                this.state?.gameOverVisible ||
                this.state?.levelCompleteVisible ||
                this.state?.finalWinVisible
            ) return

            if (this.KeyControll.getKeyUP(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.up.pressed = true
                this.input.lastKey = key
            } else if (this.KeyControll.getKeyLeft(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.left.pressed = true
                this.input.lastKey = key
            } else if (this.KeyControll.getKeyDown(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.down.pressed = true
                this.input.lastKey = key
            } else if (this.KeyControll.getKeyRight(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.right.pressed = true
                this.input.lastKey = key
            }
        })

        addEventListener("keyup", ({ key }) => {
            if (!this.input.currentKeyboardType) return

            if (this.KeyControll.getKeyUP(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.up.pressed = false
            } else if (this.KeyControll.getKeyLeft(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.left.pressed = false
            } else if (this.KeyControll.getKeyDown(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.down.pressed = false
            } else if (this.KeyControll.getKeyRight(this.input.currentKeyboardType).includes(key)) {
                this.input.keys.right.pressed = false
            }
        })
    }
}

export const Game = new GameController()

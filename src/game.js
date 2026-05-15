import { Schedule, World } from "archetype-ecs-lib"
import { Utils } from "./utils.js"
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, spawnActors, spawnLevel } from "./level.js"
import {
    AssetCache,
    AudioResource,
    CanvasResource,
    GameState,
    InputResource
} from "./resources.js"
import { registerSystems, SYSTEM_PHASES } from "./systems.js"

class GameAudio {
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

class Storage {
    static localStorageGet(key) {
        let local = false
        try { local = window.localStorage.getItem(key) } catch (exception) {}
        return local
    }

    static localStorageSet(key, value) {
        let local = false
        try { local = window.localStorage.setItem(key, value) } catch (exception) {}
        return local
    }
}

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

    UpdatePrompt() {
        this.promptAnchorL.style.top = Math.floor((window.innerHeight - this.promptWrapL.offsetHeight) / (16 - 2)) + "px"
    }

    ConfirmPrompt() {
        if (!Utils.Functions.empty(this.promptOn) && Utils.Functions.load("promptOption" + this.promptOptionFocus) &&
            Utils.Functions.load("promptOption" + this.promptOptionFocus).style.display != "none") {
            Utils.Functions.FireEvent(Utils.Functions.load("promptOption" + this.promptOptionFocus), "click")
        }
    }

    ClosePrompt() {
        if (!this.promptOn) return false
        this.promptAnchorL.style.display = "none"
        this.darkenL.style.display = "none"
        this.promptOn = 0
        this.promptOptionFocus = 0
        this.promptOptionsN = 0
        this.promptNoClose = false
    }

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

class GameController {
    constructor() {
        this.READY = false
        this.PAUSE = true
        this.world = null
        this.schedule = null
        this.state = null
        this.input = null
        this.audio = null
        this.availableKeyboards = ["AZERTY", "QWERTY"]
        this.currentKeyboardType = null
        this.Storage = Storage
        this.KeyControll = KeyControl
        this.PromptWindow = PromptWindow
        this.Audio = new GameAudio(this)
        this.animate = this.animate.bind(this)
        this.resizeBoard = this.resizeBoard.bind(this)
    }

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

        world.setResource(CanvasResource, new CanvasResource(gameCanvas, gameCanvasContext))
        world.setResource(InputResource, input)
        world.setResource(GameState, state)
        world.setResource(AssetCache, assets)
        world.setResource(AudioResource, audio)

        spawnLevel(world, assets)
        spawnActors(world)
        registerSystems(schedule, world, this.KeyControll)

        this.world = world
        this.schedule = schedule
        this.state = state
        this.input = input
        this.audio = audio

        this.initKeyControl()
        this.initMovementKeys()
        this.resizeBoard()
        window.addEventListener("resize", this.resizeBoard)
        this.READY = true
        state.ready = true
        this.animate()
    }

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

    animate(timestamp = 0) {
        if (!this.state || this.state.paused || this.state.ended) return

        const dt = Math.min((timestamp - this.state.lastTimestamp) / 1000 || 1 / 60, 0.1)
        this.state.lastTimestamp = timestamp
        this.state.animationId = requestAnimationFrame(this.animate)
        this.schedule.run(this.world, dt, SYSTEM_PHASES)
    }

    initKeyControl() {
        this.currentKeyboardType = this.Storage.localStorageGet("PacmanWebGameKeyboard")
        this.input.currentKeyboardType = this.currentKeyboardType

        if (Utils.Functions.empty(this.currentKeyboardType)) {
            this.audio.play('intro').remove()
            this.showKeyboardPrompt()
        } else {
            this.PAUSE = false
            this.state.paused = false
        }
    }

    showKeyboardPrompt() {
        const promptWindow = new this.PromptWindow()
        let str = ""

        for (let i = 0; i < this.availableKeyboards.length; i++) {
            const element = this.availableKeyboards[i]
            str += `<div id="keyboardSelect-${i}" class="keyboardSelectButton title" style="padding:4px;">${element}</div>`
        }

        promptWindow.Prompt(
            "<id ChangeKeyboard><h3 id=\"keyboardSelectHeader\">Select Keyboard</h3>" +
            "<div class=\"line\"></div>" +
            str,
            ["cancel"]
        )

        for (let i in this.availableKeyboards) {
            const keyboardType = this.availableKeyboards[i]
            Utils.Functions.AddEvent(Utils.Functions.load("keyboardSelect-" + i), "click", () => {
                this.selectKeyboard(keyboardType, promptWindow)
            })
        }
    }

    selectKeyboard(keyboardType, promptWindow) {
        this.Storage.localStorageSet("PacmanWebGameKeyboard", keyboardType)
        this.currentKeyboardType = keyboardType
        this.input.currentKeyboardType = keyboardType
        this.PAUSE = false
        this.state.paused = false
        promptWindow.ClosePrompt()

        let reloaded = false
        const reload = function () {
            if (reloaded) return
            reloaded = true
            window.location.reload()
        }
        this.Audio.playWaka({ onEnded: reload })
        setTimeout(reload, 1500)
    }

    initMovementKeys() {
        addEventListener("keydown", ({ key }) => {
            if (!this.input.currentKeyboardType) return

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

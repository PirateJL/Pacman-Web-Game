import { LEVELS } from "./level.js"

/**
 * Container for opt-in development tools mounted beside the game board.
 */
export class DevTools {
    /**
     * @param {{game: import("./game.js").Game, root: HTMLElement|null}} config Devtools dependencies.
     */
    constructor({ game, root }) {
        this.game = game
        this.root = root
        this.tools = []
    }

    /**
     * Adds a tool that implements mount(root, game) and optionally update(game).
     *
     * @param {{mount: Function, update?: Function}} tool Devtool plugin.
     * @returns {DevTools} This instance for chaining.
     */
    register(tool) {
        this.tools.push(tool)
        return this
    }

    /**
     * Renders the devtools shell and mounts registered tools.
     */
    mount() {
        if (!this.root) return

        this.root.innerHTML = `
            <div class="devtools-header">
                <span class="devtools-title">Devtools</span>
            </div>
            <div class="devtools-body"></div>
        `

        const body = this.root.querySelector(".devtools-body")
        this.tools.forEach(tool => tool.mount(body, this.game))
    }

    /**
     * Shows devtools and recalculates board size around the new sidebar.
     */
    show() {
        if (this.root) this.root.hidden = false
        this.game.resizeBoard()
    }

    /**
     * Hides devtools and restores available board space.
     */
    hide() {
        if (this.root) this.root.hidden = true
        this.game.resizeBoard()
    }

    /**
     * Toggles devtools visibility.
     */
    toggle() {
        if (!this.root) return
        if (this.root.hidden) this.show()
        else this.hide()
    }

    /**
     * Lets mounted tools synchronize their controls with game state.
     */
    update() {
        this.tools.forEach(tool => {
            if (tool.update) tool.update(this.game)
        })
    }
}

/**
 * Devtool for jumping directly to any configured level.
 */
export class LevelSelectorTool {
    constructor() {
        this.select = null
    }

    /**
     * Builds the level selector and binds level changes.
     *
     * @param {HTMLElement} root Devtools body element.
     * @param {import("./game.js").Game} game Game controller instance.
     */
    mount(root, game) {
        const section = document.createElement("section")
        section.className = "devtool"

        const options = LEVELS.map((level, index) => {
            const selected = index === game.state.levelIndex ? " selected" : ""
            return `<option value="${index}"${selected}>${index + 1}. ${level.name}</option>`
        }).join("")

        section.innerHTML = `
            <label class="devtool-label" for="devLevelSelect">Level</label>
            <select id="devLevelSelect" class="devtool-select">
                ${options}
            </select>
        `

        this.select = section.querySelector("#devLevelSelect")
        this.select.addEventListener("change", () => {
            game.goToLevel(Number(this.select.value))
        })

        root.appendChild(section)
    }

    /**
     * Keeps the selector value aligned when levels change elsewhere.
     *
     * @param {import("./game.js").Game} game Game controller instance.
     */
    update(game) {
        if (!this.select) return

        const levelIndex = String(game.state.levelIndex)
        if (this.select.value !== levelIndex) this.select.value = levelIndex
    }
}

import { LEVELS } from "./level.js"

export class DevTools {
    constructor({ game, root }) {
        this.game = game
        this.root = root
        this.tools = []
    }

    register(tool) {
        this.tools.push(tool)
        return this
    }

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

    show() {
        if (this.root) this.root.hidden = false
        this.game.resizeBoard()
    }

    hide() {
        if (this.root) this.root.hidden = true
        this.game.resizeBoard()
    }

    toggle() {
        if (!this.root) return
        if (this.root.hidden) this.show()
        else this.hide()
    }

    update() {
        this.tools.forEach(tool => {
            if (tool.update) tool.update(this.game)
        })
    }
}

export class LevelSelectorTool {
    constructor() {
        this.select = null
    }

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

    update(game) {
        if (!this.select) return

        const levelIndex = String(game.state.levelIndex)
        if (this.select.value !== levelIndex) this.select.value = levelIndex
    }
}

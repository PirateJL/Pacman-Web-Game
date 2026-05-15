import { Game } from "./src/game.js"

window.Game = Game

window.onload = () => {
    if (!Game.READY) {
        Game.init()
    }
}

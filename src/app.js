import "./style.css"
import { Game } from "./game.js"

window.Game = Game

window.onload = () => {
    if (!Game.READY) {
        Game.init()
    }
}

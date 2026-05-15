import {
    Boundary,
    BoxCollider,
    CircleCollider,
    GhostAI,
    Pellet,
    PlayerControlled,
    Position,
    PowerUp,
    Sprite,
    Velocity
} from "./components.js"

export const TILE_SIZE = 40
export const PLAYER_SPEED = 5
export const GHOST_SPEED = 4

export const LEVEL_MAP = [
    ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
    ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
    ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
    ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
    ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
    ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
    ["|", ".", "b", ".", "[", "+", "]", ".", "b", ".", "|"],
    ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
    ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
    ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
    ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
    ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", "|"],
    ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
]

const IMAGE_URLS = {
    "-": new URL("../images/pipeHorizontal.png", import.meta.url).href,
    "|": new URL("../images/pipeVertical.png", import.meta.url).href,
    "1": new URL("../images/pipeCorner1.png", import.meta.url).href,
    "2": new URL("../images/pipeCorner2.png", import.meta.url).href,
    "3": new URL("../images/pipeCorner3.png", import.meta.url).href,
    "4": new URL("../images/pipeCorner4.png", import.meta.url).href,
    b: new URL("../images/block.png", import.meta.url).href,
    "[": new URL("../images/capLeft.png", import.meta.url).href,
    "]": new URL("../images/capRight.png", import.meta.url).href,
    _: new URL("../images/capBottom.png", import.meta.url).href,
    "^": new URL("../images/capTop.png", import.meta.url).href,
    "+": new URL("../images/pipeCross.png", import.meta.url).href,
    "5": new URL("../images/pipeConnectorTop.png", import.meta.url).href,
    "6": new URL("../images/pipeConnectorRight.png", import.meta.url).href,
    "7": new URL("../images/pipeConnectorBottom.png", import.meta.url).href,
    "8": new URL("../images/pipeConnectorLeft.png", import.meta.url).href
}

export function spawnLevel(world, assets) {
    LEVEL_MAP.forEach((row, rowIndex) => {
        row.forEach((symbol, columnIndex) => {
            const x = columnIndex * TILE_SIZE
            const y = rowIndex * TILE_SIZE

            if (IMAGE_URLS[symbol]) {
                world.spawnWith(
                    [Position, new Position(x, y)],
                    [Sprite, new Sprite(assets.image(IMAGE_URLS[symbol]), TILE_SIZE, TILE_SIZE)],
                    [BoxCollider, new BoxCollider(TILE_SIZE, TILE_SIZE)],
                    [Boundary, new Boundary(symbol)]
                )
            } else if (symbol === ".") {
                world.spawnWith(
                    [Position, new Position(x + TILE_SIZE / 2, y + TILE_SIZE / 2)],
                    [CircleCollider, new CircleCollider(3)],
                    [Pellet, new Pellet(10)]
                )
            } else if (symbol === "p") {
                world.spawnWith(
                    [Position, new Position(x + TILE_SIZE / 2, y + TILE_SIZE / 2)],
                    [CircleCollider, new CircleCollider(8)],
                    [PowerUp, new PowerUp(5000)]
                )
            }
        })
    })
}

export function spawnActors(world) {
    world.spawnWith(
        [Position, new Position(TILE_SIZE + TILE_SIZE / 2, TILE_SIZE + TILE_SIZE / 2)],
        [Velocity, new Velocity(0, 0)],
        [CircleCollider, new CircleCollider(15)],
        [PlayerControlled, new PlayerControlled()]
    )

    world.spawnWith(
        [Position, new Position(TILE_SIZE * 6 + TILE_SIZE / 2, TILE_SIZE + TILE_SIZE / 2)],
        [Velocity, new Velocity(GHOST_SPEED, 0)],
        [CircleCollider, new CircleCollider(15)],
        [GhostAI, new GhostAI("red", GHOST_SPEED)]
    )

    world.spawnWith(
        [Position, new Position(TILE_SIZE * 6 + TILE_SIZE / 2, TILE_SIZE * 3 + TILE_SIZE / 2)],
        [Velocity, new Velocity(GHOST_SPEED, 0)],
        [CircleCollider, new CircleCollider(15)],
        [GhostAI, new GhostAI("pink", GHOST_SPEED)]
    )
}

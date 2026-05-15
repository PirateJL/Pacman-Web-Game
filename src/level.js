import {
    Boundary,
    BoxCollider,
    CircleCollider,
    GhostAI,
    Pellet,
    PlayerControlled,
    Position,
    PowerUp,
    Scared,
    Sprite,
    Velocity
} from "./components.js"

export const TILE_SIZE = 40
export const PLAYER_SPEED = 5
export const GHOST_SPEED = 4

/**
 * Levels are compose of :
 *  - width between 10 to 20 squares
 *  - height between 9 to 15 squares
 *  - 2 to 5 enimies
 *  - number of powerup are total enimies - 1
 */
export const LEVELS = [
    {
        name: "Classic",
        map: [
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
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 6, row: 1, color: "red" },
            { column: 6, row: 3, color: "pink" }
        ]
    },
    {
        name: "Big Classic",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "+", "]", ".", "[", "-", "]", ".", "[", "+", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", "p", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 6, row: 1, color: "red" },
            { column: 7, row: 5, color: "pink" },
            { column: 9, row: 9, color: "orange" }
        ]
    },
    {
        name: "Crossroads",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", "p", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", "^", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "+", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", "_", ".", "[", "]", ".", "|"],
            ["|", "p", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 6, row: 1, color: "red" },
            { column: 6, row: 6, color: "pink" },
            { column: 9, row: 10, color: "orange" }
        ]
    },
    {
        name: "Final Run",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", "p", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "+", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", "p", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 6, row: 1, color: "red" },
            { column: 6, row: 3, color: "pink" },
            { column: 4, row: 9, color: "orange" },
            { column: 9, row: 6, color: "cyan" }
        ]
    }
]

export const LEVEL_MAP = LEVELS[0].map
export const GRID_COLUMNS = LEVEL_MAP[0].length
export const GRID_ROWS = LEVEL_MAP.length
export const GAME_WIDTH = GRID_COLUMNS * TILE_SIZE
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE

const IMAGE_URLS = {
    "-": new URL("./assets/images/pipeHorizontal.png", import.meta.url).href,
    "|": new URL("./assets/images/pipeVertical.png", import.meta.url).href,
    "1": new URL("./assets/images/pipeCorner1.png", import.meta.url).href,
    "2": new URL("./assets/images/pipeCorner2.png", import.meta.url).href,
    "3": new URL("./assets/images/pipeCorner3.png", import.meta.url).href,
    "4": new URL("./assets/images/pipeCorner4.png", import.meta.url).href,
    b: new URL("./assets/images/block.png", import.meta.url).href,
    "[": new URL("./assets/images/capLeft.png", import.meta.url).href,
    "]": new URL("./assets/images/capRight.png", import.meta.url).href,
    _: new URL("./assets/images/capBottom.png", import.meta.url).href,
    "^": new URL("./assets/images/capTop.png", import.meta.url).href,
    "+": new URL("./assets/images/pipeCross.png", import.meta.url).href,
    "5": new URL("./assets/images/pipeConnectorTop.png", import.meta.url).href,
    "6": new URL("./assets/images/pipeConnectorRight.png", import.meta.url).href,
    "7": new URL("./assets/images/pipeConnectorBottom.png", import.meta.url).href,
    "8": new URL("./assets/images/pipeConnectorLeft.png", import.meta.url).href
}

export function loadLevel(world, assets, levelIndex) {
    clearLevel(world)
    spawnLevel(world, assets, levelIndex)
    spawnActors(world, levelIndex)
}

export function hasNextLevel(levelIndex) {
    return levelIndex + 1 < LEVELS.length
}

export function spawnLevel(world, assets, levelIndex = 0) {
    const level = LEVELS[levelIndex] || LEVELS[0]

    level.map.forEach((row, rowIndex) => {
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

export function spawnActors(world, levelIndex = 0) {
    const level = LEVELS[levelIndex] || LEVELS[0]
    const playerStart = level.playerStart

    world.spawnWith(
        [Position, new Position(tileCenter(playerStart.column), tileCenter(playerStart.row))],
        [Velocity, new Velocity(0, 0)],
        [CircleCollider, new CircleCollider(15)],
        [PlayerControlled, new PlayerControlled()]
    )

    level.ghosts.forEach(ghost => {
        world.spawnWith(
            [Position, new Position(tileCenter(ghost.column), tileCenter(ghost.row))],
            [Velocity, new Velocity(GHOST_SPEED, 0)],
            [CircleCollider, new CircleCollider(15)],
            [GhostAI, new GhostAI(ghost.color, GHOST_SPEED)]
        )
    })
}

function clearLevel(world) {
    const entities = new Map()
    const collect = ({ e }) => entities.set(e.id, e)

    for (const row of world.query(Boundary)) collect(row)
    for (const row of world.query(Pellet)) collect(row)
    for (const row of world.query(PowerUp)) collect(row)
    for (const row of world.query(PlayerControlled)) collect(row)
    for (const row of world.query(GhostAI)) collect(row)
    for (const row of world.query(Scared)) collect(row)

    world.despawnMany([...entities.values()])
}

function tileCenter(tile) {
    return TILE_SIZE * tile + TILE_SIZE / 2
}

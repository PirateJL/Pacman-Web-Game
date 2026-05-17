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
 * @typedef {{column: number, row: number}} TileCoordinate
 */

/**
 * @typedef {Object} GhostSpawn
 * @property {number} column Spawn column in level-map tile coordinates.
 * @property {number} row Spawn row in level-map tile coordinates.
 * @property {string} color Render color used while the ghost is not scared.
 * @property {TileCoordinate=} cageExit Optional tile target used to guide caged ghosts into the maze.
 * @property {number=} cageReleaseDelay Milliseconds to wait before the ghost can leave a cage.
 */

/**
 * @typedef {Object} LevelDefinition
 * @property {string} name Display name used by devtools.
 * @property {string[][]} map Tile symbols for maze geometry, pellets, and power-ups.
 * @property {TileCoordinate} playerStart Preferred player spawn tile.
 * @property {GhostSpawn[]} ghosts Ghost spawn definitions for this level.
 */

/**
 * Level map legend:
 *  - image symbols create solid boundary tiles
 *  - "." creates a score pellet
 *  - "p" creates a power-up
 *
 * Levels are composed of:
 *  - width between 10 to 20 squares
 *  - height between 9 to 15 squares
 *  - 2 to 6 ghosts
 *  - number of power-ups are total ghosts - 1
 *
 * @type {LevelDefinition[]}
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
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", "[", "]", ".", "[", "]", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "+", "]", ".", "[", "-", "]", ".", "[", "+", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", "b", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
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
            { column: 9, row: 9, color: "orange" },
            { column: 12, row: 7, color: "cyan" }
        ]
    },
    {
        name: "Spiral Chase",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", ".", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", "b", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", "p", "b", ".", "[", "+", "]", ".", "[", "-", "]", ".", "[", "+", "]", ".", "b", "p", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", "[", "-", "]", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 8, row: 1, color: "red" },
            { column: 3, row: 5, color: "pink" },
            { column: 11, row: 7, color: "orange" },
            { column: 9, row: 11, color: "cyan" },
            { column: 15, row: 5, color: "purple" }
        ]
    },
    {
        name: "Gauntlet",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "[", "-", "]", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", "[", "]", ".", "[", "]", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", "p", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "+", "]", ".", "[", "-", "]", ".", "[", "+", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", "[", "]", ".", "[", "]", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", "[", "]", ".", "[", "]", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", "b", ".", "b", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", ".", ".", ".", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", "p", ".", ".", ".", ".", ".", ".", "[", "-", "]", ".", ".", ".", ".", ".", ".", "p", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 9, row: 1, color: "red" },
            { column: 4, row: 4, color: "pink" },
            { column: 11, row: 5, color: "orange" },
            { column: 9, row: 9, color: "cyan" },
            { column: 15, row: 11, color: "purple" },
            { column: 9, row: 3, color: "lime" }
        ]
    },
    {
        name: "Ghost Cage",
        map: [
            ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "7", "]", ".", "b", ".", "b", ".", "[", "7", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", "_", ".", ".", ".", "p", ".", ".", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", "1", "-", ".", "-", "2", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", ".", ".", ".", "|", ".", ".", ".", "|", ".", ".", ".", ".", "b", ".", "|"],
            ["|", ".", ".", ".", "[", "]", ".", "|", ".", ".", ".", "|", ".", "[", "]", ".", ".", ".", "|"],
            ["|", "p", "b", ".", ".", ".", ".", "|", ".", ".", ".", "|", ".", ".", ".", ".", "b", "p", "|"],
            ["|", ".", ".", ".", ".", "_", ".", "4", "-", "-", "-", "3", ".", "_", ".", ".", ".", ".", "|"],
            ["|", ".", "[", "]", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "[", "]", ".", "|"],
            ["|", ".", ".", ".", ".", "^", ".", ".", ".", ".", ".", ".", ".", "^", ".", ".", ".", ".", "|"],
            ["|", ".", "b", ".", "[", "5", "]", ".", "b", ".", "b", ".", "[", "5", "]", ".", "b", ".", "|"],
            ["|", ".", ".", ".", ".", ".", ".", ".", ".", "p", ".", ".", ".", ".", ".", ".", ".", ".", "|"],
            ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"]
        ],
        playerStart: { column: 1, row: 1 },
        ghosts: [
            { column: 9, row: 6, color: "red", cageExit: { column: 9, row: 4 }, cageReleaseDelay: 0 },
            { column: 8, row: 7, color: "pink", cageExit: { column: 9, row: 4 }, cageReleaseDelay: 1000 },
            { column: 9, row: 7, color: "purple", cageExit: { column: 9, row: 4 }, cageReleaseDelay: 2000 },
            { column: 10, row: 7, color: "orange", cageExit: { column: 9, row: 4 }, cageReleaseDelay: 3000 },
            { column: 9, row: 8, color: "cyan", cageExit: { column: 9, row: 4 }, cageReleaseDelay: 4000 }
        ]
    },
]

export const LEVEL_MAP = LEVELS[0].map
export const GRID_COLUMNS = Math.max(...LEVELS.map(level => level.map[0].length))
export const GRID_ROWS = Math.max(...LEVELS.map(level => level.map.length))
export const GAME_WIDTH = GRID_COLUMNS * TILE_SIZE
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE

/**
 * Returns the pixel dimensions of the selected level map.
 *
 * @param {number} levelIndex Index in LEVELS.
 * @returns {{width: number, height: number}}
 */
export function getLevelPixelSize(levelIndex) {
    const level = LEVELS[levelIndex] || LEVELS[0]

    return {
        width: level.map[0].length * TILE_SIZE,
        height: level.map.length * TILE_SIZE
    }
}

/**
 * Boundary tile symbols mapped to the sprite image used by renderSystem.
 */
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

/**
 * Replaces the current world entities with a fresh level and its actors.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to mutate.
 * @param {import("./resources.js").AssetCache} assets Shared image cache.
 * @param {number} levelIndex Index in LEVELS.
 */
export function loadLevel(world, assets, levelIndex) {
    clearLevel(world)
    spawnLevel(world, assets, levelIndex)
    spawnActors(world, levelIndex)
}

/**
 * @param {number} levelIndex Current zero-based level index.
 * @returns {boolean} Whether another level exists after the current one.
 */
export function hasNextLevel(levelIndex) {
    return levelIndex + 1 < LEVELS.length
}

/**
 * Converts level-map symbols into boundary, pellet, and power-up entities.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to mutate.
 * @param {import("./resources.js").AssetCache} assets Shared image cache.
 * @param {number} levelIndex Index in LEVELS.
 */
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

/**
 * Spawns Pacman and all ghosts for a level.
 *
 * Spawn tiles are resolved to nearby walkable cells so level authors can move
 * actors without breaking startup if a preferred tile becomes a wall.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to mutate.
 * @param {number} levelIndex Index in LEVELS.
 */
export function spawnActors(world, levelIndex = 0) {
    const level = LEVELS[levelIndex] || LEVELS[0]
    const playerStart = resolveSpawnTile(level, level.playerStart)

    world.spawnWith(
        [Position, new Position(tileCenter(playerStart.column), tileCenter(playerStart.row))],
        [Velocity, new Velocity(0, 0)],
        [CircleCollider, new CircleCollider(15)],
        [PlayerControlled, new PlayerControlled()]
    )

    level.ghosts.forEach(ghost => {
        const ghostStart = resolveSpawnTile(level, ghost)

        world.spawnWith(
            [Position, new Position(tileCenter(ghostStart.column), tileCenter(ghostStart.row))],
            [Velocity, new Velocity(ghost.cageExit && !ghost.cageReleaseDelay ? 0 : GHOST_SPEED, 0)],
            [CircleCollider, new CircleCollider(15)],
            [GhostAI, new GhostAI(ghost.color, GHOST_SPEED, ghost.cageExit, ghost.cageReleaseDelay)]
        )
    })
}

/**
 * Removes gameplay entities before loading or reloading a level.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to mutate.
 */
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

/**
 * @param {number} tile Tile index in a row or column.
 * @returns {number} Pixel coordinate for the tile center.
 */
function tileCenter(tile) {
    return TILE_SIZE * tile + TILE_SIZE / 2
}

/**
 * Finds a valid walkable spawn tile, falling back outward from the requested tile.
 *
 * @param {LevelDefinition} level Level being spawned.
 * @param {TileCoordinate} spawn Preferred spawn tile.
 * @returns {TileCoordinate}
 */
function resolveSpawnTile(level, spawn) {
    if (isWalkableSpawn(level, spawn.column, spawn.row)) return spawn

    const maxRadius = Math.max(level.map.length, level.map[0].length)
    for (let radius = 1; radius <= maxRadius; radius++) {
        const fallback = findWalkableAtRadius(level, spawn, radius, ".") ||
            findWalkableAtRadius(level, spawn, radius, "p")
        if (fallback) return fallback
    }

    return { column: 1, row: 1 }
}

/**
 * Searches one Manhattan-distance ring for a tile with the requested symbol.
 *
 * @param {LevelDefinition} level Level being searched.
 * @param {TileCoordinate} spawn Center of the search.
 * @param {number} radius Manhattan distance from the center tile.
 * @param {string} symbol Walkable symbol to find.
 * @returns {TileCoordinate|null}
 */
function findWalkableAtRadius(level, spawn, radius, symbol) {
    for (let row = spawn.row - radius; row <= spawn.row + radius; row++) {
        for (let column = spawn.column - radius; column <= spawn.column + radius; column++) {
            if (Math.abs(column - spawn.column) + Math.abs(row - spawn.row) !== radius) continue
            if (level.map[row]?.[column] === symbol) return { column, row }
        }
    }

    return null
}

/**
 * @param {LevelDefinition} level Level being checked.
 * @param {number} column Tile column.
 * @param {number} row Tile row.
 * @returns {boolean} Whether the tile can hold an actor spawn.
 */
function isWalkableSpawn(level, column, row) {
    const symbol = level.map[row]?.[column]
    return symbol === "." || symbol === "p"
}

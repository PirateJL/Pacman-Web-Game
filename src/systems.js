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
import { GAME_HEIGHT, GAME_WIDTH, getLevelPixelSize, hasNextLevel, PLAYER_SPEED, TILE_SIZE } from "./level.js"
import { AudioResource, CanvasResource, GameState, InputResource, PlaySoundEvent } from "./resources.js"

/**
 * @typedef {{x: number, y: number}} Vector2
 */

/**
 * Fixed system execution order for one gameplay frame.
 *
 * Gameplay events are followed by audio phases so sound effects react to world
 * changes after collisions and win/loss checks have already run.
 */
export const SYSTEM_PHASES = [
    "input",
    "pelletCollision",
    "audioAfterPellet",
    "ghostCollision",
    "audioAfterGhost",
    "winCondition",
    "audioAfterWin",
    "powerUpCollision",
    "audioAfterPowerUp",
    "scaredTimer",
    "boundaryCollision",
    "render",
    "movement",
    "ghostAi",
    "playerRotation",
    "hud"
]

/**
 * Installs all gameplay systems into the ECS schedule.
 *
 * @param {import("archetype-ecs-lib").Schedule} schedule Schedule to configure.
 * @param {import("archetype-ecs-lib").World} world ECS world containing resources and entities.
 * @param {typeof import("./game.js").Game.KeyControll} keyControl Keyboard-layout helper.
 */
export function registerSystems(schedule, world, keyControl) {
    schedule.setOrder(SYSTEM_PHASES)
    schedule.add(world, "input", inputSystem(keyControl))
    schedule.add(world, "pelletCollision", pelletCollisionSystem)
    schedule.add(world, "audioAfterPellet", audioSystem)
    schedule.add(world, "ghostCollision", ghostCollisionSystem)
    schedule.add(world, "audioAfterGhost", audioSystem)
    schedule.add(world, "winCondition", winConditionSystem)
    schedule.add(world, "audioAfterWin", audioSystem)
    schedule.add(world, "powerUpCollision", powerUpCollisionSystem)
    schedule.add(world, "audioAfterPowerUp", audioSystem)
    schedule.add(world, "scaredTimer", scaredTimerSystem)
    schedule.add(world, "boundaryCollision", boundaryCollisionSystem)
    schedule.add(world, "render", renderSystem)
    schedule.add(world, "movement", movementSystem)
    schedule.add(world, "ghostAi", ghostAiSystem)
    schedule.add(world, "playerRotation", playerRotationSystem)
    schedule.add(world, "hud", hudSystem)
}

/**
 * Builds the input system with the selected keyboard layout helper.
 *
 * @param {typeof import("./game.js").Game.KeyControll} keyControl Keyboard-layout helper.
 * @returns {(world: import("archetype-ecs-lib").World) => void}
 */
function inputSystem(keyControl) {
    return function inputSystemForKeyboard(world) {
        const input = world.requireResource(InputResource)
        const player = getPlayer(world)
        if (!player || !input.currentKeyboardType) return

        if (input.keys.up.pressed && keyControl.getKeyUP(input.currentKeyboardType).includes(input.lastKey)) {
            applyRequestedVelocity(world, player, { x: 0, y: -PLAYER_SPEED }, "y")
        } else if (input.keys.left.pressed && keyControl.getKeyLeft(input.currentKeyboardType).includes(input.lastKey)) {
            applyRequestedVelocity(world, player, { x: -PLAYER_SPEED, y: 0 }, "x")
        } else if (input.keys.down.pressed && keyControl.getKeyDown(input.currentKeyboardType).includes(input.lastKey)) {
            applyRequestedVelocity(world, player, { x: 0, y: PLAYER_SPEED }, "y")
        } else if (input.keys.right.pressed && keyControl.getKeyRight(input.currentKeyboardType).includes(input.lastKey)) {
            applyRequestedVelocity(world, player, { x: PLAYER_SPEED, y: 0 }, "x")
        }
    }
}

/**
 * Collects pellets that overlap the player and emits the matching sound event.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function pelletCollisionSystem(world) {
    const state = world.requireResource(GameState)
    const player = getPlayer(world)
    if (!player) return

    for (const { e, c1: position, c2: collider, c3: pellet } of world.query(Position, CircleCollider, Pellet)) {
        if (!circlesOverlap(position, collider.radius, player.position, player.collider.radius)) continue

        world.cmd().despawn(e)
        state.addScore(pellet.value)
        world.emit(PlaySoundEvent, new PlaySoundEvent("waka"))
    }
}

/**
 * Handles ghost/player collisions, including eating scared ghosts and ending a run.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function ghostCollisionSystem(world) {
    const state = world.requireResource(GameState)
    const player = getPlayer(world)
    if (!player || state.ended) return

    for (const { e, c1: position, c2: collider } of world.query(Position, CircleCollider, GhostAI)) {
        if (!circlesOverlap(position, collider.radius, player.position, player.collider.radius)) continue

        if (world.has(e, Scared)) {
            world.cmd().despawn(e)
            world.emit(PlaySoundEvent, new PlaySoundEvent("eatGhost"))
        } else {
            endGame(world, "you lose", "endGame")
        }
    }
}

/**
 * Ends the level when all pellets have been collected.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 */
function winConditionSystem(world) {
    const state = world.requireResource(GameState)
    if (state.ended) return

    for (const _ of world.query(Pellet)) return

    if (hasNextLevel(state.levelIndex)) {
        completeLevel(world)
    } else {
        endGame(world, "You WIN", "winGame")
    }
}

/**
 * Collects power-ups and refreshes the Scared timer on every ghost.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function powerUpCollisionSystem(world) {
    const player = getPlayer(world)
    if (!player) return

    for (const { e, c1: position, c2: collider, c3: powerUp } of world.query(Position, CircleCollider, PowerUp)) {
        if (!circlesOverlap(position, collider.radius, player.position, player.collider.radius)) continue

        world.cmd().despawn(e)
        world.emit(PlaySoundEvent, new PlaySoundEvent("powerDot"))

        for (const { e: ghost } of world.query(GhostAI)) {
            if (world.has(ghost, Scared)) {
                world.set(ghost, Scared, new Scared(powerUp.duration))
            } else {
                world.cmd().add(ghost, Scared, new Scared(powerUp.duration))
            }
        }
    }
}

/**
 * Counts down each Scared component and removes expired ones.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 * @param {number} dt Seconds elapsed since the previous frame.
 */
function scaredTimerSystem(world, dt) {
    for (const { e, c1: scared } of world.query(Scared)) {
        scared.remaining -= dt * 1000
        if (scared.remaining <= 0) world.cmd().remove(e, Scared)
    }
}

/**
 * Stops the player before their next move would intersect maze geometry.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect and update.
 */
function boundaryCollisionSystem(world) {
    const player = getPlayer(world)
    if (!player) return

    if (collidesWithBoundary(world, player.position, player.collider.radius, player.velocity)) {
        player.velocity.x = 0
        player.velocity.y = 0
    }
}

/**
 * Draws the current world to the canvas.
 *
 * Smaller levels are centered within the maximum canvas size so all level maps
 * can share one canvas resolution.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to render.
 */
function renderSystem(world) {
    const { canvas, context } = world.requireResource(CanvasResource)
    const state = world.requireResource(GameState)
    const offset = getRenderOffset(state.levelIndex)

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.save()
    context.translate(offset.x, offset.y)

    for (const { c1: position, c2: sprite } of world.query(Position, Sprite, Boundary)) {
        context.drawImage(sprite.image, position.x, position.y)
    }

    for (const { c1: position, c2: collider } of world.query(Position, CircleCollider, Pellet)) {
        drawCircle(context, position, collider.radius, "white")
    }

    for (const { c1: position, c2: collider } of world.query(Position, CircleCollider, PowerUp)) {
        drawCircle(context, position, collider.radius, "white")
    }

    for (const { c1: position, c2: collider, c3: player } of world.query(Position, CircleCollider, PlayerControlled)) {
        drawPlayer(context, position, collider.radius, player)
    }

    for (const { e, c1: position, c2: collider, c3: ghost } of world.query(Position, CircleCollider, GhostAI)) {
        drawCircle(context, position, collider.radius, world.has(e, Scared) ? "blue" : ghost.color)
    }

    context.restore()
}

/**
 * Applies velocity to actors and advances Pacman's mouth animation.
 *
 * Ghosts choose a fallback direction before moving if their current direction
 * would hit a wall or, for caged ghosts, leave before their release delay.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function movementSystem(world) {
    for (const { c1: position, c2: velocity, c3: collider, c4: ghost } of world.query(Position, Velocity, CircleCollider, GhostAI)) {
        const blocksCageDoor = option => isGhostWaitingInCage(ghost) && wouldLeaveCage(position, option, ghost)

        if (collidesWithBoundary(world, position, collider.radius, velocity) || blocksCageDoor(velocity)) {
            applyGhostFallbackVelocity(world, position, collider.radius, velocity, ghost.speed, blocksCageDoor)
        }

        position.x += velocity.x
        position.y += velocity.y
    }

    for (const { c1: position, c2: velocity } of world.query(Position, Velocity, CircleCollider, PlayerControlled)) {
        position.x += velocity.x
        position.y += velocity.y
    }

    for (const { c1: player } of world.query(PlayerControlled)) {
        if (player.radians < 0 || player.radians > 0.75) player.openRate = -player.openRate
        player.radians += player.openRate
    }
}

/**
 * Updates ghost direction choices at intersections and guides caged ghosts out.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 * @param {number} dt Seconds elapsed since the previous frame.
 */
function ghostAiSystem(world, dt = 0) {
    for (const { c1: position, c2: velocity, c3: collider, c4: ghost } of world.query(Position, Velocity, CircleCollider, GhostAI)) {
        updateGhostCageReleaseDelay(ghost, dt)
        if (!isGhostWaitingInCage(ghost) && guideGhostOutOfCage(world, position, velocity, collider.radius, ghost)) continue

        const collisions = []

        if (collidesWithBoundary(world, position, collider.radius, { x: ghost.speed, y: 0 })) collisions.push("right")
        if (collidesWithBoundary(world, position, collider.radius, { x: -ghost.speed, y: 0 })) collisions.push("left")
        if (collidesWithBoundary(world, position, collider.radius, { x: 0, y: -ghost.speed })) collisions.push("up")
        if (collidesWithBoundary(world, position, collider.radius, { x: 0, y: ghost.speed })) collisions.push("down")

        if (collisions.length > ghost.prevCollisions.length) {
            ghost.prevCollisions = collisions
        }

        if (!sameDirections(collisions, ghost.prevCollisions)) {
            if (velocity.x > 0) ghost.prevCollisions.push("right")
            if (velocity.x < 0) ghost.prevCollisions.push("left")
            if (velocity.y < 0) ghost.prevCollisions.push("up")
            if (velocity.y > 0) ghost.prevCollisions.push("down")

            const pathways = ghost.prevCollisions.filter(collision => !collisions.includes(collision))
            const direction = pathways[Math.floor(Math.random() * pathways.length)]

            if (direction === "down") {
                velocity.y = ghost.speed
                velocity.x = 0
            } else if (direction === "up") {
                velocity.y = -ghost.speed
                velocity.x = 0
            } else if (direction === "right") {
                velocity.y = 0
                velocity.x = ghost.speed
            } else if (direction === "left") {
                velocity.y = 0
                velocity.x = -ghost.speed
            }

            ghost.prevCollisions = []
        }
    }
}

/**
 * Rotates the player drawing based on the current movement direction.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function playerRotationSystem(world) {
    for (const { c1: velocity, c2: player } of world.query(Velocity, PlayerControlled)) {
        if (velocity.x > 0) player.rotation = 0
        else if (velocity.x < 0) player.rotation = Math.PI
        else if (velocity.y > 0) player.rotation = Math.PI / 2
        else if (velocity.y < 0) player.rotation = Math.PI * 1.5
    }
}

/**
 * Plays and drains queued sound events.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world that owns audio events.
 */
function audioSystem(world) {
    const audio = world.requireResource(AudioResource)
    world.drainEvents(PlaySoundEvent, event => audio.play(event.name, event.params))
}

/**
 * Computes simple HUD counters from the ECS world.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 */
function hudSystem(world) {
    const state = world.requireResource(GameState)
    let powerUpsLeft = 0
    let activePowerUps = 0

    for (const _ of world.query(PowerUp)) powerUpsLeft++
    for (const _ of world.query(Scared)) activePowerUps++

    state.setPowerUps(powerUpsLeft, activePowerUps)
}

/**
 * Applies one requested player velocity axis if it will not immediately hit a boundary.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 * @param {{position: Position, velocity: Velocity, collider: CircleCollider, player: PlayerControlled}} player Player query result.
 * @param {Vector2} requestedVelocity Requested movement vector.
 * @param {"x"|"y"} axis Axis being updated by the input key.
 */
function applyRequestedVelocity(world, player, requestedVelocity, axis) {
    if (collidesWithBoundary(world, player.position, player.collider.radius, requestedVelocity)) {
        player.velocity[axis] = 0
    } else {
        player.velocity[axis] = requestedVelocity[axis]
    }
}

/**
 * Picks a non-blocked replacement direction for a ghost.
 *
 * Reversing is preferred so a ghost can recover from moving into a wall, with a
 * random open direction used as a fallback at intersections.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 * @param {Position} position Current ghost position.
 * @param {number} radius Ghost collision radius.
 * @param {Velocity} velocity Mutable ghost velocity.
 * @param {number} speed Ghost movement speed.
 * @param {(velocity: Vector2) => boolean} blocksDirection Extra constraint, such as a closed cage door.
 */
function applyGhostFallbackVelocity(world, position, radius, velocity, speed, blocksDirection = () => false) {
    const reverse = { x: -velocity.x, y: -velocity.y }
    const options = [
        { x: speed, y: 0 },
        { x: -speed, y: 0 },
        { x: 0, y: speed },
        { x: 0, y: -speed }
    ]
        .filter(option => !sameVelocity(option, velocity))
        .filter(option => !blocksDirection(option))
        .filter(option => !collidesWithBoundary(world, position, radius, option))

    const direction = options.find(option => sameVelocity(option, reverse)) ||
        options[Math.floor(Math.random() * options.length)] ||
        { x: 0, y: 0 }

    velocity.x = direction.x
    velocity.y = direction.y
}

/**
 * Moves a ghost from its cage toward the configured exit tile.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 * @param {Position} position Current ghost position.
 * @param {Velocity} velocity Mutable ghost velocity.
 * @param {number} radius Ghost collision radius.
 * @param {GhostAI} ghost Ghost state.
 * @returns {boolean} True while the ghost is still being guided toward its exit.
 */
function guideGhostOutOfCage(world, position, velocity, radius, ghost) {
    if (!ghost.cageExit) return false

    const target = {
        x: tileCenter(ghost.cageExit.column),
        y: tileCenter(ghost.cageExit.row)
    }

    if (isNear(position.x, target.x, ghost.speed) && isNear(position.y, target.y, ghost.speed)) {
        position.x = target.x
        position.y = target.y
        ghost.cageExit = null
        ghost.prevCollisions = []
        return false
    }

    const horizontal = getAxisVelocity(position.x, target.x, ghost.speed, "x")
    const vertical = getAxisVelocity(position.y, target.y, ghost.speed, "y")
    const preferred = horizontal || vertical
    const fallback = preferred === horizontal ? vertical : horizontal
    const direction = [preferred, fallback].find(option => option && !collidesWithBoundary(world, position, radius, option))

    if (direction) {
        velocity.x = direction.x
        velocity.y = direction.y
    } else {
        applyGhostFallbackVelocity(world, position, radius, velocity, ghost.speed)
    }

    return true
}

/**
 * Reduces a ghost's cage release timer.
 *
 * @param {GhostAI} ghost Ghost state.
 * @param {number} dt Seconds elapsed since the previous frame.
 */
function updateGhostCageReleaseDelay(ghost, dt) {
    if (!isGhostWaitingInCage(ghost)) return
    ghost.cageReleaseDelay = Math.max(0, ghost.cageReleaseDelay - dt * 1000)
}

/**
 * @param {GhostAI} ghost Ghost state.
 * @returns {boolean} Whether the ghost is still waiting inside a cage.
 */
function isGhostWaitingInCage(ghost) {
    return ghost.cageExit && ghost.cageReleaseDelay > 0
}

/**
 * Prevents waiting ghosts from moving upward through the cage door before release.
 *
 * @param {Position} position Current ghost position.
 * @param {Vector2} velocity Direction being tested.
 * @param {GhostAI} ghost Ghost state.
 * @returns {boolean} Whether the tested direction would leave the cage early.
 */
function wouldLeaveCage(position, velocity, ghost) {
    if (!ghost.cageExit || velocity.y >= 0) return false

    const doorX = tileCenter(ghost.cageExit.column)
    const topInsideY = tileCenter(ghost.cageExit.row + 2)

    return Math.abs(position.x - doorX) < TILE_SIZE / 2 &&
        position.y <= topInsideY + ghost.speed
}

/**
 * @param {import("archetype-ecs-lib").World} world ECS world to query.
 * @returns {{position: Position, velocity: Velocity, collider: CircleCollider, player: PlayerControlled}|null}
 */
function getPlayer(world) {
    for (const { c1: position, c2: velocity, c3: collider, c4: player } of world.query(Position, Velocity, CircleCollider, PlayerControlled)) {
        return { position, velocity, collider, player }
    }

    return null
}

/**
 * Tests whether a circular actor would hit any boundary after applying velocity.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to inspect.
 * @param {Position} position Current circle center.
 * @param {number} radius Circle radius.
 * @param {Vector2} velocity Proposed movement.
 * @returns {boolean}
 */
function collidesWithBoundary(world, position, radius, velocity) {
    for (const { c1: boundaryPosition, c2: collider } of world.query(Position, BoxCollider, Boundary)) {
        if (circleCollidesWithRectangle(position, radius, velocity, boundaryPosition, collider)) return true
    }

    return false
}

/**
 * Circle/rectangle collision test that predicts the circle's next position.
 *
 * @param {Position} circlePosition Current circle center.
 * @param {number} radius Circle radius.
 * @param {Vector2} velocity Proposed movement.
 * @param {Position} rectanglePosition Rectangle top-left corner.
 * @param {BoxCollider} rectangle Rectangle dimensions.
 * @returns {boolean}
 */
function circleCollidesWithRectangle(circlePosition, radius, velocity, rectanglePosition, rectangle) {
    const padding = TILE_SIZE / 2 - radius - 1

    return (
        circlePosition.y - radius + velocity.y <= rectanglePosition.y + rectangle.height + padding &&
        circlePosition.x + radius + velocity.x >= rectanglePosition.x - padding &&
        circlePosition.y + radius + velocity.y >= rectanglePosition.y - padding &&
        circlePosition.x - radius + velocity.x <= rectanglePosition.x + rectangle.width + padding
    )
}

/**
 * @param {Position} positionA First circle center.
 * @param {number} radiusA First circle radius.
 * @param {Position} positionB Second circle center.
 * @param {number} radiusB Second circle radius.
 * @returns {boolean} Whether two circles currently overlap.
 */
function circlesOverlap(positionA, radiusA, positionB, radiusB) {
    return Math.hypot(positionA.x - positionB.x, positionA.y - positionB.y) < radiusA + radiusB
}

/**
 * @param {number} tile Tile index in a row or column.
 * @returns {number} Pixel coordinate for the tile center.
 */
function tileCenter(tile) {
    return TILE_SIZE * tile + TILE_SIZE / 2
}

/**
 * Builds an axis-aligned velocity that moves from current toward target.
 *
 * @param {number} current Current coordinate.
 * @param {number} target Target coordinate.
 * @param {number} speed Speed magnitude.
 * @param {"x"|"y"} axis Axis to move along.
 * @returns {Vector2|null} Null when already close enough to the target.
 */
function getAxisVelocity(current, target, speed, axis) {
    if (isNear(current, target, speed)) return null

    const direction = current < target ? speed : -speed
    return axis === "x" ? { x: direction, y: 0 } : { x: 0, y: direction }
}

/**
 * @param {number} current Current coordinate.
 * @param {number} target Target coordinate.
 * @param {number} speed Speed threshold.
 * @returns {boolean} Whether current is close enough to snap to target.
 */
function isNear(current, target, speed) {
    return Math.abs(current - target) < speed
}

/**
 * Draws one filled circle.
 *
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {Position} position Circle center.
 * @param {number} radius Circle radius.
 * @param {string} fillStyle CSS fill color.
 */
function drawCircle(context, position, radius, fillStyle) {
    context.beginPath()
    context.arc(position.x, position.y, radius, 0, Math.PI * 2)
    context.fillStyle = fillStyle
    context.fill()
    context.closePath()
}

/**
 * Draws Pacman as a rotating wedge whose mouth opening is controlled by PlayerControlled.
 *
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {Position} position Player center.
 * @param {number} radius Player radius.
 * @param {PlayerControlled} player Player animation state.
 */
function drawPlayer(context, position, radius, player) {
    context.save()
    context.translate(position.x, position.y)
    context.rotate(player.rotation)
    context.translate(-position.x, -position.y)
    context.beginPath()
    context.arc(position.x, position.y, radius, player.radians, Math.PI * 2 - player.radians)
    context.lineTo(position.x, position.y)
    context.fillStyle = "yellow"
    context.fill()
    context.closePath()
    context.restore()
}

/**
 * @param {string[]} left Direction names in previous order.
 * @param {string[]} right Direction names in previous order.
 * @returns {boolean} Whether both direction lists are identical.
 */
function sameDirections(left, right) {
    if (left.length !== right.length) return false
    return left.every((direction, index) => direction === right[index])
}

/**
 * @param {Vector2} left First velocity.
 * @param {Vector2} right Second velocity.
 * @returns {boolean} Whether both vectors are exactly equal.
 */
function sameVelocity(left, right) {
    return left.x === right.x && left.y === right.y
}

/**
 * @param {number} levelIndex Current level index.
 * @returns {Vector2} Canvas translation that centers the level inside the max board.
 */
function getRenderOffset(levelIndex) {
    const levelSize = getLevelPixelSize(levelIndex)

    return {
        x: Math.max(0, (GAME_WIDTH - levelSize.width) / 2),
        y: Math.max(0, (GAME_HEIGHT - levelSize.height) / 2)
    }
}

/**
 * Stops animation, emits the end sound, and opens the matching end-of-game HUD.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 * @param {string} message Console message for the result.
 * @param {"endGame"|"winGame"} soundName Sound and HUD result key.
 */
function endGame(world, message, soundName) {
    const state = world.requireResource(GameState)
    if (state.ended) return

    state.ended = true
    if (soundName === "endGame") state.setLives(0)
    console.log(message)
    cancelAnimationFrame(state.animationId)
    state.animationId = null
    world.emit(PlaySoundEvent, new PlaySoundEvent(soundName))
    if (soundName === "endGame") state.onGameOver?.()
    if (soundName === "winGame") state.onGameWon?.()
}

/**
 * Stops the current level and opens the level-complete HUD.
 *
 * @param {import("archetype-ecs-lib").World} world ECS world to update.
 */
function completeLevel(world) {
    const state = world.requireResource(GameState)
    if (state.ended) return

    state.ended = true
    cancelAnimationFrame(state.animationId)
    state.animationId = null
    world.emit(PlaySoundEvent, new PlaySoundEvent("winGame"))
    state.onLevelComplete?.()
}

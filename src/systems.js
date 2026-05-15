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
import { PLAYER_SPEED, TILE_SIZE } from "./level.js"
import { AudioResource, CanvasResource, GameState, InputResource, PlaySoundEvent } from "./resources.js"

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
    "playerRotation"
]

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
}

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

function pelletCollisionSystem(world) {
    const state = world.requireResource(GameState)
    const player = getPlayer(world)
    if (!player) return

    for (const { e, c1: position, c2: collider, c3: pellet } of world.query(Position, CircleCollider, Pellet)) {
        if (!circlesOverlap(position, collider.radius, player.position, player.collider.radius)) continue

        world.cmd().despawn(e)
        state.score += pellet.value
        state.scoreElement.innerHTML = state.score
        world.emit(PlaySoundEvent, new PlaySoundEvent("waka"))
    }
}

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

function winConditionSystem(world) {
    const state = world.requireResource(GameState)
    if (state.ended) return

    for (const _ of world.query(Pellet)) return
    endGame(world, "You WIN", "winGame")
}

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

function scaredTimerSystem(world, dt) {
    for (const { e, c1: scared } of world.query(Scared)) {
        scared.remaining -= dt * 1000
        if (scared.remaining <= 0) world.cmd().remove(e, Scared)
    }
}

function boundaryCollisionSystem(world) {
    const player = getPlayer(world)
    if (!player) return

    if (collidesWithBoundary(world, player.position, player.collider.radius, player.velocity)) {
        player.velocity.x = 0
        player.velocity.y = 0
    }
}

function renderSystem(world) {
    const { canvas, context } = world.requireResource(CanvasResource)
    context.clearRect(0, 0, canvas.width, canvas.height)

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
}

function movementSystem(world) {
    for (const { c1: position, c2: velocity } of world.query(Position, Velocity)) {
        position.x += velocity.x
        position.y += velocity.y
    }

    for (const { c1: player } of world.query(PlayerControlled)) {
        if (player.radians < 0 || player.radians > 0.75) player.openRate = -player.openRate
        player.radians += player.openRate
    }
}

function ghostAiSystem(world) {
    for (const { c1: position, c2: velocity, c3: collider, c4: ghost } of world.query(Position, Velocity, CircleCollider, GhostAI)) {
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

function playerRotationSystem(world) {
    for (const { c1: velocity, c2: player } of world.query(Velocity, PlayerControlled)) {
        if (velocity.x > 0) player.rotation = 0
        else if (velocity.x < 0) player.rotation = Math.PI
        else if (velocity.y > 0) player.rotation = Math.PI / 2
        else if (velocity.y < 0) player.rotation = Math.PI * 1.5
    }
}

function audioSystem(world) {
    const audio = world.requireResource(AudioResource)
    world.drainEvents(PlaySoundEvent, event => audio.play(event.name, event.params))
}

function applyRequestedVelocity(world, player, requestedVelocity, axis) {
    if (collidesWithBoundary(world, player.position, player.collider.radius, requestedVelocity)) {
        player.velocity[axis] = 0
    } else {
        player.velocity[axis] = requestedVelocity[axis]
    }
}

function getPlayer(world) {
    for (const { c1: position, c2: velocity, c3: collider, c4: player } of world.query(Position, Velocity, CircleCollider, PlayerControlled)) {
        return { position, velocity, collider, player }
    }

    return null
}

function collidesWithBoundary(world, position, radius, velocity) {
    for (const { c1: boundaryPosition, c2: collider } of world.query(Position, BoxCollider, Boundary)) {
        if (circleCollidesWithRectangle(position, radius, velocity, boundaryPosition, collider)) return true
    }

    return false
}

function circleCollidesWithRectangle(circlePosition, radius, velocity, rectanglePosition, rectangle) {
    const padding = TILE_SIZE / 2 - radius - 1

    return (
        circlePosition.y - radius + velocity.y <= rectanglePosition.y + rectangle.height + padding &&
        circlePosition.x + radius + velocity.x >= rectanglePosition.x - padding &&
        circlePosition.y + radius + velocity.y >= rectanglePosition.y - padding &&
        circlePosition.x - radius + velocity.x <= rectanglePosition.x + rectangle.width + padding
    )
}

function circlesOverlap(positionA, radiusA, positionB, radiusB) {
    return Math.hypot(positionA.x - positionB.x, positionA.y - positionB.y) < radiusA + radiusB
}

function drawCircle(context, position, radius, fillStyle) {
    context.beginPath()
    context.arc(position.x, position.y, radius, 0, Math.PI * 2)
    context.fillStyle = fillStyle
    context.fill()
    context.closePath()
}

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

function sameDirections(left, right) {
    if (left.length !== right.length) return false
    return left.every((direction, index) => direction === right[index])
}

function endGame(world, message, soundName) {
    const state = world.requireResource(GameState)
    if (state.ended) return

    state.ended = true
    console.log(message)
    cancelAnimationFrame(state.animationId)
    world.emit(PlaySoundEvent, new PlaySoundEvent(soundName))
}

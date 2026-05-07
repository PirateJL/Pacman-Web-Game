import { Utils } from "./utils.js";
const Game = {
    READY: false,
    PAUSE: true,
    score: 0,
    scoreElement: null,
    /** @type {HTMLCanvasElement} */
    gameCanvas: null,
    /** @type {CanvasRenderingContext2D} */
    gameCanvasContext: null,
    map: null,
    boundaries: [],
    pellets: [],
    powerUps: [],
    ghosts: [],
    player: null,
    keys: {
        up: {pressed: false},
        left: {pressed: false},
        down: {pressed: false},
        right: {pressed: false}
    },
    lastKey: '',
    currentKeyboardType: null,
    availableKeyboards: ['AZERTY', 'QWERTY'],
    init: function () {
        this.scoreElement = document.getElementById('score')
        this.gameCanvas = document.getElementById('TheGame')
        this.gameCanvasContext = this.gameCanvas.getContext('2d')
        this.gameCanvas.width = window.innerWidth
        this.gameCanvas.height = window.innerHeight

        // Game.Audio.playIntro()
        this.initBoundaries()
        this.initPlayer()
        this.initGhosts()
        this.initKeyControl()
        this.initMovementKeys()
        this.animate()

        this.READY = true
    },
    Audio: class {
        static playIntro(params = null) {
            const audio = new Audio("./sounds/Intro.wav")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playWaka(params = null) {
            const audio = new Audio("./sounds/waka.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playExtraPacman(params = null) {
            const audio = new Audio("./sounds/pacman_extrapac.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playEatFruit(params = null) {
            const audio = new Audio("./sounds/pacman_eatfruit.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playPowerDot(params = null) {
            const audio = new Audio("./sounds/power_dot.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playWinGame(params = null) {
            const audio = new Audio("./sounds/gameWin.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playEndGame(params = null) {
            const audio = new Audio("./sounds/gameOver.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
        static playEatGhost(params = null) {
            const audio = new Audio("./sounds/eat_ghost.mp3")
            if (!Utils.Functions.empty(params) && !Utils.Functions.empty(params.onEnded)) {audio.onended = params.onEnded}
            audio.play()
        }
    },
    Boundary: class {
        static width =  40;
        static height =  40;

        constructor({ position, image }) {
            this.position = position
            this.width = 40
            this.height = 40
            this.image = image
        }

        draw() {
            Game.gameCanvasContext.drawImage(this.image, this.position.x, this.position.y)
        }
    },
    initBoundaries: function () {
        Game.map = [
            ['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
            ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
            ['|', '.', 'b', '.', '[', '7', ']', '.', 'b', '.', '|'],
            ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
            ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
            ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
            ['|', '.', 'b', '.', '[', '+', ']', '.', 'b', '.', '|'],
            ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
            ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
            ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
            ['|', '.', 'b', '.', '[', '5', ']', '.', 'b', '.', '|'],
            ['|', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
            ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
        ]

        Game.map.forEach((row, i) => {
            row.forEach((symbol, j) => {
                switch (symbol) {
                    case '-':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeHorizontal.png')
                            })
                        )
                    break
                    case '|':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeVertical.png')
                            })
                        )
                    break
                    case '1':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeCorner1.png')
                            })
                        )
                    break
                    case '2':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeCorner2.png')
                            })
                        )
                    break
                    case '3':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeCorner3.png')
                            })
                        )
                    break
                    case '4':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/pipeCorner4.png')
                            })
                        )
                    break
                    case 'b':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: Game.Boundary.width * j,
                                    y: Game.Boundary.height * i
                                },
                                image: Game.createImage('images/block.png')
                            })
                        )
                    break
                    case '[':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/capLeft.png')
                            })
                        )
                    break
                    case ']':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/capRight.png')
                            })
                        )
                    break
                    case '_':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/capBottom.png')
                            })
                        )
                    break
                    case '^':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/capTop.png')
                            })
                        )
                    break
                    case '+':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/pipeCross.png')
                            })
                        )
                    break
                    case '5':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                color: 'blue',
                                image: Game.createImage('images/pipeConnectorTop.png')
                            })
                        )
                    break
                    case '6':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                color: 'blue',
                                image: Game.createImage('images/pipeConnectorRight.png')
                            })
                        )
                    break
                    case '7':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                color: 'blue',
                                image: Game.createImage('images/pipeConnectorBottom.png')
                            })
                        )
                    break
                    case '8':
                        Game.boundaries.push(
                            new Game.Boundary({
                                position: {
                                    x: j * Game.Boundary.width,
                                    y: i * Game.Boundary.height
                                },
                                image: Game.createImage('images/pipeConnectorLeft.png')
                            })
                        )
                    break
                    case '.':
                        Game.pellets.push(
                            new Game.Pellet({
                                position: {
                                    x: j * Game.Boundary.width + Game.Boundary.width / 2,
                                    y: i * Game.Boundary.height + Game.Boundary.height / 2
                                }
                            })
                        )
                    break
                    case 'p':
                        Game.powerUps.push(
                            new Game.PowerUp({
                                position: {
                                    x: j * Game.Boundary.width + Game.Boundary.width / 2,
                                    y: i * Game.Boundary.height + Game.Boundary.height / 2
                                }
                            })
                        )
                    break
                }
            })
        })
    },
    Player: class {
        constructor({position, velocity}) {
            this.position = position
            this.velocity = velocity
            this.radius = 15
            this.radians = 0.75
            this.openRate = 0.12
            this.rotation = 0
        }

        draw() {
            Game.gameCanvasContext.save()
            Game.gameCanvasContext.translate(this.position.x, this.position.y)
            Game.gameCanvasContext.rotate(this.rotation)
            Game.gameCanvasContext.translate(-this.position.x, -this.position.y)
            Game.gameCanvasContext.beginPath()
            Game.gameCanvasContext.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians)
            Game.gameCanvasContext.lineTo(this.position.x, this.position.y)
            Game.gameCanvasContext.fillStyle = 'yellow'
            Game.gameCanvasContext.fill()
            Game.gameCanvasContext.closePath()
            Game.gameCanvasContext.restore()
        }

        update() {
            this.draw()
            this.position.x += this.velocity.x
            this.position.y += this.velocity.y

            if (this.radians < 0 || this.radians > 0.75) this.openRate = -this.openRate
            this.radians += this.openRate
        }
    },
    Ghost: class {
        static speed = 4
        constructor({position, velocity, color = 'red'}) {
            this.position = position
            this.velocity = velocity
            this.radius = 15
            this.color = color
            this.prevCollisions = []
            this.speed = 4
            this.scared = false
        }

        draw() {
            Game.gameCanvasContext.beginPath()
            Game.gameCanvasContext.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
            Game.gameCanvasContext.fillStyle = this.scared ? 'blue' : this.color
            Game.gameCanvasContext.fill()
            Game.gameCanvasContext.closePath()
        }

        update() {
            this.draw()
            this.position.x += this.velocity.x
            this.position.y += this.velocity.y
        }
    },
    Pellet: class {
        constructor({position}) {
            this.position = position
            this.radius = 3
        }

        draw() {
            Game.gameCanvasContext.beginPath()
            Game.gameCanvasContext.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
            Game.gameCanvasContext.fillStyle = 'white'
            Game.gameCanvasContext.fill()
            Game.gameCanvasContext.closePath()
        }
    },
    PowerUp: class {
        constructor({position}) {
            this.position = position
            this.radius = 8
        }

        draw() {
            Game.gameCanvasContext.beginPath()
            Game.gameCanvasContext.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
            Game.gameCanvasContext.fillStyle = 'white'
            Game.gameCanvasContext.fill()
            Game.gameCanvasContext.closePath()
        }
    },
    initPlayer: function () {
        Game.player = new Game.Player({
            position: {
                x: Game.Boundary.width + Game.Boundary.width / 2,
                y: Game.Boundary.height + Game.Boundary.height / 2
            },
            velocity: {
                x: 0,
                y: 0
            }
        })
    },
    initGhosts: function () {
        Game.ghosts = [
            new Game.Ghost({
                position: {
                    x: Game.Boundary.width * 6 + Game.Boundary.width / 2,
                    y: Game.Boundary.height + Game.Boundary.height / 2
                },
                velocity: {
                    x: Game.Ghost.speed,
                    y: 0
                }
            }),
            new Game.Ghost({
                position: {
                    x: Game.Boundary.width * 6 + Game.Boundary.width / 2,
                    y: Game.Boundary.height * 3 + Game.Boundary.height / 2
                },
                velocity: {
                    x: Game.Ghost.speed,
                    y: 0
                },
                color: 'pink'
            })
        ]
    },
    /**
     * @description Functions to manage any storage system
     */
    Storage: class{
        /**
         * 
         * @param {String} key 
         * @returns string | false
         */
        static localStorageGet (key) {
            var local = false;
            try {local = window.localStorage.getItem(key);} catch (exception) {}
            return local;
        }
        /**
         * 
         * @param {String} key 
         * @param {String} value 
         * @returns Any | false
         */
        static localStorageSet (key, value) {
            var local = false;
            try {local = window.localStorage.setItem(key, value);} catch (exception) {}
            return local;
        }
    },
    KeyControll: class {
        static mouve = {
            azerty: {
                up: ['ArrowUp', 'z'],
                down: ['ArrowDown', 's'],
                left: ['ArrowLeft', 'q'],
                right: ['ArrowRight', 'd']
            },
            qwerty: {
                up: ['ArrowUp', 'w'],
                down: ['ArrowDown', 's'],
                left: ['ArrowLeft', 'a'],
                right: ['ArrowRight', 'd']
            }
        }

        static getKeyUP () {
            return this.mouve[Game.currentKeyboardType.toLowerCase()].up
        }
        static getKeyLeft () {
            return this.mouve[Game.currentKeyboardType.toLowerCase()].left
        }
        static getKeyDown () {
            return this.mouve[Game.currentKeyboardType.toLowerCase()].down
        }
        static getKeyRight () {
            return this.mouve[Game.currentKeyboardType.toLowerCase()].right
        }
    },
    initKeyControl: function () {
        Game.currentKeyboardType = Game.Storage.localStorageGet('PacmanWebGameKeyboard')
        if (Utils.Functions.empty(Game.currentKeyboardType)) {
            const promptWindow = new Game.PromptWindow()

            let str = ''
            for (let i = 0; i < Game.availableKeyboards.length; i++) {
                const element = Game.availableKeyboards[i];
                str += `<div id="keyboardSelect-${i}" class="keyboardSelectButton title" style="padding:4px;">${element}</div>`
            }

            promptWindow.Prompt('<id ChangeKeyboard><h3 id="keyboardSelectHeader">Select Keyboard</h3>'+
			'<div class="line"></div>' +
			str,
			["cancel"]);

            for (let i in Game.availableKeyboards) {
                const keyboardType = Game.availableKeyboards[i];

                Utils.Functions.AddEvent(Utils.Functions.load('keyboardSelect-'+i), 'click', function(_keyboardType, _PromptWindow) {
                    return function() {
                        Game.Storage.localStorageSet('PacmanWebGameKeyboard', _keyboardType)
                        Game.PAUSE = false
                        _PromptWindow.ClosePrompt()

                        // Reload on sound end, with a timeout fallback so a blocked/failed
                        // audio play (autoplay policy, missing file) can't leave the page hung.
                        let reloaded = false
                        const reload = function () {
                            if (reloaded) return
                            reloaded = true
                            window.location.reload()
                        }
                        Game.Audio.playWaka({ onEnded: reload })
                        setTimeout(reload, 1500)
                    }
                }(keyboardType, promptWindow))
            }
        } else {Game.PAUSE = false}
    },
    initMovementKeys: function () {
        addEventListener('keydown', ({key}) => {
            if (Game.KeyControll.getKeyUP().includes(key)) {
                Game.keys.up.pressed = true
                Game.lastKey = key
            } else if (Game.KeyControll.getKeyLeft().includes(key)) {
                Game.keys.left.pressed = true
                Game.lastKey = key
            } else if (Game.KeyControll.getKeyDown().includes(key)) {
                Game.keys.down.pressed = true
                Game.lastKey = key
            } else if (Game.KeyControll.getKeyRight().includes(key)) {
                Game.keys.right.pressed = true
                Game.lastKey = key
            }
        })

        addEventListener('keyup', ({key}) => {
            if (Game.KeyControll.getKeyUP().includes(key)) {
                Game.keys.up.pressed = false
            } else if (Game.KeyControll.getKeyLeft().includes(key)) {
                Game.keys.left.pressed = false
            } else if (Game.KeyControll.getKeyDown().includes(key)) {
                Game.keys.down.pressed = false
            } else if (Game.KeyControll.getKeyRight().includes(key)) {
                Game.keys.right.pressed = false
            }
        })
    },
    createImage: function (src) {
        const image = new Image();
        image.src = src
        return image
    },
    circleCollidesWithRectangle: function ({circle, rectangle}) {
        const padding = Game.Boundary.width / 2 - circle.radius - 1
        return (circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding &&
            circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding && 
            circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding && 
            circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding)
    },
    animationId: null,
    animate: function () {
        if (Game.PAUSE == true) {return}
        Game.animationId = requestAnimationFrame(Game.animate)
        Game.gameCanvasContext.clearRect(0, 0, Game.gameCanvas.width, Game.gameCanvas.height)

        if (Game.keys.up.pressed && Game.KeyControll.getKeyUP().includes(Game.lastKey)) {
            for (let i = 0; i < Game.boundaries.length; i++) {
                const boundary = Game.boundaries[i]
                if (Game.circleCollidesWithRectangle({circle: {...Game.player, velocity: {x: 0, y: -5}}, rectangle: boundary})) {
                    Game.player.velocity.y = 0
                    break
                } else {
                    Game.player.velocity.y = -5
                }
            }
            
        } else if (Game.keys.left.pressed && Game.KeyControll.getKeyLeft().includes(Game.lastKey)) {
            for (let i = 0; i < Game.boundaries.length; i++) {
                const boundary = Game.boundaries[i]
                if (Game.circleCollidesWithRectangle({circle: {...Game.player, velocity: {x: -5, y: 0}}, rectangle: boundary})) {
                    Game.player.velocity.x = 0
                    break
                } else {
                    Game.player.velocity.x = -5
                }
            }
        } else if (Game.keys.down.pressed && Game.KeyControll.getKeyDown().includes(Game.lastKey)) {
            for (let i = 0; i < Game.boundaries.length; i++) {
                const boundary = Game.boundaries[i]
                if (Game.circleCollidesWithRectangle({circle: {...Game.player, velocity: {x: 0, y: 5}}, rectangle: boundary})) {
                    Game.player.velocity.y = 0
                    break
                } else {
                    Game.player.velocity.y = 5
                }
            }
        } else if (Game.keys.right.pressed && Game.KeyControll.getKeyRight().includes(Game.lastKey)) {
            for (let i = 0; i < Game.boundaries.length; i++) {
                const boundary = Game.boundaries[i]
                if (Game.circleCollidesWithRectangle({circle: {...Game.player, velocity: {x: 5, y: 0}}, rectangle: boundary})) {
                    Game.player.velocity.x = 0
                    break
                } else {
                    Game.player.velocity.x = 5
                }
            }
        }

        //Pelets collision here
        for (let i = (Game.pellets.length - 1); 0 <= i; i--) {
            const pellet = Game.pellets[i];
            pellet.draw()

            if (Math.hypot(pellet.position.x - Game.player.position.x, pellet.position.y - Game.player.position.y) < pellet.radius + Game.player.radius) {
                Game.pellets.splice(i, 1)
                Game.score += 10
                Game.scoreElement.innerHTML = Game.score
                Game.Audio.playWaka()
            }
        }

        // Ghost collision with player
        for (let i = (Game.ghosts.length - 1); 0 <= i; i--) {
            const ghost = Game.ghosts[i];

            if (Math.hypot(ghost.position.x - Game.player.position.x, ghost.position.y - Game.player.position.y) < ghost.radius + Game.player.radius) {
                if (ghost.scared) {
                    Game.ghosts.splice(i, 1)
                    Game.Audio.playEatGhost()
                } else {
                    cancelAnimationFrame(Game.animationId)
                    console.log('you lose')
                    Game.Audio.playEndGame()
                }
            }
        }

        // Win the game
        if (Game.pellets.length === 0) {
            cancelAnimationFrame(Game.animationId)
            console.log('You WIN')
            Game.Audio.playWinGame()
        }

        //PowerUp collision here
        for (let i = (Game.powerUps.length - 1); 0 <= i; i--) {
            const powerUp = Game.powerUps[i];
            powerUp.draw()

            if (Math.hypot(powerUp.position.x - Game.player.position.x, powerUp.position.y - Game.player.position.y) < powerUp.radius + Game.player.radius) {
                Game.powerUps.splice(i, 1)
                Game.Audio.playPowerDot()

                // Make ghost scared
                Game.ghosts.forEach(ghost => {
                    ghost.scared = true
                    setTimeout(() => {
                        ghost.scared = false
                    }, 5000)
                })
            }
        }

        //Boundaries collision here
        Game.boundaries.forEach((boundary) => {
            boundary.draw()

            if (Game.circleCollidesWithRectangle({circle: Game.player, rectangle: boundary})) {
                Game.player.velocity.x = 0
                Game.player.velocity.y = 0
            }
        })

        Game.player.update();

        //Ghost collision here
        Game.ghosts.forEach(ghost => {
            ghost.update()

            const collisions = []
            Game.boundaries.forEach(boundary => {
                if (!collisions.includes('right') && Game.circleCollidesWithRectangle({circle: {...ghost, velocity: {x: ghost.speed, y: 0}}, rectangle: boundary})) {
                    collisions.push('right')
                }
                if (!collisions.includes('left') && Game.circleCollidesWithRectangle({circle: {...ghost, velocity: {x: -ghost.speed, y: 0}}, rectangle: boundary})) {
                    collisions.push('left')
                }
                if (!collisions.includes('up') && Game.circleCollidesWithRectangle({circle: {...ghost, velocity: {x: 0, y: -ghost.speed}}, rectangle: boundary})) {
                    collisions.push('up')
                }
                if (!collisions.includes('down') && Game.circleCollidesWithRectangle({circle: {...ghost, velocity: {x: 0, y: ghost.speed}}, rectangle: boundary})) {
                    collisions.push('down')
                }

            })
            if (collisions.length > ghost.prevCollisions.length) {
                ghost.prevCollisions = collisions
            }
            if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)) {
                if (ghost.velocity.x > 0) ghost.prevCollisions.push('right')
                if (ghost.velocity.x < 0) ghost.prevCollisions.push('left')
                if (ghost.velocity.y < 0) ghost.prevCollisions.push('up')
                if (ghost.velocity.y > 0) ghost.prevCollisions.push('down')

                const pathways = ghost.prevCollisions.filter(collision => {
                    return !collisions.includes(collision)
                })

                const direction = pathways[Math.floor(Math.random() * pathways.length)]

                switch (direction) {
                    case 'down':
                        ghost.velocity.y = ghost.speed
                        ghost.velocity.x = 0
                    break;
                    case 'up':
                        ghost.velocity.y = -ghost.speed
                        ghost.velocity.x = 0
                    break;
                    case 'right':
                        ghost.velocity.y = 0
                        ghost.velocity.x = ghost.speed
                    break;
                    case 'left':
                        ghost.velocity.y = 0
                        ghost.velocity.x = -ghost.speed
                    break;
                }
                ghost.prevCollisions = []
            }
        })

        if (Game.player.velocity.x > 0) Game.player.rotation = 0
        else if (Game.player.velocity.x < 0) Game.player.rotation = Math.PI
        else if (Game.player.velocity.y > 0) Game.player.rotation = Math.PI / 2
        else if (Game.player.velocity.y < 0) Game.player.rotation = Math.PI * 1.5
    },
    promptWindow: null,
    PromptWindow: class {
        darkenL = null
        promptAnchorL = null
        promptWrapL = null
        promptL = null
        promptOn = false
        promptOptionsN = 0
        promptOptionFocus = 0
        promptNoClose = false

        constructor() {
            this.darkenL = Utils.Functions.load('darken');
            Utils.Functions.AddEvent(this.darkenL, 'click', function(data) {return function(event) {
                if (!data.promptNoClose) {
                    data._this.ClosePrompt();
                }
            };}({
                promptNoClose: this.promptNoClose,
                _this: this
            }));
            this.promptAnchorL = Utils.Functions.load('promptAnchor');
            this.promptWrapL = Utils.Functions.load('prompt');
            this.promptL = Utils.Functions.load('promptContent');
            this.promptOn = false;
            this.promptOptionsN = 0;
            this.promptOptionFocus = 0;
            this.promptNoClose = false;
        }

        Prompt(content, options, style) {
            this.promptNoClose = false;
            if (!Utils.Functions.empty(style)) {this.promptWrapL.className = 'framed ' + style;} else {this.promptWrapL.className = 'framed';}

            let str = content;
            if (str.indexOf('<id ') == 0) {
                const id = str.substring(4, str.indexOf('>'));
                str = str.substring(str.indexOf('>') + 1);
                str = '<div id="promptContent' + id + '">' + str + '</div>';
            }
            if (str.includes('<noClose>')) {
				str = str.replace('<noClose>', '');
				this.promptNoClose = true;
			}

            let opts = '';
			this.promptOptionsN = 0;
			for (let i = 0; i < options.length; i++) {
				if (options[i] == 'br') //just a linebreak
				{opts += '<br>';}
				else {
					if (typeof options[i] == 'string') {options[i] = [options[i], 'const p = new Game.PromptWindow(); p.ClosePrompt();'];}
					else if (!options[i][1]) {options[i] = [options[i][0], 'const p = new Game.PromptWindow(); p.ClosePrompt();', options[i][2]];}
					else {options[i][1] = 'Game.Audio.playWaka();' + options[i][1];}

					options[i][1] = options[i][1].replace(/'/g, '&#39;').replace(/"/g, '&#34;');
					opts += '<a id="promptOption' + i + '" class="option" ' + (options[i][2] ? 'style="' + options[i][2] + '" ' : '') + '' + 'onclick="' + options[i][1] + '">' + options[i][0] + '</a>';
					this.promptOptionsN++;
				}
			}
            this.promptL.innerHTML = str + '<div class="optionBox">' + opts + '</div>';
            this.promptAnchorL.style.display = 'block';
            this.darkenL.style.display = 'block';
            this.promptL.focus();
            this.promptOn = true;
            this.promptOptionFocus = 0;
            this.FocusPromptOption(0);
            this.UpdatePrompt();
			if (!this.promptNoClose) {Utils.Functions.load('promptClose').style.display = 'block';} else {Utils.Functions.load('promptClose').style.display = 'none';}
        }

        UpdatePrompt() {
			this.promptAnchorL.style.top = Math.floor((window.innerHeight - this.promptWrapL.offsetHeight) / (16 - 2)) + 'px';
		}

        ConfirmPrompt() {
			if (!Utils.Functions.empty(this.promptOn) && Utils.Functions.load('promptOption' + this.promptOptionFocus) && 
                Utils.Functions.load('promptOption' + this.promptOptionFocus).style.display != 'none') {
                Utils.Functions.FireEvent(Utils.Functions.load('promptOption' + this.promptOptionFocus), 'click');
            }
		}
        ClosePrompt() {
			if (!this.promptOn) return false;
			this.promptAnchorL.style.display = 'none';
			this.darkenL.style.display = 'none';
			this.promptOn = 0;
			this.promptOptionFocus = 0;
			this.promptOptionsN = 0;
			this.promptNoClose = false;
		}
        FocusPromptOption(dir, tryN) {
			let id = this.promptOptionFocus + dir;
			if (id < 0) {id = this.promptOptionsN - 1;}
			if (id >= this.promptOptionsN) {id = 0;}

            const promptOptionId = Utils.Functions.load('promptOption' + id);
			while (id >= 0 && id < this.promptOptionsN && (!Utils.Functions.empty(promptOptionId) || promptOptionId.style.display == 'none')) {
                id += (dir || 1);
            }
			if (Utils.Functions.load('promptOption' + id) && Utils.Functions.load('promptOption' + id).style.display!='none') {
				if (Utils.Functions.load('promptOption' + this.promptOptionFocus) != null) {
                    Utils.Functions.load('promptOption' + this.promptOptionFocus).classList.remove('focused');
                }
				this.promptOptionFocus = id;
				if (Utils.Functions.load('promptOption' + this.promptOptionFocus) != null) {
                    Utils.Functions.load('promptOption' + this.promptOptionFocus).classList.add('focused');
                }
			}
			else if (!Utils.Functions.empty(tryN) && dir != 0) {this.promptOptionFocus = id; this.FocusPromptOption(dir, 1);}
		}
    }
}


window.onload = (e) => {
    if (!Game.READY) {
        Game.init()
    }
}
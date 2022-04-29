/*
Snake game tutorial used: https://www.youtube.com/watch?v=7Azlj0f9vas
*/

import NN from "./nn.js";
import Vector from "./vector.js";

// The logic for the snake game.
export default class Snake {
    constructor(starveTime = 200, scorePerMove = 1, scorePerApple = 800, scorePerMoveTowardApple = 5) {
        //snake variables
        this.snakeVariables = {
            tileCount: 20,
            tileSize: .9,
            headPos: new Vector(10, 10),
            snakeParts: [],
            tailLength: 2
        };

        //snake apple variables
        this.apple = this.randomCoord();
        this.timeWithoutApple = 0;
        this.starveTime = starveTime;
        this.scoreSinceLastApple = 0;

        this.direction = new Vector();

        //snake part class
        const rand = Math.random();
        if (rand < .25) {
            this.direction.set(1, 0);
        } else if (rand < .5) {
            this.direction.set(-1, 0);
        } else if (rand < .75) {
            this.direction.set(0, 1);
        } else {
            this.direction.set(0, -1);
        }

        this.nn = new NN(
            //["Head X", "Head Y", "Up", "Down", "Left", "Right", "Apple Up", "Apple Down", "Apple Left", "Apple Right"],
            //["Head X", "Head Y", "Direction X", "Direction Y", "Apple Dist X", "Apple Dist Y"],
            ["Up", "Down", "Left", "Right", "Wall Up", "Wall Down", "Wall Left", "Wall Right", "Apple Up", "Apple Down", "Apple Left", "Apple Right"],
            [16, 16],
            ["Up", "Down", "Left", "Right"]);
        this.nn.mutationRate = .1;

        this.id = 0;

        this.alive = true;
        this.score = 0;
        this.fitness = 0;

        this.applesCollected = 0;

        this.lifetime = 0;

        // Variables for scoring
        this.scorePerMove = scorePerMove;
        this.scorePerMoveTowardApple = scorePerMoveTowardApple;
        this.scorePerApple = scorePerApple;
    }

    copy() {
        const clone = new Snake(this.starveTime, this.scorePerMove, this.scorePerApple);
        clone.nn = this.nn.copy();
        return clone;
    }

    mutate() {
        this.nn.mutate();
    }

    update() {
        if (!this.alive)
            return;

        // Get control from neural network
        // const controls = this.nn.feedForward([
        //     this.apple.x / this.snakeVariables.tileCount, this.apple.y / this.snakeVariables.tileCount,
        //     1 - (this.snakeVariables.headPos.x / this.snakeVariables.tileCount / 2), 1 - (this.snakeVariables.headPos.y / this.snakeVariables.tileCount / 2),
        //     1 - ((this.snakeVariables.tileCount - 1 - this.snakeVariables.headPos.x) / this.snakeVariables.tileCount / 2), 1 - ((this.snakeVariables.tileCount - 1 - this.snakeVariables.headPos.y) / this.snakeVariables.tileCount / 2),
        //     this.direction.x, this.direction.y]);

        let wallDistUp = this.snakeVariables.headPos.y + 1;
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            if (this.snakeVariables.snakeParts[i].x == this.snakeVariables.headPos.x &&
                this.snakeVariables.snakeParts[i].y < this.snakeVariables.headPos.y) {
                const dist = this.snakeVariables.headPos.y - this.snakeVariables.snakeParts[i].y;
                if (dist < wallDistUp)
                    wallDistUp = dist;
            }
        }

        let wallDistDown = this.snakeVariables.tileCount - this.snakeVariables.headPos.y;
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            if (this.snakeVariables.snakeParts[i].x == this.snakeVariables.headPos.x &&
                this.snakeVariables.snakeParts[i].y > this.snakeVariables.headPos.y) {
                const dist = this.snakeVariables.snakeParts[i].y - this.snakeVariables.headPos.y;
                if (dist < wallDistDown)
                    wallDistDown = dist;
            }
        }

        let wallDistLeft = this.snakeVariables.headPos.x + 1;
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            if (this.snakeVariables.snakeParts[i].y == this.snakeVariables.headPos.y &&
                this.snakeVariables.snakeParts[i].x < this.snakeVariables.headPos.x) {
                const dist = this.snakeVariables.headPos.x - this.snakeVariables.snakeParts[i].x;
                if (dist < wallDistLeft)
                    wallDistLeft = dist;
            }
        }

        let wallDistRight = this.snakeVariables.tileCount - this.snakeVariables.headPos.x;
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            if (this.snakeVariables.snakeParts[i].y == this.snakeVariables.headPos.y &&
                this.snakeVariables.snakeParts[i].x > this.snakeVariables.headPos.x) {
                const dist = this.snakeVariables.snakeParts[i].x - this.snakeVariables.headPos.x;
                if (dist < wallDistRight)
                    wallDistRight = dist;
            }
        }

        const div = this.snakeVariables.tileCount - 1;

        // const controls = this.nn.feedForward([
        //     this.snakeVariables.headPos.x / div,
        //     this.snakeVariables.headPos.y / div,

        //     // this.apple.x / div,
        //     // this.apple.y / div,

        //     // this.direction.y == 1 ? 1 : 0,
        //     // this.direction.y == -1 ? 1 : 0,
        //     // this.direction.x == -1 ? 1 : 0,
        //     // this.direction.x == 1 ? 1 : 0,
        //     this.direction.x,
        //     this.direction.y,

        //     // this.apple.y < this.snakeVariables.headPos.y ? 1 : 0,
        //     // this.apple.y > this.snakeVariables.headPos.y ? 1 : 0,
        //     // this.apple.x < this.snakeVariables.headPos.x ? 1 : 0,
        //     // this.apple.x > this.snakeVariables.headPos.x ? 1 : 0,

        //     (this.apple.x - this.snakeVariables.headPos.x) / div,
        //     (this.apple.y - this.snakeVariables.headPos.y) / div,

        //     // wallDistUp / div,
        //     // wallDistDown / div,
        //     // wallDistLeft / div,
        //     // wallDistRight / div
        // ]);

        // const controls = this.nn.feedForward([
        //     (this.snakeVariables.headPos.x / div) * 2 - 1, (this.snakeVariables.headPos.y / div) * 2 - 1,
        //     this.direction.x, this.direction.y,
        //     this.apple.x - this.snakeVariables.headPos.x, this.apple.y - this.snakeVariables.headPos.y
        // ]);

        const controls = this.nn.feedForward([
            this.direction.y == 1 ? 1 : 0,
            this.direction.y == -1 ? 1 : 0,
            this.direction.x == -1 ? 1 : 0,
            this.direction.x == 1 ? 1 : 0,
            
            wallDistUp < 2 ? 1 : 0,
            wallDistDown < 2 ? 1 : 0,
            wallDistLeft < 2 ? 1 : 0,
            wallDistRight < 2 ? 1 : 0,

            this.apple.y < this.snakeVariables.headPos.y ? 1 : 0,
            this.apple.y > this.snakeVariables.headPos.y ? 0 : 1,
            this.apple.x < this.snakeVariables.headPos.x ? 1 : 0,
            this.apple.x > this.snakeVariables.headPos.x ? 0 : 1
            // Math.max(0, this.snakeVariables.headPos.y - this.apple.y) / div,
            // Math.max(0, this.apple.y - this.snakeVariables.headPos.y) / div,
            // Math.max(0, this.snakeVariables.headPos.x - this.apple.x) / div,
            // Math.max(0, this.apple.x - this.snakeVariables.headPos.x) / div,
        ]);

        //console.log(controls);
        // Set direction from control
        let dir = 0;
        for (let i = 0; i < 4; i++) {
            if (controls[i] > controls[dir])
                dir = i;
        }

        switch (dir) {
            case 0:
                this.passInput("UP");
                break;
            case 1:
                this.passInput("DOWN");
                break;
            case 2:
                this.passInput("LEFT");
                break;
            case 3:
                this.passInput("RIGHT");
                break;
        }

        this.timeWithoutApple++;

        this.changeSnakePosition();
        this.checkAppleCollision();
        if (this.isGameOver())
            this.alive = false;
    }

    // Get a random coordinate in the board that is not touching the snake.
    randomCoord() {
        const rand = () => {
            return Math.floor(Math.random() * this.snakeVariables.tileCount);
        }
        let coord;
        do {
            coord = new Vector(rand(), rand());
        } while (this.snakeVariables.headPos.equals(coord) || this.snakeVariables.snakeParts.map((el) => el.equals(coord)).includes(true));
        return coord;
    }

    //check if gameOver
    isGameOver() {
        // starvation
        if (this.timeWithoutApple > this.starveTime && this.starveTime > 0) {
            this.score -= this.scoreSinceLastApple;
            if (this.score < 1)
                this.score = 1;
            return true;
        }

        //walls
        if (this.snakeVariables.headPos.x < 0) {
            return true;
        }
        if (this.snakeVariables.headPos.x >= this.snakeVariables.tileCount) {
            return true;
        }
        if (this.snakeVariables.headPos.y < 0) {
            return true;
        }
        if (this.snakeVariables.headPos.y >= this.snakeVariables.tileCount) {
            return true;
        }

        //snake Body
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            let part = this.snakeVariables.snakeParts[i];
            if (part.equals(this.snakeVariables.headPos)) {
                return true;
            }
        }
    }

    //calculate snake movement
    changeSnakePosition() {
        const { snakeParts, headPos, tailLength } = this.snakeVariables;

        //put an item at the end of the list next to the head
        //then remove the furthest item from the snake parts if it has more than our tail size 
        this.snakeVariables.snakeParts.push(new Vector(headPos.x, headPos.y));
        if (snakeParts.length > tailLength) {
            this.snakeVariables.snakeParts.shift();
        }

        const prevDistToApple = this.snakeVariables.headPos.distance(this.apple);

        this.snakeVariables.headPos.x += this.direction.x;
        this.snakeVariables.headPos.y += this.direction.y;

        this.lifetime++;
        this.score += this.scorePerMove + this.lifetime / 25;
        this.scoreSinceLastApple += this.scorePerMove;

        this.score += (1 - this.snakeVariables.headPos.distance(this.apple) / this.snakeVariables.tileCount) * 3;
        this.scoreSinceLastApple += (1 - this.snakeVariables.headPos.distance(this.apple) / this.snakeVariables.tileCount) * 3;

        if (this.snakeVariables.headPos.distance(this.apple) < prevDistToApple) {
            this.score += this.scorePerMoveTowardApple;
            this.scoreSinceLastApple += this.scorePerMoveTowardApple;
        } else {
            this.score -= this.scorePerMoveTowardApple;
            this.scoreSinceLastApple -= this.scorePerMoveTowardApple;
        }

        if (this.score < 1)
            this.score = 1;
    }

    //check if an apple is eaten
    checkAppleCollision() {
        //add new random apple if the previous is eaten, and increase tail length and score
        if (this.snakeVariables.headPos.equals(this.apple)) {
            this.apple = this.randomCoord();
            this.snakeVariables.tailLength++;
            this.score += this.scorePerApple;
            this.scoreSinceLastApple = 0;
            this.applesCollected++;
            this.timeWithoutApple = 0;
        }
    }

    //movement controls through string input
    passInput(direction) {
        if (direction == "UP") {
            if (this.direction.y == 1) return;
            this.direction.set(0, -1);
        }

        //down
        if (direction == "DOWN") {
            if (this.direction.y == -1) return;
            this.direction.set(0, 1);
        }

        //left
        if (direction == "LEFT") {
            if (this.direction.x == 1) return;
            this.direction.set(-1, 0);
        }

        //right
        if (direction == "RIGHT") {
            if (this.direction.x == -1) return;
            this.direction.set(1, 0);
        }
    }
}
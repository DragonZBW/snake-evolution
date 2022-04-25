/*
Snake game tutorial used: https://www.youtube.com/watch?v=7Azlj0f9vas
*/

import NN from "./nn.js";
import Vector from "./vector.js";

// The logic for the snake game.
export default class Snake {
    constructor(starveTime = 200) {
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

        this.nn = new NN(8, 32, 1);
        this.nn.mutationRate = .1;

        this.alive = true;
        this.score = 0;
        this.fitness = 0;

        this.applesCollected = 0;

        this.lifetime = 0;
    }

    copy() {
        const clone = new Snake();
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
        
        const controls = this.nn.feedForward([
            this.snakeVariables.headPos.x / this.snakeVariables.tileCount, this.snakeVariables.headPos.y / this.snakeVariables.tileCount,
            this.apple.x / this.snakeVariables.tileCount, this.apple.y / this.snakeVariables.tileCount,
            this.direction.x, this.direction.y,
            this.apple.x - this.snakeVariables.headPos.x, this.apple.y - this.snakeVariables.headPos.y
        ]);

        //console.log(controls);
        // Set direction from control
        let dir = 0;
        if (controls[0] < .25)
            dir = 0;
        else if (controls[0] < .5)
            dir = 1;
        else if (controls[0] < .75)
            dir = 2;
        else
            dir = 3;
            
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
        if (this.timeWithoutApple > this.starveTime) {
            this.score -= this.starveTime;
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

        this.snakeVariables.headPos.x += this.direction.x;
        this.snakeVariables.headPos.y += this.direction.y;

        this.lifetime++;
        this.score += 1 + this.lifetime / 25;
        this.score += (1 - this.snakeVariables.headPos.distance(this.apple) / this.snakeVariables.tileCount) * 3;
        
        if (this.apple.x == this.snakeVariables.headPos.x) {
            if ((this.apple.y > this.snakeVariables.headPos.y && this.direction.y == 1) ||
                (this.apple.y < this.snakeVariables.headPos.y && this.direction.y == -1))
                this.score += 5;
        }
        else if (this.apple.y == this.snakeVariables.headPos.y) {
            if ((this.apple.x > this.snakeVariables.headPos.x && this.direction.x == 1) ||
                (this.apple.x < this.snakeVariables.headPos.x && this.direction.x == -1))
                this.score += 5;
        }
    }

    //check if an apple is eaten
    checkAppleCollision() {
        //add new random apple if the previous is eaten, and increase tail length and score
        if (this.snakeVariables.headPos.equals(this.apple)) {
            this.apple = this.randomCoord();
            this.snakeVariables.tailLength++;
            this.score += 800;
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
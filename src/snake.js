/*
Snake game tutorial used: https://www.youtube.com/watch?v=7Azlj0f9vas
*/

const template = document.createElement("template");
template.innerHTML = `
<canvas width=400 height=400></canvas>
`;

class SnakePart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Snake extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.board = this.shadowRoot.querySelector("canvas");
        this.board.width = 400;
        this.board.height = 400;
        this.boardCtx = this.board.getContext("2d");
        this.direction;

        //snake variables
        this.snakeVariables = {
            speed: 7,
            tileCount: 20,
            tileSize: 10,
            headX: 10,
            headY: 10,
            snakeParts: [],
            tailLength: 2
        }

        //snake apple variables
        this.snakeAppleVariables = {
            appleX: 5,
            appleY: 5
        }

        //snake part class
        this.snakeMiscVariables = {
            xVelocity: 0,
            yVelocity: 0,
            score: 0
        }

        this.clearScreen = this.clearScreen.bind(this);
        this.checkAppleCollision = this.checkAppleCollision.bind(this);
        this.drawApple = this.drawApple.bind(this);
        this.drawSnake = this.drawSnake.bind(this);
        this.drawScore = this.drawScore.bind(this);
        this.changeSnakePosition = this.changeSnakePosition.bind(this);
        this.drawGame = this.drawGame.bind(this);
    }
    

    connectedCallback() {
        this.render()
    }

    //game loop
    drawGame() {
        this.passInput(this.direction);
        this.changeSnakePosition();
        let result = this.isGameOver();
        if (result) {
            return;
        }
        this.clearScreen();
        this.checkAppleCollision();
        this.drawApple();
        this.drawSnake();
        this.drawScore();
        setTimeout(this.drawGame, 1000 / this.snakeVariables.speed);
    }

    //check if gameOver
    isGameOver() {
        let gameOver = false;

        //stop auto kill on start
        if (this.snakeMiscVariables.yVelocity === 0 && this.snakeMiscVariables.xVelocity === 0) {
            return false;
        }

        //walls
        if (this.snakeVariables.headX < 0) {
            gameOver = true;
        }
        else if (this.snakeVariables.headX === this.snakeVariables.tileCount) {
            gameOver = true;
        }
        else if (this.snakeVariables.headY < 0) {
            gameOver = true;
        }
        else if (this.snakeVariables.headY === this.snakeVariables.tileCount) {
            gameOver = true;
        }

        //snake Body
        for (let i = 0; i < this.snakeVariables.snakeParts.length; i++) {
            let part = this.snakeVariables.snakeParts[i];
            if (part.x === this.snakeVariables.headX && part.y === this.snakeVariables.headY) {
                gameOver = true;
                break;
            }
        }

        //game over text
        if (gameOver) {
            this.boardCtx.fillStyle = "white";
            this.boardCtx.font = "50px Verdana";
            this.boardCtx.fillText("Game Over!", this.board.width / 6.5, this.board.height / 2);
        }

        return gameOver;
    }

    //calculate snake movement
    changeSnakePosition() {
        this.snakeVariables.headX = this.snakeVariables.headX + this.snakeMiscVariables.xVelocity;
        this.snakeVariables.headY = this.snakeVariables.headY + this.snakeMiscVariables.yVelocity;
    }

    //draws the score to the screen
    drawScore() {
        this.boardCtx.fillStyle = "white";
        this.boardCtx.font = "10px Verdana";
        this.boardCtx.fillText("Score " + this.snakeMiscVariables.score, this.board.width - 50, 10);
    }

    //clear screen
    clearScreen() {
        this.boardCtx.fillStyle = "black";
        this.boardCtx.fillRect(0, 0, this.board.width, this.board.height);
    }

    //draw the snake
    drawSnake() {
        const {snakeParts, headX, headY, tailLength, tileCount, tileSize} = this.snakeVariables

        //add a snake part after collecting a fruit
        this.boardCtx.fillStyle = "red";
        for (let i = 0; i < snakeParts.length; i++) {
            let part = snakeParts[i];
            this.boardCtx.fillRect(part.x * tileCount, part.y * tileCount, tileSize, tileSize);
        }

        //put an item at the end of the list next to the head
        //then remove the furthest item from the snake parts if it has more than our tail size 
        this.snakeVariables.snakeParts.push(new SnakePart(headX, headY));
        if (snakeParts.length > tailLength) {
            this.snakeVariables.snakeParts.shift();
        }

        //snake head piece
        this.boardCtx.fillRect(headX * tileCount, headY * tileCount, tileSize, tileSize);
    }

    //draw apple
    drawApple() {
        this.boardCtx.fillStyle = "green";
        this.boardCtx.fillRect(this.snakeAppleVariables.appleX * this.snakeVariables.tileCount, this.snakeAppleVariables.appleY * this.snakeVariables.tileCount, this.snakeVariables.tileSize, this.snakeVariables.tileSize);
    }

    //check if an apple is eaten
    checkAppleCollision() {
        let {appleX, appleY} = this.snakeAppleVariables
        let {headX, headY, tileCount} = this.snakeVariables
        //add new random apple if the previous is eaten, and increase tail length and score
        if (appleX === headX && appleY === headY) {
            this.snakeAppleVariables.appleX = Math.floor(Math.random() * tileCount);
            this.snakeAppleVariables.appleY = Math.floor(Math.random() * tileCount);
            this.snakeVariables.tailLength++;
            this.snakeMiscVariables.score++;
        }
    }
    
    //movement controls through string input
    passInput(direction){
        if (direction == "UP") {
            if (this.snakeMiscVariables.yVelocity == 1) return;
            this.snakeMiscVariables.yVelocity = -1;
            this.snakeMiscVariables.xVelocity = 0;
        }

        //down
        if (direction == "DOWN") {
            if (this.snakeMiscVariables.yVelocity == -1) return;
            this.snakeMiscVariables.yVelocity = 1;
            this.snakeMiscVariables.xVelocity = 0;
        }

        //left
        if (direction == "LEFT") {
            if (this.snakeMiscVariables.xVelocity == 1) return;
            this.snakeMiscVariables.yVelocity = 0;
            this.snakeMiscVariables.xVelocity = -1;
        }

        //right
        if (direction == "RIGHT") {
            if (this.snakeMiscVariables.xVelocity == -1) return;
            this.snakeMiscVariables.yVelocity = 0;
            this.snakeMiscVariables. xVelocity = 1;
        }
    }

    render() {
        this.drawGame();
    }
}

customElements.define("snake-display", Snake);

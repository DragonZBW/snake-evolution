/*
Snake game tutorial used: https://www.youtube.com/watch?v=7Azlj0f9vas
*/

const template = document.createElement("template");
template.innerHTML = `
<style>
canvas {
    display: block;
    width: 100%;
}
</style>
<canvas width=400 height=400></canvas>
`;

// Displays the snake game
class SnakeDisplay extends HTMLElement {
    // Construct the display
    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.board = this.shadowRoot.querySelector("canvas");
        this.board.width = 400;
        this.board.height = 400;
        this.boardCtx = this.board.getContext("2d");

        this.logic;
    }

    // Set the board's size
    setWidth(width) {
        this.board.width = width;
        this.board.height = width;
    }

    //check if gameOver and draw game over text
    drawGameOver() {
        //game over text
        if (!this.logic.alive) {
            this.boardCtx.fillStyle = "white";
            this.boardCtx.font = (this.board.width / 8) + "px Verdana";
            this.boardCtx.fillText("Game Over!", this.board.width / 6.5, this.board.height / 2);
        }
    }

    //draws the score to the screen
    drawScore() {
        this.boardCtx.save();
        this.boardCtx.fillStyle = "white";
        this.boardCtx.font = (this.board.width / 30) + "px Verdana";
        this.boardCtx.textBaseline = "top";
        this.boardCtx.textAlign = "left";
        this.boardCtx.fillText("ID " + this.logic.id, this.board.width * .025, this.board.height * .025);
        this.boardCtx.textAlign = "right";
        this.boardCtx.fillText("Score " + Math.floor(this.logic.score), this.board.width * .975, this.board.height * .025);
        this.boardCtx.fillText(this.logic.applesCollected + " Apples", this.board.width * .975, this.board.height * .025 + this.board.width / 30 + 2);
        this.boardCtx.restore();
    }

    //clear screen
    clearScreen() {
        this.boardCtx.fillStyle = "#222";
        this.boardCtx.save();
        this.boardCtx.beginPath();
        this.boardCtx.rect(0, 0, this.board.width, this.board.height);
        this.boardCtx.fill();
        this.boardCtx.closePath();
        this.boardCtx.restore();
    }

    //draw the snake
    drawSnake() {
        const { snakeParts, headPos, tailLength, tileCount, tileSize } = this.logic.snakeVariables;

        const tileSizePixels = this.board.width / tileCount * tileSize;

        //add a snake part after collecting a fruit
        this.boardCtx.fillStyle = "red";
        for (let i = 0; i < snakeParts.length; i++) {
            let part = snakeParts[i];
            this.boardCtx.save();
            this.boardCtx.beginPath();
            this.boardCtx.rect(part.x * this.board.width / tileCount, part.y * this.board.height / tileCount, tileSizePixels, tileSizePixels);
            this.boardCtx.fill();
            this.boardCtx.closePath();
            this.boardCtx.restore();
        }

        //snake head piece
        this.boardCtx.save();
        this.boardCtx.beginPath();
        this.boardCtx.rect(headPos.x * this.board.width / tileCount, headPos.y * this.board.height / tileCount, tileSizePixels, tileSizePixels);
        this.boardCtx.fill();
        this.boardCtx.closePath();
        this.boardCtx.restore();
    }

    //draw apple
    drawApple() {
        const tileSizePixels = this.board.width / this.logic.snakeVariables.tileCount * this.logic.snakeVariables.tileSize;
        this.boardCtx.save();
        this.boardCtx.fillStyle = "green";
        this.boardCtx.beginPath();
        this.boardCtx.rect(this.logic.apple.x * this.board.width / this.logic.snakeVariables.tileCount, this.logic.apple.y * this.board.height / this.logic.snakeVariables.tileCount, tileSizePixels, tileSizePixels);
        this.boardCtx.fill();
        this.boardCtx.closePath();
        this.boardCtx.restore();
    }

    // draw everything
    render() {
        this.clearScreen();
        this.drawApple();
        this.drawSnake();
        this.drawScore();
        this.drawGameOver();
    }
}

customElements.define("snake-display", SnakeDisplay);

import { NN, NodeTypes } from "./nn.js";
import Vector from "./vector.js";

const template = document.createElement("template");
template.innerHTML = `
<canvas width=400 height=400></canvas>
`;

// A canvas that will display a visualization of the xor problem.
// Visualization based on https://www.youtube.com/watch?v=188B6k_F9jU
class XOR extends HTMLElement {
    // Construct the display. Attaches shadow DOM and initializes member variables.
    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.canvas = this.shadowRoot.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.nn = undefined;
    }

    // Called when the element is attached to the DOM. 
    connectedCallback() {
        // Render once when added to the document
        this.render();
    }

    // Called when the element is detached from the DOM. Removes all callbacks.
    disconnectedCallback() {
    }

    // Render the canvas and everything in it. This will display the current state of the neural network.
    // Currently only renders a black square for testing purposes.
    render() {
        this.ctx.save();

        // Fill background
        this.ctx.fillStyle = "#E9EAED";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.nn) {
            this.ctx.restore();
            return;
        }
        
        // Visualize xor
        const pixelSize = 10;
        const cols = this.canvas.width / pixelSize;
        const rows = this.canvas.height / pixelSize;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const inputs = {
                    "IN 1": i / cols,
                    "IN 2": j / rows,
                    "BIAS 1": 1
                }
                const output = this.nn.process(inputs)["OUT 1"];
                this.ctx.fillStyle = `rgba(0,0,0,${output})`;
                this.ctx.strokeStyle = `rgba(0,0,0,.25)`;
                this.ctx.lineWidth = .5;
                this.ctx.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
                this.ctx.strokeRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
            }
        }

        this.ctx.restore();
    }
}

// Define the element
customElements.define("xor-display", XOR);
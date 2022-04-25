import NN from "./nn.js";

const template = document.createElement("template");
template.innerHTML = `
<canvas width=400 height=400></canvas>
`;

const trainingData = [
    {
        inputs: [0, 1],
        targets: [1]
    },
    {
        inputs: [1, 0],
        targets: [1]
    },
    {
        inputs: [0, 0],
        targets: [0]
    },
    {
        inputs: [1, 1],
        targets: [0]
    }
];

// A canvas that will display a visualization of the xor problem.
// Visualization based on https://www.youtube.com/watch?v=188B6k_F9jU
class XORDisplay extends HTMLElement {
    // Construct the display. Attaches shadow DOM and initializes member variables.
    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.canvas = this.shadowRoot.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.logic;
    }

    // Called when the element is attached to the DOM. 
    connectedCallback() {
        // Render once when added to the document
        this.render();
    }

    // Called when the element is detached from the DOM. Removes all callbacks.
    disconnectedCallback() {
    }

    render() {
        this.ctx.save();

        // Fill background
        this.ctx.fillStyle = "#E9EAED";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.logic) {
            this.ctx.restore();
            return;
        }
        
        // Visualize xor
        const pixelWidth = 10;
        const cols = this.canvas.width / pixelWidth;
        const rows = this.canvas.height / pixelWidth;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const output = this.logic.guess(i / cols, j / rows);
                if (output == undefined)
                    this.ctx.fillStyle = "red";
                else
                    this.ctx.fillStyle = `rgba(0,0,0,${output})`;
                this.ctx.strokeStyle = `rgba(0,0,0,.25)`;
                this.ctx.lineWidth = .5;
                this.ctx.fillRect(i * pixelWidth, j * pixelWidth, pixelWidth, pixelWidth);
                this.ctx.strokeRect(i * pixelWidth, j * pixelWidth, pixelWidth, pixelWidth);
            }
        }

        this.ctx.restore();
    }
}

// Define the element
customElements.define("xor-display", XORDisplay);
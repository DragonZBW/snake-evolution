import Vector from "./vector.js";

const template = document.createElement("template");
template.innerHTML = `
<canvas width=400 height=400></canvas>
`;

// A canvas that will display a visualization of a neural network.
class NNDisplay extends HTMLElement {
    // Construct the display. Attaches shadow DOM and initializes member variables.
    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.canvas = this.shadowRoot.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.nn = null;

        this.dragging = false;
        this.prevMousePos = new Vector();

        this.camPos = new Vector();
    }

    // Called when the element is attached to the DOM. Connects callbacks for scrolling the view by dragging.
    connectedCallback() {
        this.canvas.onmousedown = (e) => {
            const pos = this.getRelativeMousePos(e.pageX, e.pageY);
            this.prevMousePos = pos;
            this.dragging = true;
        };
        this.canvas.onmouseup = (e) => {
            this.dragging = false;
        };
        this.canvas.onmousemove = (e) => {
            if (!this.dragging)
                return;
            
            const pos = this.getRelativeMousePos(e.pageX, e.pageY);
            const mouseDelta = pos.minus(this.prevMousePos);
            this.prevMousePos = pos.copy();

            this.camPos = this.camPos.minus(mouseDelta);
            this.render();
        };

        // Render once when added to the document
        this.render();
    }

    // Called when the element is detached from the DOM. Removes all callbacks.
    disconnectedCallback() {
        this.canvas.onmousedown = null;
        this.canvas.onmouseup = null;
        this.canvas.onmousemove = null;
    }

    // Helper function that gets the mouse position relative to the upper left corner of the canvas.
    getRelativeMousePos(x, y) {
        return new Vector(
            x - this.canvas.offsetLeft,
            y - this.canvas.offsetTop
        );
    }

    // Render the canvas and everything in it. This will display the current state of the neural network.
    // Currently only renders a black square for testing purposes.
    render() {
        console.log(this.camPos);
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(-this.camPos.x, -this.camPos.y, 10, 10);
    }
}

// Define the element
customElements.define("nn-display", NNDisplay);
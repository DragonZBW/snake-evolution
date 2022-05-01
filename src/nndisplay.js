import "./nn.js";
import { lerp } from "./utils.js";
import Vector from "./vector.js";

const template = document.createElement("template");
template.innerHTML = `
<style>
canvas {
    display: block;
    width: 100%;
}
</style>
<canvas width=800 height=400></canvas>
`;

const xSpacing = 100;
const ySpacing = 20;

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
        this.camZoom = 1;
    }

    // Called when the element is attached to the DOM. 
    // Connects callbacks for scrolling the view by dragging and zooming by scrolling.
    connectedCallback() {
        // Allow movement of the camera position by click-dragging the canvas
        this.canvas.onmousedown = (e) => {
            // ignore right click
            if (e.button == 2)
                return;
            // get mouse position and start dragging
            const pos = this.getRelativeMousePos(e.pageX, e.pageY);
            this.prevMousePos = pos;
            this.dragging = true;
        };
        this.canvas.onmouseup = (e) => {
            this.dragging = false;
        };
        this.canvas.onmouseout = (e) => {
            this.dragging = false;
        };
        this.canvas.onmousemove = (e) => {
            if (!this.dragging)
                return;

            const pos = this.getRelativeMousePos(e.pageX, e.pageY);
            const mouseDelta = pos.minus(this.prevMousePos);
            this.prevMousePos = pos.copy();

            this.camPos = this.camPos.minus(mouseDelta);
            // Clamp cam position
            if (this.camPos.x < -this.canvas.width / 2)
                this.camPos.x = -this.canvas.width / 2;
            else if (this.camPos.x > this.canvas.width / 2)
                this.camPos.x = this.canvas.width / 2;
            if (this.camPos.y < -this.canvas.height / 2)
                this.camPos.y = -this.canvas.height / 2;
            else if (this.camPos.y > this.canvas.height / 2)
                this.camPos.y = this.canvas.height / 2;
            this.render();
        };
        // Allow zooming in/out using mouse wheel
        this.canvas.onwheel = (e) => {
            // Scrolling up zooms out, scrolling down zooms in
            this.camZoom += e.deltaY * .005;
            // Clamp zoom between half and double
            if (this.camZoom < 0.5)
                this.camZoom = .5;
            else if (this.camZoom > 2)
                this.camZoom = 2

            this.render();
            // Prevent this event from scrolling the window
            e.preventDefault();
        };

        // Render once when added to the document
        this.render();
    }

    // Called when the element is detached from the DOM. Removes all callbacks.
    disconnectedCallback() {
        this.canvas.onmousedown = null;
        this.canvas.onmouseup = null;
        this.canvas.onmouseout = null;
        this.canvas.onmousemove = null;
        this.canvas.onscroll = null;
    }

    // Helper function that gets the mouse position relative to the upper left corner of the canvas.
    getRelativeMousePos(x, y) {
        return new Vector(
            x - this.canvas.offsetLeft,
            y - this.canvas.offsetTop
        );
    }

    // Draws a node from the neural network on the display.
    // The label parameter is a string for a label to draw next to the circle. 
    // The textAlign parameter allows placing the text on either side of the circle.
    drawNode(x, y, color, label, textAlign) {
        this.ctx.save();

        // Draw the circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2, false);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "#122C34";
        this.ctx.lineWidth = 1;
        this.ctx.fill();
        this.ctx.stroke();

        if (label) {
            this.ctx.fillStyle = "#122C34";
            this.ctx.textAlign = textAlign;
            this.ctx.textBaseline = "middle";
            if (textAlign == "right")
                this.ctx.fillText(label, x - 15, y);
            else
                this.ctx.fillText(label, x + 15, y);
        }

        this.ctx.restore();
    }

    // Draws a connection from the neural network on the display.
    // The color and line width are automatically calculated from the weight 
    // (negative weights are red, positive are green, stronger weights are thicker).
    drawConnection(x1, y1, x2, y2, weight) {
        this.ctx.save();

        // Just?? draw the line bro
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        this.ctx.strokeStyle = weight > 0 ? "green" : "red";
        this.ctx.globalAlpha = Math.abs(weight);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.closePath();

        this.ctx.restore();
    }

    // Render the canvas and everything in it. This will display the current state of the neural network.
    render() {
        this.ctx.save();

        // Fill background
        this.ctx.fillStyle = "#E9EAED";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // If there is no nn set, don't draw it!
        if (!this.nn)
            return;

        // Translate by camPos and zoom
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camZoom, this.camZoom);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        this.ctx.translate(-this.camPos.x, -this.camPos.y);

        // INPUT COLOR #E85D75
        // OUTPUT COLOR #224870
        // HIDDEN COLOR #F9C80E

        const nodes = [];
        const nodesByLayerNum = {};
        for (let i = 0; i < this.nn.inputs; i++) {
            nodes.push({
                x: this.canvas.width / 2 - this.nn.hidden.length / 2 * xSpacing - xSpacing,
                y: this.canvas.height / 2 - this.nn.inputs / 2 * ySpacing + i * ySpacing,
                color: "#E85D75",
                label: this.nn.inputNames[i],
                textAlign: "right"
            });
            if (!nodesByLayerNum[0])
                nodesByLayerNum[0] = {};
            nodesByLayerNum[0][i] = nodes.length - 1;
        }
        for (let i = 0; i < this.nn.hidden.length; i++) {
            for (let j = 0; j < this.nn.hidden[i]; j++) {
                nodes.push({
                    x: this.canvas.width / 2 - this.nn.hidden.length / 2 * xSpacing + i * xSpacing,
                    y: this.canvas.height / 2 - this.nn.hidden[i] / 2 * ySpacing + j * ySpacing,
                    color: "#F9C80E"
                });
                if (!nodesByLayerNum[i + 1])
                    nodesByLayerNum[i + 1] = {};
                nodesByLayerNum[i + 1][j] = nodes.length - 1;
            }
        }
        for (let i = 0; i < this.nn.outputs; i++) {
            nodes.push({
                x: this.canvas.width / 2 + this.nn.hidden.length / 2 * xSpacing,
                y: this.canvas.height / 2 - this.nn.outputs / 2 * ySpacing + i * ySpacing,
                color: "#224870",
                label: this.nn.outputNames[i],
                textAlign: "left"
            });
            if (!nodesByLayerNum[this.nn.hidden.length + 1])
                    nodesByLayerNum[this.nn.hidden.length + 1] = {};
            nodesByLayerNum[this.nn.hidden.length + 1][i] = nodes.length - 1;
        }

        const connections = [];
        for (let i = 0; i < this.nn.weights.length; i++) {
            for (let r = 0; r < this.nn.weights[i].rows; r++) {
                for (let c = 0; c < this.nn.weights[i].cols; c++) {
                    connections.push({
                        source: nodesByLayerNum[i][c],
                        target: nodesByLayerNum[i + 1][r],
                        weight: this.nn.weights[i].get(r, c)
                    });
                }
            }
        }

        for (let c of connections) {
            const input = nodes[c.source];
            const output = nodes[c.target];
            this.drawConnection(input.x, input.y, output.x, output.y, c.weight);
        }

        for (let n of nodes) {
            this.drawNode(n.x, n.y, n.color, n.label, n.textAlign);
        }

        this.ctx.restore();
    }
}

// Define the element
customElements.define("nn-display", NNDisplay);
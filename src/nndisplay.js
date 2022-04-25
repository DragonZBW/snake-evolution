import "./nn.js";
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
        this.ctx.lineWidth = Math.max(1, Math.abs(weight) * 5);
        this.ctx.stroke();

        this.ctx.closePath();

        this.ctx.restore();
    }

    // Render the canvas and everything in it. This will display the current state of the neural network.
    // Currently only renders a black square for testing purposes.
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

        const connections = [];
        for (let i = 0; i < this.nn.connections.length; i++) {
            const conn = this.nn.connections[i];
            connections.push({ source: this.nn.getNodeIndex(conn.input.id), target: this.nn.getNodeIndex(conn.output.id), weight: conn.weight, enabled: conn.enabled });
        }

        const layerNodeCounts = [];
        for (let i = 0; i < this.nn.layers; i++) {
            let count = 0;
            for (let j = 0; j < this.nn.nodes.length; j++) {
                if (this.nn.nodes[j].layer == i)
                    count++;
            }
            layerNodeCounts.push(count);
        }

        const layerNodesDone = [];
        for (let i = 0; i < this.nn.layers; i++)
            layerNodesDone.push(0);

        const nodes = [];
        const inputX = this.canvas.width * 0.2;
        const outputX = this.canvas.width - (this.canvas.width * 0.2);
        for (let i = 0; i < this.nn.nodes.length; i++) {
            const node = this.nn.nodes[i].copy();
            if (node.layer == 0) {
                node.x = inputX;
                node.y = ((this.canvas.height / this.nn.inputCount) * node.id) + (this.canvas.height / this.nn.inputCount) / 2;
            } else if (node.isOutput) {
                node.x = outputX;
                node.y = ((this.canvas.height / this.nn.outputCount) * (node.id - this.nn.inputCount)) + (this.canvas.height / this.nn.outputCount) / 2;
            } else {
                node.x = lerp(inputX, outputX, 1 - node.layer / (this.nn.layers - 1));
                node.y = ((this.canvas.height / layerNodeCounts[node.layer]) * layerNodesDone[node.layer]) + (this.canvas.height / layerNodeCounts[node.layer]) / 2;
                layerNodesDone[node.layer]++;
            }

            nodes.push(node);
        }

        for (let c of connections) {
            if (!c.enabled)
                continue;

            let input, output;
            for (let n of nodes) {
                if (n.id == c.source)
                    input = n;
                if (n.id == c.target)
                    output = n;
                if (input && output)
                    break;
            }
            this.drawConnection(input.x, input.y, output.x, output.y, c.weight);
        }

        for (let n of nodes) {
            this.drawNode(n.x, n.y, n.isOutput ? "#224870" : n.layer == 0 ? "#E85D75" : "#F9C80E");
        }

        this.ctx.restore();

        // Draw text 
        this.ctx.save();
        this.ctx.textBaseline = "top";
        this.ctx.font = "14px Helvetica";
        this.ctx.fillStyle = "black";
        this.ctx.fillText("NN " + this.nn.id + ", SCORE " + this.nn.score, 2, 2);

        this.ctx.textAlign = "right";
        //this.ctx.fillText("GEN " + this..gen + ", MAX FITNESS " + (Math.round(NN.highestFitnessThisGen * 1000) / 1000), this.canvas.width - 2, 2);

        this.ctx.restore();
    }
}

// Define the element
customElements.define("nn-display", NNDisplay);
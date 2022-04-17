import { NN, NodeTypes } from "./nn.js";
import Vector from "./vector.js";

const template = document.createElement("template");
template.innerHTML = `
<canvas width=700 height=400></canvas>
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
        this.ctx.arc(x, y, 12, 0, Math.PI * 2, false);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "#122C34";
        this.ctx.lineWidth = 2;
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
        this.ctx.lineWidth = Math.abs(weight) * 5;
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

        const inputCount = this.nn.inputs.length - 1;
        let curInput = 0;
        const outputCount = this.nn.outputs.length - 1;
        let curOutput = 0;

        // Determine positions of nodes on canvas
        const nodeDrawInf = [];
        for (let i = 0; i < this.nn.nodes.length; i++) {

            const node = this.nn.nodes[i];

            // draw input nodes on left side
            if (node.type == NodeTypes.Input) {
                nodeDrawInf.push({
                    x: 40,
                    y: inputCount == 0 ?
                        this.canvas.height * .5 :
                        this.canvas.height * .25 + (curInput * this.canvas.height * .5 / inputCount),
                    color: "#E85D75",
                    label: node.name,
                    textAlign: "right"
                });
                curInput++;
            // draw output nodes on right side
            } else if (node.type == NodeTypes.Output) {
                nodeDrawInf.push({
                    x: this.canvas.width - 40,
                    y: outputCount == 0 ?
                        this.canvas.height * .5 :
                        this.canvas.height * .25 + (curOutput * this.canvas.height * .5 / outputCount),
                    color: "#224870",
                    label: node.name,
                    textAlign: "left"
                });
                curOutput++;
            // draw hidden nodes
            } else {
                nodeDrawInf.push({
                    x: this.canvas.width / 2,
                    y: this.canvas.height / 2,
                    color: "#F9C80E"
                });
            }
        }

        // draw connections
        for (let conn of this.nn.connections) {
            if (!conn.enabled)
                continue;
            
            const inputNode = nodeDrawInf[conn.input];
            const outputNode = nodeDrawInf[conn.output];
            this.drawConnection(inputNode.x, inputNode.y, outputNode.x, outputNode.y, conn.weight);
        }

        // draw nodes
        for (let inf of nodeDrawInf)
            this.drawNode(inf.x, inf.y, inf.color, inf.label, inf.textAlign);
        
        this.ctx.restore();

        // Draw text 
        this.ctx.save();
        this.ctx.textBaseline = "top";
        this.ctx.font = "14px Helvetica";
        this.ctx.fillStyle = "black";
        this.ctx.fillText("NN " + this.nn.id + ", SPECIES " + this.nn.species + ", FITNESS " + this.nn.fitness, 2, 2);

        this.ctx.textAlign = "right";
        this.ctx.fillText("GEN " + NN.gen + ", MAX FITNESS " + NN.highestFitnessThisGen, this.canvas.width - 2, 2);
        this.ctx.restore();
    }
}

// Define the element
customElements.define("nn-display", NNDisplay);
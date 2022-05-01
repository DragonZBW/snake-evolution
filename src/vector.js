// Basic vector class for doin' math.
export default class Vector {
    // Construct a vector object with x and y coords (default (0, 0)).
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Make a copy of the vector.
    copy() {
        return new Vector(this.x, this.y);
    }

    // Add another vector to this one and return the result.
    plus(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    // Subtract another vector from this one and return the result.
    minus(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    // Multiply this vector by a scalar and return the result.
    times(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    // Check if this vector has values equal to another vector.
    equals(other) {
        return this.x == other.x && this.y == other.y;
    }

    // Get the distance to another vector.
    distance(other) {
        const dist = this.minus(other);
        return dist.magnitude();
    }

    // Get the magnitude of the vector.
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Sets the values of the vector.
    set(x, y) {
        this.x = x;
        this.y = y;
    }
}
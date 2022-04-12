export default class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    plus(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    minus(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    scaled(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }
}
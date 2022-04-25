// Taken mostly from https://www.youtube.com/watch?v=uSzGdfdOoG8&list=PLRqwX-V7Uu6aCibgK1PTWWu9by6XFdCfh&index=6

import { randomMinusOneToOne } from "./utils.js";

// A basic matrix class designed for use in neural networks.
export default class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.data.push(0);
            }
        }
    }

    static fromArray(arr) {
        let m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.set(i, 0, arr[i]);
        }
        return m;
    }

    static map(matrix, func) {
        const result = new Matrix(matrix.rows, matrix.cols);
        result.map((el, i, j) => func(matrix.get(i, j)));
        return result;
    }

    static transpose(matrix) {
        let result = new Matrix(matrix.cols, matrix.rows);
        result.map((el, i, j) => matrix.get(j, i));
        return result;
    }
    
    static add(a, b) {
        if (a.cols != b.cols || a.rows != b.rows) {
            throw "Error: Trying to add matrices with non-matching dimensions!";
        }

        const result = new Matrix(a.rows, a.cols);
        result.map((el, i, j) => a.get(i, j) + b.get(i, j));
        return result;
    }

    static subtract(a, b) {
        if (a.cols != b.cols || a.rows != b.rows) {
            throw "Error: Trying to subtract matrices with non-matching dimensions!";
        }

        const result = new Matrix(a.rows, a.cols);
        result.map((el, i, j) => a.get(i, j) - b.get(i, j));
        return result;
    }

    static multiply(a, b) {
        if (a.cols != b.rows) {
            throw "Error: Trying to multiply matrices with non-matching rows/columns!";
        }

        const result = new Matrix(a.rows, b.cols);

        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                // Dot product of column j with other matrix's row i
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.get(i, k) * b.get(k, j);
                }
                result.set(i, j, sum);
            }
        }
        return result;
    }

    set(i, j, value) {
        if (i * this.cols + j > this.rows * this.cols)
            throw "Indices specified are outside of matrix dimensions. (" + i + ", " + j + ") specified, (" + this.rows + ", " + this.cols + ") actual";

        this.data[i * this.cols + j] = value;
    }

    get(i, j) {
        if (i * this.cols + j > this.rows * this.cols)
            throw "Indices specified are outside of matrix dimensions. (" + i + ", " + j + ") specified, (" + this.rows + ", " + this.cols + ") actual";

        return this.data[i * this.cols + j];
    }

    copy() {
        const result = new Matrix(this.rows, this.cols);
        result.map((el, i, j) => this.get(i, j));
        return result;
    }

    toArray() {
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.get(i, j));
            }
        }
        return arr;
    }

    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.set(i, j, func(this.get(i, j), i, j));
            }
        }
    }

    multiply(n) {
        if (n instanceof Matrix) {
            this.map((el, i, j) => this.get(i, j) * n.get(i, j));
        } else {
            this.map((el) => el * n);
        }
    }

    add(n) {
        if (n instanceof Matrix) {
            this.map((el, i, j) => el + n.get(i, j));
        } else {
            this.map((el) => el + n);
        }
    }

    randomize() {
        this.map(() => randomMinusOneToOne());
    }

    print() {
        const arr = [];
        for (let i = 0; i < this.rows; i++) {
            arr[i] = [];
            for (let j = 0; j < this.cols; j++) {
                arr[i][j] = this.get(i, j);
            }
        }
        console.table(arr);
    }
}
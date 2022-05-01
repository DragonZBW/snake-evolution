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

    // Create a matrix from an array
    static fromArray(arr) {
        const m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.set(i, 0, arr[i]);
        }
        return m;
    }

    // Create a matrix from a json representation of it
    static fromJSON(json) {
        const m = new Matrix(json.rows, json.cols);
        m.map((el, i, j) => json.data[i * m.cols + j]);
        return m;
    }

    // Set each value of a matrix according to a function
    static map(matrix, func) {
        const result = new Matrix(matrix.rows, matrix.cols);
        result.map((el, i, j) => func(matrix.get(i, j)));
        return result;
    }

    // Return the transpose of a matrix
    static transpose(matrix) {
        const result = new Matrix(matrix.cols, matrix.rows);
        result.map((el, i, j) => matrix.get(j, i));
        return result;
    }
    
    // Return a matrix whose values are the values of two other matrices added together
    static add(a, b) {
        if (a.cols != b.cols || a.rows != b.rows) {
            throw "Error: Trying to add matrices with non-matching dimensions!";
        }

        const result = new Matrix(a.rows, a.cols);
        result.map((el, i, j) => a.get(i, j) + b.get(i, j));
        return result;
    }

    // Return a matrix whose values are the values of two other matrices subtracted together
    static subtract(a, b) {
        if (a.cols != b.cols || a.rows != b.rows) {
            throw "Error: Trying to subtract matrices with non-matching dimensions!";
        }

        const result = new Matrix(a.rows, a.cols);
        result.map((el, i, j) => a.get(i, j) - b.get(i, j));
        return result;
    }

    // Perform matrix multiplication using two matrices and return the result
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

    // Set the value of an element in the matrix
    set(i, j, value) {
        if (i * this.cols + j > this.rows * this.cols)
            throw "Indices specified are outside of matrix dimensions. (" + i + ", " + j + ") specified, (" + this.rows + ", " + this.cols + ") actual";

        this.data[i * this.cols + j] = value;
    }

    // Get the value of an element in the matrix
    get(i, j) {
        if (i * this.cols + j > this.rows * this.cols)
            throw "Indices specified are outside of matrix dimensions. (" + i + ", " + j + ") specified, (" + this.rows + ", " + this.cols + ") actual";

        return this.data[i * this.cols + j];
    }

    // Return a copy of the matrix
    copy() {
        const result = new Matrix(this.rows, this.cols);
        result.map((el, i, j) => this.get(i, j));
        return result;
    }

    // Convert the matrix to an array and return it
    toArray() {
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.get(i, j));
            }
        }
        return arr;
    }

    // Set each element of the array using a function
    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.set(i, j, func(this.get(i, j), i, j));
            }
        }
    }

    // Multiply (elementwise or scalar)
    multiply(n) {
        if (n instanceof Matrix) {
            this.map((el, i, j) => this.get(i, j) * n.get(i, j));
        } else {
            this.map((el) => el * n);
        }
    }

    // Add (elementwise or scalar)
    add(n) {
        if (n instanceof Matrix) {
            this.map((el, i, j) => el + n.get(i, j));
        } else {
            this.map((el) => el + n);
        }
    }

    // Randomize all values of this matrix between -1 and 1
    randomize() {
        this.map(() => randomMinusOneToOne());
    }

    // Print the matrix as a table
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
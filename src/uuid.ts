// MIT License
//
// Copyright (c) 2018 Oleg Repin
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const HYPHENS_POSITIONS = [8, 12, 16, 20];
const VALUE_REGEXP = /^[0-9A-Fa-f]{32}$/;

/**
 * Insert value to a source array at position
 * @param {Array} source array to insert
 * @param {number} position position to insert
 * @param {*} value value to insert
 * @returns {Array}
 */
function insert<T>(source: T[], position: number, value: T): T[] {
  return [...source.slice(0, position), value, ...source.slice(position)];
}

/**
 * Format string to UUID format
 * @param {string} value string of 32 hexadecimal numbers
 * @returns {string} formatted toUUID string
 */
export function toUUID(value: string) {
  if (!VALUE_REGEXP.test(value)) {
    throw new Error(`Value must be string of 32 hexadecimal numbers`);
  }

  let array = value.split("");
  let offset = 0;
  for (const num of HYPHENS_POSITIONS) {
    const position = num + offset++;
    array = insert(array, position, "-");
  }
  return array.join("");
}

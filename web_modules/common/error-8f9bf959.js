/**
 * Error helpers.
 *
 * @module error
 */

/**
 * @param {string} s
 * @return {Error}
 */
/* istanbul ignore next */
const create = s => new Error(s);

/**
 * @throws {Error}
 * @return {never}
 */
/* istanbul ignore next */
const methodUnimplemented = () => {
  throw create('Method unimplemented')
};

/**
 * @throws {Error}
 * @return {never}
 */
/* istanbul ignore next */
const unexpectedCase = () => {
  throw create('Unexpected case')
};

export { create as c, methodUnimplemented as m, unexpectedCase as u };

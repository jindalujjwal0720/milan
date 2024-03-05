/**
 * Generate a unique id for the room
 * @returns {string} - A unique id
 *
 * @example
 * const uid = require('./uid');
 * console.log(uid()); // dnn-qoxq-bjz
 */
module.exports = function uid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2);
  return `${timestamp}-${random}`;
};

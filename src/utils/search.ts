/**
 * Export the SQLite document index implementation as the main export
 * 
 * This file acts as a thin re-export wrapper for the SQLite implementation
 * of our document index system. This enables us to swap implementations
 * without changing any of the code that uses the documentIndex.
 */
export { documentIndex } from './sqlite-search.js';
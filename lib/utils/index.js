"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
exports.identity = (x) => x;
/**
 * Given a type, returns a predicate that checks if any given
 *    object belongs to that type.
 * @param type The type the predicate checks objects against.
 */
exports.is = (type) => (x) => Object(x) instanceof type;
/**
 * Deep freezes the given object.
 * @param object The object to freeze.
 */
exports.freeze = (object) => {
    const freezable = (o) => exports.is(Object)(o) && !exports.is(String)(o);
    Object.values(object).forEach(value => {
        if (value && freezable(value)) {
            exports.freeze(value);
        }
    });
    return Object.freeze(object);
};

/**
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
export declare const identity: <T>(x: T) => T;
/**
 * Given a type, returns a predicate that checks if any given
 *    object belongs to that type.
 * @param type The type the predicate checks objects against.
 */
export declare const is: (type: any) => (x: Object) => boolean;
/**
 * Deep freezes the given object.
 * @param object The object to freeze.
 */
export declare const freeze: <T>(object: T) => T;

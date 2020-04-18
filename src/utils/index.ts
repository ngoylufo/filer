/**
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
export const identity = <T>(x: T): T => x;

/**
 * Given a type, returns a predicate that checks if any given
 *    object belongs to that type.
 * @param type The type the predicate checks objects against.
 */
export const is = (type: any) => (x: Object) => Object(x) instanceof type;

/**
 * Deep freezes the given object.
 * @param object The object to freeze.
 */
export const freeze = <T>(object: T): T => {
  const freezable = (o: Object) => is(Object)(o) && !is(String)(o);

  Object.values(object).forEach(value => {
    if (value && freezable(value)) {
      freeze(value);
    }
  });

  return Object.freeze(object);
};
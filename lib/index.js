"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
const identity = (x) => x;
/**
 * Given a type, returns a predicate that checks if any given
 *    object belongs to that type.
 * @param type The type the predicate checks objects against.
 */
const is = (type) => (x) => Object(x) instanceof type;
/**
 * Deep freezes the given object.
 * @param object The object to freeze.
 */
const freeze = (object) => {
    const freezable = (o) => is(Object)(o) && !is(String)(o);
    Object.values(object).forEach(value => {
        if (value && freezable(value)) {
            freeze(value);
        }
    });
    return Object.freeze(object);
};
/**
 * The **Some** case for the Option sum type.
 * @param value The value for the case.
 */
const Some = (value) => {
    const map = (fn) => Some(fn(value));
    const chain = (fn) => fn(value);
    return freeze({ value, map, chain });
};
/**
 * The **None** case for the Option sum type.
 */
const None = () => {
    const map = (fn) => None();
    const chain = (fn) => undefined;
    return freeze({ map, chain });
};
/**
 * Performs a synchronous operation, return an Option sum type.
 * @param fn The operation to perform.
 * @param args The arguments to pass to the function performing the operation.
 */
const mop = (fn, ...args) => {
    try {
        return Some(fn(...args));
    }
    catch (error) {
        return None();
    }
};
/**
 * An object containing information about all the file/extension formats filer
 * knows about.
 */
const formats = (function () {
    let formats = {};
    /**
     * Checks whether the given extension has been registered as a format.
     * @param extension The extension of the format.
     */
    const has = (extension) => formats.hasOwnProperty(extension);
    /**
     * Returns the format attributes for the given extension, if it registered.
     * @param extension The extension format to retrieve.
     */
    const get = (extension) => formats[extension] || {};
    /**
     * Registers a new extension format.
     * @param format The extension format to register, obviously.
     */
    const register = ({ extension, attributes }) => {
        const { reader = {}, writer = {} } = attributes;
        const format = freeze({ reader, writer });
        (is(String)(extension) ? [extension] : extension).forEach((ext) => {
            formats = { ...formats, [ext]: format };
        });
        Object.freeze(formats);
    };
    /**
     * Unregister an extension format.
     * @param extension The extension of the format to unregister.
     */
    const unregister = (extension) => {
        const { [extension]: _, ...others } = formats;
        formats = Object.freeze(others);
    };
    return freeze({ has, get, register, unregister });
})();
/**
 * Creates a function that parses JSON text.
 * @param options Optional arguments for the JSONReader.
 */
const JSONReader = (options = {}) => buffer => JSON.parse(buffer.toString(), options.reviver);
/**
 * Creates a function that stringifies javascript objects.
 * @param options Optional arguments for the JSONWriter.
 */
const JSONWriter = (options = {}) => (data) => JSON.stringify(data, options.replacer, options.space);
/**
 * Reads the contents of a file synchronously.
 */
const readFile = ({ filename, options }) => {
    return new Promise((resolve, reject) => {
        const contents = readFileSync({ filename, options });
        contents ? resolve(contents) : reject(contents);
    });
};
/**
 * Reads the contents of a file synchronously.
 */
const readFileSync = ({ filename, options }) => {
    const { reader = {} } = formats.get(path.extname(filename));
    options = Object.assign({}, reader.options, options);
    if (reader.coerce && is(Function)(reader.coerce)) {
        const buffer = mop(fs.readFileSync, filename, options).chain(identity);
        return Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer;
    }
    return mop(fs.readFileSync, filename, options).chain(identity);
};
/**
 * Write contents to a file asynchronously, replaces the file if it exists by
 * default.
 */
const writeFile = ({ filename, data, options }) => {
    return Promise.resolve(writeFileSync({ filename, data, options }));
};
/**
 * Write contents to a file synchronously, replaces the file if it exists by
 * default.
 */
const writeFileSync = ({ filename, data, options }) => {
    const { writer = {} } = formats.get(path.extname(filename));
    options = Object.assign({}, writer.options, options);
    if (writer.coerce && is(Function)(writer.coerce)) {
        data = writer.coerce(data);
    }
    mop(fs.writeFileSync, filename, data, options);
};
const filer = freeze({
    formats,
    JSONReader,
    JSONWriter,
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
});
module.exports = filer;

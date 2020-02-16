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
 *
 * @param fn
 * @param args
 */
const maybeOperate = (fn, ...args) => {
    try {
        return Some(fn(...args));
    }
    catch (error) {
        return None();
    }
};
/**
 *
 * @param fn
 * @param args
 */
const operate = (fn, ...args) => maybeOperate(fn, ...args).chain(identity);
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
 *
 */
const formats = (function () {
    let fmts = {};
    /**
     * Returns all the registered extension formats.
     */
    const formats = () => ({ ...fmts });
    /**
     * Registers a new extension format.
     * @param ext The file extension of the format. e.g. '.txt' or ['.txt']
     * @param attributes The attributes of the format to register.
     */
    formats.register = (ext, attributes) => {
        const { reader = {}, writer = {} } = attributes;
        const format = freeze({ reader, writer });
        (is(String)(ext) ? [ext] : ext).forEach((ext) => {
            fmts = { ...fmts, [ext]: format };
        });
        Object.freeze(fmts);
    };
    /**
     * Returns the format for the given extension, if it is registered.
     * @param ext The extension format to retrieve.
     */
    formats.get = (ext) => fmts[ext] || {};
    /**
     * Unregister an extension format.
     * @param ext The extension of the format to unregister.
     */
    formats.unregister = (ext) => {
        const { [ext]: _, ...others } = fmts;
        fmts = Object.freeze(others);
    };
    return formats;
})();
/**
 * Reads the contents of a file synchronously.
 * @param file The relative path to the file.
 * @param options An optional object specifying the encoding and/or
 *    flag to use when reading the contents of the file.
 */
const readFile = (file, options) => {
    return new Promise((resolve, reject) => {
        const { reader = {} } = formats.get(path.extname(file));
        options = Object.assign({}, reader.options, options);
        fs.readFile(file, options, (err, buffer) => {
            if (err) {
                reject(err);
            }
            else {
                if (reader.coerce && is(Function)(reader.coerce)) {
                    resolve(Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer);
                }
                else {
                    resolve(buffer);
                }
            }
        });
    });
};
/**
 * Reads the contents of a file synchronously.
 * @param file The relative path to the file.
 * @param options An optional object specifying the encoding and/or
 *    flag to use when reading the contents of the file.
 */
const readFileSync = (file, options) => {
    const { reader = {} } = formats.get(path.extname(file));
    options = Object.assign({}, reader.options, options);
    if (reader.coerce && is(Function)(reader.coerce)) {
        const buffer = operate(fs.readFileSync, file, options);
        return Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer;
    }
    return operate(fs.readFileSync, file, options);
};
/**
 * Write contents to a file asynchronously, replaces the file if it exists by
 * default.
 * @param file The relative path to the file.
 * @param data The data to write to the file.
 * @param options An optional object specifying the encoding, mode and/or
 *    flag to use when writing to the file.
 */
const writeFile = (file, data, options) => {
    return new Promise((resolve, reject) => {
        const cb = (err) => err ? reject(err) : resolve(data);
        const { writer = {} } = formats.get(path.extname(file));
        options = Object.assign({}, writer.options, options);
        if (writer.coerce && is(Function)(writer.coerce)) {
            data = writer.coerce(data);
        }
        fs.writeFile(file, data, options, cb);
    });
};
/**
 * Write contents to a file synchronously, replaces the file if it exists by
 * default.
 * @param file The relative path to the file.
 * @param data The data to write to the file.
 * @param options An optional object specifying the encoding, mode and/or
 *    flag to use when writing to the file.
 */
const writeFileSync = (file, data, options) => {
    const { writer = {} } = formats.get(path.extname(file));
    options = Object.assign({}, writer.options, options);
    if (writer.coerce && is(Function)(writer.coerce)) {
        data = writer.coerce(data);
    }
    operate(fs.writeFileSync, file, data, options);
};
const filer = freeze({
    JSONReader,
    JSONWriter,
    formats,
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
});
module.exports = filer;

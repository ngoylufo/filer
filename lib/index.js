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
const utils = __importStar(require("./utils"));
/**
 * The **Some** case for the Option sum type.
 * @param value The value for the case.
 */
const Some = (value) => {
    const map = (fn) => Some(fn(value));
    const chain = (fn) => fn(value);
    return utils.freeze({ value, map, chain });
};
/**
 * The **None** case for the Option sum type.
 */
const None = () => {
    const map = (fn) => None();
    const chain = (fn) => undefined;
    return utils.freeze({ map, chain });
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
        const format = utils.freeze({ reader, writer });
        (utils.is(String)(extension) ? [extension] : extension).forEach((ext) => {
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
    return utils.freeze({ has, get, register, unregister });
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
 * Checks whether the given path exists.
 */
const exists = (path) => fs.existsSync(path);
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
    if (reader.coerce && utils.is(Function)(reader.coerce)) {
        const buffer = mop(fs.readFileSync, filename, options).chain(utils.identity);
        return Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer;
    }
    return mop(fs.readFileSync, filename, options).chain(utils.identity);
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
    if (writer.coerce && utils.is(Function)(writer.coerce)) {
        data = writer.coerce(data);
    }
    mop(fs.writeFileSync, filename, data, options);
};
const filer = utils.freeze({
    formats,
    JSONReader,
    JSONWriter,
    exists,
    readFile,
    readFileSync,
    writeFile,
    writeFileSync,
});
module.exports = filer;

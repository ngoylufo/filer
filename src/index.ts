import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils';

/**
 * A function that parses the data given to it, return the results.
 */
type DataParser = (data: Buffer | String) => any;

/**
 * A function that transforms the properties of the object being operated on.
 */
type JSONTransformer = (this: any, key: string, value: any) => any;

/**
 * The options for a function that 'reads'/parses JSON text.
 */
type JSONReaderOptions = {
  reviver?: JSONTransformer;
};

/**
 * The options for a function that 'writes'/stringifies a javascript object as
 * JSON text.
 */
type JSONWriterOptions = {
  replacer?: JSONTransformer;
  space?: string | number;
};

type ReadFileOptions = {
  filename: string;
  options?: { encoding?: string | null; flag?: string };
};

type WriteFileOptions = {
  filename: string;
  data: any;
  options?: fs.WriteFileOptions;
};

/**
 * Describes the properties of the reader property of a format.
 */
type FormatReaderProperty = {
  options?: { encoding?: string | null; flag?: string };
  coerce?: DataParser;
};

/**
 * Describes the properties of the writer property of a format.
 */
type FormatWriterProperty = {
  options?: { encoding?: string | null; mode?: number | string; flag?: string };
  coerce?: DataParser;
};

/**
 * The attributes of a file format.
 */
type FormatAttributes = {
  reader?: FormatReaderProperty;
  writer?: FormatWriterProperty;
};

/**
 * Describes a file format.
 */
type Format = {
  extension: any;
  attributes: FormatAttributes;
};

/**
 * The **Some** case for the Option sum type.
 * @param value The value for the case.
 */
const Some = <V>(value: V) => {
  const map = (fn: Function) => Some(fn(value));
  const chain = (fn: Function) => fn(value);

  return utils.freeze({ value, map, chain });
};

/**
 * The **None** case for the Option sum type.
 */
const None = () => {
  const map = (fn: Function) => None();
  const chain = (fn: Function) => undefined;

  return utils.freeze({ map, chain });
};

/**
 * Performs a synchronous operation, return an Option sum type.
 * @param fn The operation to perform.
 * @param args The arguments to pass to the function performing the operation.
 */
const mop = (fn: Function, ...args: any[]) => {
  try {
    return Some(fn(...args));
  } catch (error) {
    return None();
  }
};

/**
 * An object containing information about all the file/extension formats filer
 * knows about.
 */
const formats = (function() {
  let formats: { [x: string]: FormatAttributes } = {};

  /**
   * Checks whether the given extension has been registered as a format.
   * @param extension The extension of the format.
   */
  const has = (extension: string) => formats.hasOwnProperty(extension);

  /**
   * Returns the format attributes for the given extension, if it registered.
   * @param extension The extension format to retrieve.
   */
  const get = (extension: string) => formats[extension] || {};

  /**
   * Registers a new extension format.
   * @param format The extension format to register, obviously.
   */
  const register = ({ extension, attributes }: Format) => {
    const { reader = {}, writer = {} } = attributes;
    const format = utils.freeze({ reader, writer });

    (utils.is(String)(extension) ? [extension] : extension).forEach((ext: string) => {
      formats = { ...formats, [ext]: format };
    });

    Object.freeze(formats);
  };

  /**
   * Unregister an extension format.
   * @param extension The extension of the format to unregister.
   */
  const unregister = (extension: string) => {
    const { [extension]: _, ...others } = formats;
    formats = Object.freeze(others);
  };

  return utils.freeze({ has, get, register, unregister });
})();

/**
 * Creates a function that parses JSON text.
 * @param options Optional arguments for the JSONReader.
 */
const JSONReader = (options: JSONReaderOptions = {}): DataParser => buffer =>
  JSON.parse(buffer.toString(), options.reviver);

/**
 * Creates a function that stringifies javascript objects.
 * @param options Optional arguments for the JSONWriter.
 */
const JSONWriter = (options: JSONWriterOptions = {}) => (data: any) =>
  JSON.stringify(data, options.replacer, options.space);

/**
 * Checks whether the given path exists.
 */
const exists = (path: string) => fs.existsSync(path);

/**
 * Checks whether the given path is a file.
 */
const isFile = (path: string) => fs.statSync(path).isFile();

/**
 * Reads the contents of a file synchronously.
 */
const readFile = ({ filename, options }: ReadFileOptions) => {
  return new Promise((resolve, reject) => {
    const contents = readFileSync({ filename, options });
    contents ? resolve(contents) : reject(contents);
  });
};

/**
 * Reads the contents of a file synchronously.
 */
const readFileSync = ({ filename, options }: ReadFileOptions) => {
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
const writeFile = ({ filename, data, options }: WriteFileOptions) => {
  return Promise.resolve(writeFileSync({ filename, data, options }));
};

/**
 * Write contents to a file synchronously, replaces the file if it exists by
 * default.
 */
const writeFileSync = ({ filename, data, options }: WriteFileOptions) => {
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
  isFile,
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
});

export = filer;

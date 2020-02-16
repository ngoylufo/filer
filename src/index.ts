import * as path from 'path';
import * as fs from 'fs';

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
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
const identity = <T>(x: T): T => x;

/**
 * Given a type, returns a predicate that checks if any given
 *    object belongs to that type.
 * @param type The type the predicate checks objects against.
 */
const is = (type: any) => (x: Object) => Object(x) instanceof type;

/**
 * Deep freezes the given object.
 * @param object The object to freeze.
 */
const freeze = <T>(object: T): T => {
  const freezable = (o: Object) => is(Object)(o) && !is(String)(o);

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
const Some = <V>(value: V) => {
  const map = (fn: Function) => Some(fn(value));
  const chain = (fn: Function) => fn(value);

  return freeze({ value, map, chain });
};

/**
 * The **None** case for the Option sum type.
 */
const None = () => {
  const map = (fn: Function) => None();
  const chain = (fn: Function) => undefined;

  return freeze({ map, chain });
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
    const format = freeze({ reader, writer });

    (is(String)(extension) ? [extension] : extension).forEach((ext: string) => {
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

  return freeze({ has, get, register, unregister });
})();

/**
 * Reads the contents of a file synchronously.
 * @param file The relative path to the file.
 * @param options An optional object specifying the encoding and/or
 *    flag to use when reading the contents of the file.
 */
const readFile = (
  file: string,
  options?: { encoding?: null; flag?: string }
) => {
  return new Promise((resolve, reject) => {
    const { reader = {} } = formats.get(path.extname(file));
    options = Object.assign({}, reader.options, options);

    fs.readFile(file, options, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        if (reader.coerce && is(Function)(reader.coerce)) {
          resolve(Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer);
        } else {
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
const readFileSync = (
  file: string,
  options?: { encoding?: null; flag?: string }
): string | Buffer => {
  const { reader = {} } = formats.get(path.extname(file));
  options = Object.assign({}, reader.options, options);

  if (reader.coerce && is(Function)(reader.coerce)) {
    const buffer = mop(fs.readFileSync, file, options).chain(identity);
    return Buffer.isBuffer(buffer) ? reader.coerce(buffer) : buffer;
  }

  return mop(fs.readFileSync, file, options).chain(identity);
};

/**
 * Write contents to a file asynchronously, replaces the file if it exists by
 * default.
 * @param file The relative path to the file.
 * @param data The data to write to the file.
 * @param options An optional object specifying the encoding, mode and/or
 *    flag to use when writing to the file.
 */
const writeFile = (file: string, data: any, options?: fs.WriteFileOptions) => {
  return new Promise((resolve, reject) => {
    const cb: fs.NoParamCallback = (err: NodeJS.ErrnoException | null) =>
      err ? reject(err) : resolve(data);

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
const writeFileSync = (
  file: string,
  data: any,
  options?: fs.WriteFileOptions
) => {
  const { writer = {} } = formats.get(path.extname(file));
  options = Object.assign({}, writer.options, options);

  if (writer.coerce && is(Function)(writer.coerce)) {
    data = writer.coerce(data);
  }

  mop(fs.writeFileSync, file, data, options).chain(identity);
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

export = filer;

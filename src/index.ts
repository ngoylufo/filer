import { extname } from 'path';
import * as fs from 'fs';

/* enter: types */

/**
 *
 */
type BufferParser = (buffer: Buffer) => any;

/**
 * A function that transforms the results.
 * @param this The current object being transformed.
 * @param key The current key from object being looked at.
 * @param value The value of the key from the object being looked at.
 */
type JSONTransformer = (this: any, key: string, value: any) => any;

/**
 *
 */
type JSONReaderOptions = {
  reviver?: JSONTransformer;
};

/**
 *
 */
type JSONWriterOptions = {
  replacer?: JSONTransformer;
  space?: string | number;
};

/**
 *
 */
type FormatReaderProperty = {
  options?: { encoding?: string | null; flag?: string };
  coerce?: BufferParser;
};

/**
 *
 */
type FormatWriterProperty = {
  options?: { encoding?: string | null; mode?: number | string; flag?: string };
  coerce?: BufferParser;
};

/**
 *
 */
interface FormatAttributes {
  reader?: FormatReaderProperty;
  writer?: FormatWriterProperty;
}

/* exit: types */

/* enter: utility functions */

/**
 * The identity function. Returns the given object unchanged.
 * @param x The object.
 */
const identity = <T>(x: T): T => x;

/**
 * Given a datatype, returns a predicate that checks if any given
 *    object belongs to that datatype.
 * @param type The datatype the predicate checks objects against.
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
const some = <V>(value: V) => {
  const map = (fn: Function) => some(fn(value));
  const chain = (fn: Function) => fn(value);

  return freeze({ value, map, chain });
};

/**
 * The **None** case for the Option sum type.
 */
const none = () => {
  const map = (fn: Function) => none();
  const chain = (fn: Function) => undefined;

  return freeze({ map, chain });
};

/**
 * 
 * @param fn 
 * @param args 
 */
const maybeOperate = (fn: Function, ...args: any[]) => {
  try {
    return some(fn(...args));
  } catch (error) {
    return none();
  }
};

/**
 * 
 * @param fn 
 * @param args 
 */
const operate = (fn: Function, ...args: any[]) =>
  maybeOperate(fn, ...args).chain(identity);

/* exit: utility functions */

/**
 * Creates a function that parses JSON text.
 * @param options Optional arguments for the JSONReader.
 */
const JSONReader = (options: JSONReaderOptions = {}): BufferParser => buffer =>
  JSON.parse(buffer.toString(), options.reviver);

/**
 * Creates a function that stringifies javascript objects.
 * @param options Optional arguments for the JSONWriter.
 */
const JSONWriter = (options: JSONWriterOptions = {}) => (data: any) =>
  JSON.stringify(data, options.replacer, options.space);

/**
 *
 */
const formats = (function() {
  let fmts: { [x: string]: FormatAttributes } = {};

  /**
   * Returns all the registered extension formats.
   */
  const formats = () => ({ ...fmts });

  /**
   * Registers a new extension format.
   * @param ext The file extension of the format. e.g. '.txt' or ['.txt']
   * @param attributes The attributes of the format to register.
   */
  formats.register = (ext: any, attributes: FormatAttributes) => {
    const { reader = {}, writer = {} } = attributes;
    const format = freeze({ reader, writer });

    (is(String)(ext) ? [ext] : ext).forEach((ext: string) => {
      fmts = { ...fmts, [ext]: format };
    });

    Object.freeze(fmts);
  };

  /**
   * Returns the format for the given extension, if it is registered.
   * @param ext The extension format to retrieve.
   */
  formats.get = (ext: string) => fmts[ext] || {};

  /**
   * Unregister an extension format.
   * @param ext The extension of the format to unregister.
   */
  formats.unregister = (ext: string) => {
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
const readFile = (
  file: string,
  options?: { encoding?: null; flag?: string }
) => {
  return new Promise((resolve, reject) => {
    const { reader = {} } = formats.get(extname(file));
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
  const { reader = {} } = formats.get(extname(file));
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
const writeFile = (file: string, data: any, options?: fs.WriteFileOptions) => {
  return new Promise((resolve, reject) => {
    const cb: fs.NoParamCallback = (err: NodeJS.ErrnoException | null) =>
      err ? reject(err) : resolve(data);

    const { writer = {} } = formats.get(extname(file));
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
  const { writer = {} } = formats.get(extname(file));
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

export = filer;

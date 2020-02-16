/// <reference types="node" />
import * as fs from 'fs';
/**
 * A function that parses the data given to it, return the results.
 */
declare type DataParser = (data: Buffer | String) => any;
/**
 * A function that transforms the properties of the object being operated on.
 */
declare type JSONTransformer = (this: any, key: string, value: any) => any;
/**
 * The options for a function that 'reads'/parses JSON text.
 */
declare type JSONReaderOptions = {
    reviver?: JSONTransformer;
};
/**
 * The options for a function that 'writes'/stringifies a javascript object as
 * JSON text.
 */
declare type JSONWriterOptions = {
    replacer?: JSONTransformer;
    space?: string | number;
};
declare type ReadFileOptions = {
    filename: string;
    options?: {
        encoding?: string | null;
        flag?: string;
    };
};
declare type WriteFileOptions = {
    filename: string;
    data: any;
    options?: fs.WriteFileOptions;
};
/**
 * Describes the properties of the reader property of a format.
 */
declare type FormatReaderProperty = {
    options?: {
        encoding?: string | null;
        flag?: string;
    };
    coerce?: DataParser;
};
/**
 * Describes the properties of the writer property of a format.
 */
declare type FormatWriterProperty = {
    options?: {
        encoding?: string | null;
        mode?: number | string;
        flag?: string;
    };
    coerce?: DataParser;
};
/**
 * The attributes of a file format.
 */
declare type FormatAttributes = {
    reader?: FormatReaderProperty;
    writer?: FormatWriterProperty;
};
/**
 * Describes a file format.
 */
declare type Format = {
    extension: any;
    attributes: FormatAttributes;
};
declare const filer: {
    JSONReader: (options?: JSONReaderOptions) => DataParser;
    JSONWriter: (options?: JSONWriterOptions) => (data: any) => string;
    formats: {
        has: (extension: string) => boolean;
        get: (extension: string) => FormatAttributes;
        register: ({ extension, attributes }: Format) => void;
        unregister: (extension: string) => void;
    };
    readFile: ({ filename, options }: ReadFileOptions) => Promise<unknown>;
    readFileSync: ({ filename, options }: ReadFileOptions) => any;
    writeFile: ({ filename, data, options }: WriteFileOptions) => Promise<void>;
    writeFileSync: ({ filename, data, options }: WriteFileOptions) => void;
};
export = filer;

/// <reference types="node" />
/**
 * A function that parses the data given to it, return the results.
 */
declare type DataParser = (data: Buffer | String) => any;
declare type ReadFileOptions = {
    filename: string;
    options?: {
        encoding?: string | null;
        flag?: string;
    };
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
    JSONReader: any;
    JSONWriter: any;
    formats: {
        has: (extension: string) => boolean;
        get: (extension: string) => FormatAttributes;
        register: ({ extension, attributes }: Format) => void;
        unregister: (extension: string) => void;
    };
    readFile: ({ filename, options }: ReadFileOptions) => Promise<unknown>;
    readFileSync: ({ filename, options }: ReadFileOptions) => any;
    writeFile: (file: string, data: any, options?: string | {
        encoding?: string | null | undefined;
        mode?: string | number | undefined;
        flag?: string | undefined;
    } | null | undefined) => Promise<unknown>;
    writeFileSync: (file: string, data: any, options?: string | {
        encoding?: string | null | undefined;
        mode?: string | number | undefined;
        flag?: string | undefined;
    } | null | undefined) => void;
};
export = filer;

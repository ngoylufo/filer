/// <reference types="node" />
/**
 * A function that parses the data given to it, return the results.
 */
declare type DataParser = (data: Buffer | String) => any;
/**
 * A function that transforms the results.
 * @param this The current object being transformed.
 * @param key The current key from object being looked at.
 * @param value The value of the key from the object being looked at.
 */
declare type JSONTransformer = (this: any, key: string, value: any) => any;
/**
 *
 */
declare type JSONReaderOptions = {
    reviver?: JSONTransformer;
};
/**
 *
 */
declare type JSONWriterOptions = {
    replacer?: JSONTransformer;
    space?: string | number;
};
/**
 *
 */
declare type FormatReaderProperty = {
    options?: {
        encoding?: string | null;
        flag?: string;
    };
    coerce?: DataParser;
};
/**
 *
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
 *
 */
interface FormatAttributes {
    reader?: FormatReaderProperty;
    writer?: FormatWriterProperty;
}
declare const filer: {
    JSONReader: (options?: JSONReaderOptions) => DataParser;
    JSONWriter: (options?: JSONWriterOptions) => (data: any) => string;
    formats: {
        (): {
            [x: string]: FormatAttributes;
        };
        /**
         * Registers a new extension format.
         * @param ext The file extension of the format. e.g. '.txt' or ['.txt']
         * @param attributes The attributes of the format to register.
         */
        register(ext: any, attributes: FormatAttributes): void;
        /**
         * Returns the format for the given extension, if it is registered.
         * @param ext The extension format to retrieve.
         */
        get(ext: string): FormatAttributes;
        /**
         * Unregister an extension format.
         * @param ext The extension of the format to unregister.
         */
        unregister(ext: string): void;
    };
    readFile: (file: string, options?: {
        encoding?: null | undefined;
        flag?: string | undefined;
    } | undefined) => Promise<unknown>;
    readFileSync: (file: string, options?: {
        encoding?: null | undefined;
        flag?: string | undefined;
    } | undefined) => string | Buffer;
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

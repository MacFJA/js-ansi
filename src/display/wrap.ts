import wordwrap from "wordwrapjs";
import { parse, stringify } from "../lexer-parser";
import type { ParsedText } from "../types";
import { insertAt } from "./insert";
import { stripAnsi } from "./strip";

export type WrapOptions = {
    /**
     * Indicate what to do with white space.
     * - "trim", will remove any white space at start and end of each line
     * - "fill", will remove any white space at the start of line and add space to match the col size
     * - "preserve", will leave line as-is
     */
    whiteSpace: "trim" | "fill" | "preserve";
    /**
     * Indicate how to wrap line.
     * - "word", if possible it won't break any word (soft wrap)
     * - "char", break line at the desired col without considering word (hard wrap)
     */
    break: "word" | "char";
};

/**
 * Wrap an Ansi text within a defined length
 * @param text The text to wrap
 * @param cols The maximum width of the text
 * @param options
 */
export function wrap(
    text: string,
    cols: number,
    options: WrapOptions = { break: "word", whiteSpace: "preserve" },
): string {
    return options.break === "char"
        ? hardWrap(text, cols, options)
        : softWrap(text, cols, options);
}

export function hardWrap(
    text: string,
    cols: number,
    options: WrapOptions,
): string {
    const strippedLines = stripAnsi(text).split("\n");
    const lines = text.split("\n");
    let result = "";

    for (const index in lines) {
        let working = lines[index];
        let strippedWorking = strippedLines[index].length;
        while (strippedWorking > cols) {
            const work = insertAt(working, cols, "\n");
            const [done, left] = work.split("\n");
            result += `${editLine(done, cols, options.whiteSpace)}\n`;
            working = left;
            strippedWorking -= cols;
        }
        result += `${working}\n`;
    }
    return result.slice(0, -1);
}

function editLine(
    line: string,
    cols: number,
    whiteSpace: WrapOptions["whiteSpace"],
): string {
    switch (whiteSpace) {
        case "preserve":
            return line;
        case "trim":
            return line.trim();
        case "fill": {
            const length = stripAnsi(line).trim().length;
            return line.trim() + " ".repeat(cols - length);
        }
    }
}

export function softWrap(
    text: string | ParsedText,
    cols: number,
    options: WrapOptions,
): string {
    const parsed = typeof text === "string" ? parse(text) : text;
    const rerender = stringify(parsed);
    let strippedLines = wordwrap.wrap(stripAnsi(parsed), {
        width: cols,
        break: true,
        noTrim: true,
    });
    let working = rerender.replaceAll("\n", "");
    let index = 0;
    let result = "";

    // biome-ignore lint/suspicious/noAssignInExpressions: To iterate until not found anymore
    while ((index = strippedLines.indexOf("\n")) !== -1) {
        working = insertAt(working, index, "\n");
        strippedLines = strippedLines.substring(index + 1);
        const [done, left] = working.split("\n");
        result += `${editLine(done, cols, options.whiteSpace)}\n`;
        working = left;
    }
    return result + working;
}

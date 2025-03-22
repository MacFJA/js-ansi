import { parse, stringify } from "../lexer-parser";
import { AnsiSequence, type ParsedText, TextSequence } from "../types";

/**
 * Return the ANSI position from a visual position
 * @param text The ANSI text to search in
 * @param visiblePosition The visible (printable) position
 */
export function ansiPosition(
    text: string | ParsedText,
    visiblePosition: number,
): number {
    const parsed = typeof text === "string" ? parse(text) : text;
    const rendered = stringify(parsed);
    if (parsed.find((v) => v instanceof AnsiSequence) === undefined) {
        return Math.min(rendered.length, visiblePosition);
    }
    let visible = 0;
    let ansi = 0;
    for (const parsedElement of parsed) {
        const length = parsedElement.sequence.length; //parsedElement.end - parsedElement.start
        if (parsedElement instanceof AnsiSequence) {
            ansi += length;
            continue;
        }
        if (visiblePosition > visible + length) {
            visible += length;
            ansi += length;
            continue;
        }
        const delta = visiblePosition - visible;
        return ansi + delta;
    }
    /* c8 ignore next 2 */
    return rendered.length;
}

/**
 * Remove all Ansi Escape Code from a text
 * @param text
 */
export function stripAnsi(text: string | ParsedText): string {
    const parsed = typeof text === "string" ? parse(text) : text;
    return parsed
        .filter((item) => item instanceof TextSequence)
        .map((item) => item.sequence)
        .join("");
}

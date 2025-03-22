import { toCloses, toReopens } from "../extensions";
import { parse, sequencesLength, stringify } from "../lexer-parser";
import type { AnsiSequence, ParsedText } from "../types";
import { ansiPosition } from "./strip";

export function leftOpened(text: string | ParsedText): Array<AnsiSequence> {
    let offset = 0;
    const parsed = typeof text === "string" ? parse(text) : text;
    const sequences: Array<AnsiSequence> = [];
    for (const toReopenFn of toReopens) {
        sequences.push(...toReopenFn(parsed, offset));
        offset = sequencesLength(sequences);
    }

    return sequences;
}
export function toClose(text: string | ParsedText): Array<AnsiSequence> {
    let offset = 0;
    const parsed = typeof text === "string" ? parse(text) : text;
    const sequences: Array<AnsiSequence> = [];
    for (const toCloseFn of toCloses) {
        sequences.push(...toCloseFn(parsed, offset));
        offset = sequencesLength(sequences);
    }

    return sequences;
}

/**
 * Insert a text into an Ansi text at a visible (printable) position
 * @param text The text to insert into
 * @param visiblePosition The visible (printable) position where to insert the text
 * @param value The text to insert
 */
export function insertAt(
    text: string | ParsedText,
    visiblePosition: number,
    value: string,
): string {
    const ansiPos = ansiPosition(text, visiblePosition);
    const rendered = typeof text === "string" ? text : stringify(text);
    const before = rendered.substring(0, ansiPos);
    const after = rendered.substring(ansiPos);

    return (
        before +
        stringify(toClose(before)) +
        value +
        stringify(toClose(value)) +
        stringify(leftOpened(before)) +
        after
    );
}

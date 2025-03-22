import regexpEscape from "regexp.escape";
import { matchers, postProcesses, registerAnsiMatcher } from "./extensions";
import {
    AnsiMatcher,
    AnsiSequence,
    FE_ESCAPE,
    type ParsedText,
    TextSequence,
} from "./types";

const CSI_numeric = [
    // CUU - Cursor Up
    "A",
    // CUD - Cursor Down
    "B",
    // CUF - Cursor Forward
    "C",
    // CUB - Cursor Back
    "D",
    // CNL - Cursor Next Line
    "E",
    // CPL - Cursor Previous Line
    "F",
    // CHA - Cursor Horizontal Absolute
    "G",
    // ED - Erase in Display
    "J",
    // EL - Erase in Line
    "K",
    // SU - Scroll Up
    "S",
    // SD - Scroll Down
    "T",
];
registerAnsiMatcher(
    ...CSI_numeric.map(
        (final) =>
            new AnsiMatcher(
                FE_ESCAPE.CSI,
                new RegExp(`${regexpEscape(FE_ESCAPE.CSI)}\\d*${final}`),
                FE_ESCAPE.CSI,
            ),
    ),
    // CUP - Cursor Position
    new AnsiMatcher(
        FE_ESCAPE.CSI,
        new RegExp(`${regexpEscape(FE_ESCAPE.CSI)}\\d*(?:;\\d*)?H`),
        FE_ESCAPE.CSI,
    ),
    // HVP - Horizontal Vertical Position
    new AnsiMatcher(
        FE_ESCAPE.CSI,
        new RegExp(`${regexpEscape(FE_ESCAPE.CSI)}\\d*(?:;\\d*)?f`),
        FE_ESCAPE.CSI,
    ),
    // AUX On
    new AnsiMatcher(
        FE_ESCAPE.CSI,
        new RegExp(regexpEscape(`${FE_ESCAPE.CSI}5i`)),
        `${FE_ESCAPE.CSI}5i`,
    ),
    // AUX Off
    new AnsiMatcher(
        FE_ESCAPE.CSI,
        new RegExp(regexpEscape(`${FE_ESCAPE.CSI}4i`)),
        `${FE_ESCAPE.CSI}4i`,
    ),
    // DSR - Device Status Report
    new AnsiMatcher(
        FE_ESCAPE.CSI,
        new RegExp(regexpEscape(`${FE_ESCAPE.CSI}6n`)),
        `${FE_ESCAPE.CSI}6n`,
    ),
);

/**
 * Parse a string into a series of Text and Ansi sequence
 * @param text
 */
export function parse(text: string): ParsedText {
    let search = String(text);
    let offset = 0;
    const ansiSeq: Array<AnsiSequence> = [];
    const textSeq: Array<TextSequence> = [];
    while (search.length > 0) {
        const match = findNextAnsi(search, offset);
        if (match === undefined) {
            break;
        }
        ansiSeq.push(match);
        offset = match.end - 1;
        search = text.substring(offset);
    }
    if (ansiSeq.length === 0) {
        return [new TextSequence(text, 0)];
    }
    if (ansiSeq[0].start > 0) {
        textSeq.push(new TextSequence(text.substr(0, ansiSeq[0].start), 0));
    }
    for (let index = 0; index < ansiSeq.length - 1; index++) {
        const current = ansiSeq[index];
        const next = ansiSeq[index + 1];
        if (current.end === next.start) {
            continue;
        }
        textSeq.push(
            new TextSequence(
                text.substr(current.end, next.start - current.end),
                current.end,
            ),
        );
    }
    if (ansiSeq[ansiSeq.length - 1].end < text.length) {
        textSeq.push(
            new TextSequence(
                text.substr(ansiSeq[ansiSeq.length - 1].end),
                ansiSeq[ansiSeq.length - 1].end,
            ),
        );
    }

    const sequences = [...ansiSeq, ...textSeq].toSorted(
        (first, second) => first.start - second.start,
    );
    return postProcesses.reduce(
        (processed, processor) => processor(processed),
        sequences,
    );
}

function findNextAnsi(text: string, positionOffset = 0) {
    const maybeMatch: AnsiSequence | undefined = matchers
        .map((matcher) => matcher.findInText(text, positionOffset))
        .filter((match) => match !== undefined)
        .toSorted((first, second) => {
            const start = first.start - second.start;
            if (start === 0) {
                return second.end - first.end;
            }
            return start;
        })[0];

    return maybeMatch;
}

export function sequencesLength(sequences: ParsedText): number {
    return (
        sequences.toSorted((first, second) => second.start - first.start).pop()
            ?.end ?? 0
    );
}

/**
 * Stringify a series of Text and Ansi sequence into a string
 * @param input
 */
export function stringify(input: ParsedText): string {
    return input.reduce((result, item) => result + item.sequence, "");
}

export function recalculatePosition(sequences: ParsedText): ParsedText {
    const result: ParsedText = [];
    let offset = 0;
    for (const sequence of sequences) {
        if (sequence instanceof TextSequence) {
            result.push(new TextSequence(sequence.sequence, offset));
            offset += sequence.sequence.length;
        }
        if (sequence instanceof AnsiSequence) {
            result.push(
                new AnsiSequence(sequence.kind, sequence.sequence, offset),
            );
            offset += sequence.sequence.length;
        }
    }
    return result;
}

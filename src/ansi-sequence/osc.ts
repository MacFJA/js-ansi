import { recalculatePosition, sequencesLength } from "../lexer-parser";
import {
    AnsiMatcher,
    AnsiSequence,
    FE_ESCAPE,
    OSC_LINK_CLOSE_REGEXP,
    OSC_LINK_OPEN_REGEXP,
    type ParsedText,
    TextSequence,
    type postprocess,
    type toClose as toCloseType,
    type toReopen as toReopenType,
} from "../types";

let lastId = 0;
const termination = FE_ESCAPE.ST;

export function resetLinkGeneratedId(): void {
    lastId = 0;
}

function isLinkHead(
    item: ParsedText[number],
): item is AnsiSequence & { kind: FE_ESCAPE.OSC } {
    if (item instanceof TextSequence) return false;
    if (item.kind !== FE_ESCAPE.OSC) return false;
    return OSC_LINK_OPEN_REGEXP.test(item.sequence);
}
function isLinkTail(item: ParsedText[number]): item is AnsiSequence {
    if (item instanceof TextSequence) return false;
    if (item.kind !== FE_ESCAPE.OSC) return false;
    return OSC_LINK_CLOSE_REGEXP.test(item.sequence);
}

function parseParams(input: string): Record<string, string> {
    if (input === "") return {};
    return Object.fromEntries(input.split(":").map((line) => line.split("=")));
}
function renderParams(input: Record<string, string>): string {
    return Object.entries(input)
        .map(([key, value]) => `${key}=${value}`)
        .join(":");
}

export const postprocessor: postprocess = (input) => {
    const result: ParsedText = [];
    for (const sequence of input) {
        if (isLinkHead(sequence)) {
            const matches = sequence.sequence.match(OSC_LINK_OPEN_REGEXP);
            if (matches === null) {
                throw new Error("Impossible");
            }
            const params = parseParams(matches.groups?.params ?? "");
            if (!Object.keys(params).includes("id")) {
                params.id = `__${++lastId}`;
            }
            const newSequence = `${FE_ESCAPE.OSC}8;${renderParams(params)};${matches.groups?.uri ?? ""}${termination}`;
            result.push(
                new AnsiSequence(FE_ESCAPE.OSC, newSequence, sequence.start),
            );
            continue;
        }
        if (sequence instanceof TextSequence) {
            result.push(new TextSequence(sequence.sequence, sequence.start));
        } else {
            result.push(
                new AnsiSequence(
                    sequence.kind,
                    sequence.sequence,
                    sequence.start,
                ),
            );
        }
    }

    return recalculatePosition(result);
};

function lastOpenLink(input: ParsedText): AnsiSequence | undefined {
    let found: AnsiSequence | undefined = undefined;
    for (const sequence of input) {
        if (isLinkHead(sequence)) {
            found = sequence;
            continue;
        }
        if (isLinkTail(sequence)) {
            found = undefined;
        }
    }
    return found;
}

export const toClose: toCloseType = (input, offset) => {
    const openLink: AnsiSequence | undefined = lastOpenLink(input);

    if (!openLink) {
        return [];
    }
    return [
        new AnsiSequence(
            FE_ESCAPE.OSC,
            `${FE_ESCAPE.OSC}8;;${termination}`,
            sequencesLength(input) + (offset ?? 0),
        ),
    ];
};

export const toReopen: toReopenType = (input, offset) => {
    const openLink: AnsiSequence | undefined = lastOpenLink(input);

    if (!openLink) {
        return [];
    }
    return [
        new AnsiSequence(
            FE_ESCAPE.OSC,
            openLink.sequence,
            sequencesLength(input) + (offset ?? 0),
        ),
    ];
};

// Hyperlink
export const matchers = [
    new AnsiMatcher(FE_ESCAPE.OSC, OSC_LINK_OPEN_REGEXP, `${FE_ESCAPE.OSC}8;`),
    new AnsiMatcher(
        FE_ESCAPE.OSC,
        OSC_LINK_CLOSE_REGEXP,
        `${FE_ESCAPE.OSC}8;;`,
    ),
];

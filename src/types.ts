import regexpEscape from "regexp.escape";

export enum FE_ESCAPE {
    // Single Shift Two
    SS2 = "\x1bN",
    // 	Single Shift Three
    SS3 = "\x1bO",
    // Device Control String
    DCS = "\x1bP",
    // Control Sequence Introducer
    CSI = "\x1b[",
    // 	String Terminator
    ST = "\x1b\\",
    // Operating System Command
    OSC = "\x1b]",
    // Start of String
    SOS = "\x1bX",
    // Privacy Message
    PM = "\x1b^",
    // Application Program Command
    APC = "\x1b_",
}

export const SGR_REGEXP = new RegExp(
    `${regexpEscape(FE_ESCAPE.CSI)}(?:(?<code>\\d*)|(?<codes>\\d*(?:;\\d+)+))m`,
    "",
);
const OSC_LINK_TERMINATOR = `${regexpEscape(FE_ESCAPE.ST)}|\x9c|\x07`;
export const OSC_LINK_OPEN_REGEXP = new RegExp(
    `${regexpEscape(`${FE_ESCAPE.OSC}8`)};(?<params>[^;]*);(?!${OSC_LINK_TERMINATOR})(?<uri>.+?)(?:${OSC_LINK_TERMINATOR})`,
);
export const OSC_LINK_CLOSE_REGEXP = new RegExp(
    `${regexpEscape(`${FE_ESCAPE.OSC}8`)};;(?:${OSC_LINK_TERMINATOR})`,
);

export class AnsiMatcher {
    kind: FE_ESCAPE;
    regexp: RegExp;
    quick: string;

    constructor(kind: FE_ESCAPE, regexp: RegExp, quickMatch: string) {
        this.kind = kind;
        this.regexp = regexp;
        this.quick = quickMatch;
    }

    findInText(text: string, positionOffset = 0): AnsiSequence | undefined {
        if (!text.includes(this.quick)) {
            return undefined;
        }

        const match = text.match(this.regexp);
        if (!match || match.index === undefined) {
            return undefined;
        }
        return new AnsiSequence(
            this.kind,
            match[0],
            match.index + positionOffset,
        );
    }
}

/**
 * A text portion from a parsed string
 */
export class TextSequence {
    public readonly sequence: string;
    public readonly start: number;

    constructor(sequence: string, start: number) {
        this.sequence = sequence;
        this.start = start;
    }

    get end(): number {
        return this.start + this.sequence.length;
    }
}
/**
 * An Ansi portion from a parsed string
 */
export class AnsiSequence {
    public readonly kind: FE_ESCAPE;
    public readonly sequence: string;
    public readonly start: number;

    constructor(kind: FE_ESCAPE, sequence: string, start: number) {
        this.kind = kind;
        this.sequence = sequence;
        this.start = start;
    }

    get end(): number {
        return this.start + this.sequence.length;
    }
}
export type ParsedText = Array<TextSequence | AnsiSequence>;

export type toClose = (
    input: ParsedText,
    offset?: number,
) => Array<AnsiSequence>;
export type toReopen = (
    input: ParsedText,
    offset?: number,
) => Array<AnsiSequence>;
export type postprocess = (input: ParsedText) => ParsedText;

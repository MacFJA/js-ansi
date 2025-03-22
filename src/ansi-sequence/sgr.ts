import { recalculatePosition, sequencesLength } from "../lexer-parser";
import {
    AnsiMatcher,
    AnsiSequence,
    FE_ESCAPE,
    type ParsedText,
    SGR_REGEXP,
    TextSequence,
    type postprocess,
    type toClose as toCloseType,
    type toReopen as toReopenType,
} from "../types";

const SGR_END = "m";
type SGRParameters = Array<number | null>;

function canFillDefinition(
    toFill: SGRParameters,
    withValues: Array<number>,
): boolean {
    if (toFill.length !== withValues.length) {
        return false;
    }
    for (let index = 0; index < toFill.length; index++) {
        if (toFill[index] !== withValues[index] && toFill[index] !== null) {
            return false;
        }
    }
    return true;
}

class SGRDefinition {
    private readonly parametersDefinition: SGRParameters;

    constructor(
        parameters: SGRParameters,
        readonly close: number,
        readonly closeBy: Array<SGRParameters>,
    ) {
        this.parametersDefinition = parameters;
    }

    isParamsValid(params: Array<number>): boolean {
        const work = [...params];
        const toFind = [...this.parametersDefinition];
        const result = [];
        while (work.length > 0 || toFind.length > 0) {
            if (work[0] === toFind[0] || toFind[0] === null) {
                result.push(work[0]);
                work.pop();
                toFind.pop();
                continue;
            }
            return false;
        }
        return toFind.length === 0;
    }
    get parameterCount(): number {
        return this.parametersDefinition.length;
    }
}
class SGRAction {
    isClosed = false;
    constructor(
        readonly def: SGRDefinition,
        readonly params: Array<number>,
    ) {}
    closableBy(params: Array<number>): boolean {
        return this.def.closeBy
            .toSorted((first, second) => second.length - first.length)
            .some((group) => canFillDefinition(group, params));
    }
}
const fontCloseBy: Array<SGRParameters> = [
    [0],
    [10],
    [11],
    [12],
    [13],
    [14],
    [15],
    [16],
    [17],
    [18],
    [19],
];
const foregroundCloseBy: Array<SGRParameters> = [
    // reset
    [0],
    [39],
    // Standard color
    [30],
    [31],
    [32],
    [33],
    [34],
    [35],
    [36],
    [37],
    // 8-bit color
    [38, 5, null],
    // 24-bit color
    [38, 2, null, null, null],
    // Bright color
    [90],
    [91],
    [92],
    [93],
    [94],
    [95],
    [96],
    [97],
];
const backgroundCloseBy: Array<SGRParameters> = [
    // reset
    [0],
    [49],
    // Standard color
    [40],
    [41],
    [42],
    [43],
    [44],
    [45],
    [46],
    [47],
    // 8-bit color
    [48, 5, null],
    // 24-bit color
    [48, 2, null, null, null],
    // Bright color
    [100],
    [101],
    [102],
    [103],
    [104],
    [105],
    [106],
    [107],
];
const ideogramCloseBy: Array<SGRParameters> = [
    [0],
    [60],
    [61],
    [62],
    [63],
    [64],
    [65],
];
const definitions: Array<SGRDefinition> = [
    // Bold
    new SGRDefinition([1], 22, [[0], [1], [2], [22]]),
    // Dim
    new SGRDefinition([2], 22, [[0], [1], [2], [22]]),
    // Italic
    new SGRDefinition([3], 23, [[0], [23], [3]]),
    // Underline
    new SGRDefinition([4], 24, [[0], [24]]),
    // Slow blink
    new SGRDefinition([5], 25, [[0], [25], [5], [6]]),
    // Rapid Blink
    new SGRDefinition([6], 25, [[0], [25], [5], [6]]),
    // Invert
    new SGRDefinition([7], 27, [[0], [27], [7]]),
    // Hide
    new SGRDefinition([8], 28, [[0], [28], [8]]),
    // Strike
    new SGRDefinition([9], 29, [[0], [29], [9]]),
    // Spacing
    new SGRDefinition([26], 50, [[0], [50], [26]]),
    // Font
    new SGRDefinition([10], 10, fontCloseBy),
    new SGRDefinition([11], 10, fontCloseBy),
    new SGRDefinition([12], 10, fontCloseBy),
    new SGRDefinition([13], 10, fontCloseBy),
    new SGRDefinition([14], 10, fontCloseBy),
    new SGRDefinition([15], 10, fontCloseBy),
    new SGRDefinition([16], 10, fontCloseBy),
    new SGRDefinition([17], 10, fontCloseBy),
    new SGRDefinition([18], 10, fontCloseBy),
    new SGRDefinition([19], 10, fontCloseBy),
    // Foreground
    new SGRDefinition([30], 39, foregroundCloseBy),
    new SGRDefinition([31], 39, foregroundCloseBy),
    new SGRDefinition([32], 39, foregroundCloseBy),
    new SGRDefinition([33], 39, foregroundCloseBy),
    new SGRDefinition([34], 39, foregroundCloseBy),
    new SGRDefinition([35], 39, foregroundCloseBy),
    new SGRDefinition([36], 39, foregroundCloseBy),
    new SGRDefinition([37], 39, foregroundCloseBy),
    new SGRDefinition([38, 5, null], 39, foregroundCloseBy),
    new SGRDefinition([38, 2, null, null, null], 39, foregroundCloseBy),
    new SGRDefinition([90], 39, foregroundCloseBy),
    new SGRDefinition([91], 39, foregroundCloseBy),
    new SGRDefinition([92], 39, foregroundCloseBy),
    new SGRDefinition([93], 39, foregroundCloseBy),
    new SGRDefinition([94], 39, foregroundCloseBy),
    new SGRDefinition([95], 39, foregroundCloseBy),
    new SGRDefinition([96], 39, foregroundCloseBy),
    new SGRDefinition([97], 39, foregroundCloseBy),
    // Background
    new SGRDefinition([40], 49, backgroundCloseBy),
    new SGRDefinition([41], 49, backgroundCloseBy),
    new SGRDefinition([42], 49, backgroundCloseBy),
    new SGRDefinition([43], 49, backgroundCloseBy),
    new SGRDefinition([44], 49, backgroundCloseBy),
    new SGRDefinition([45], 49, backgroundCloseBy),
    new SGRDefinition([46], 49, backgroundCloseBy),
    new SGRDefinition([47], 49, backgroundCloseBy),
    new SGRDefinition([48, 5, null], 49, backgroundCloseBy),
    new SGRDefinition([48, 2, null, null, null], 49, backgroundCloseBy),
    new SGRDefinition([100], 49, backgroundCloseBy),
    new SGRDefinition([101], 49, backgroundCloseBy),
    new SGRDefinition([102], 49, backgroundCloseBy),
    new SGRDefinition([103], 49, backgroundCloseBy),
    new SGRDefinition([104], 49, backgroundCloseBy),
    new SGRDefinition([105], 49, backgroundCloseBy),
    new SGRDefinition([106], 49, backgroundCloseBy),
    new SGRDefinition([107], 49, backgroundCloseBy),
    // Frame and Encircled
    new SGRDefinition([51], 54, [[0], [51], [52], [54]]),
    new SGRDefinition([52], 54, [[0], [51], [52], [54]]),
    // Overline
    new SGRDefinition([53], 55, [[0], [53], [55]]),
    // Underline color
    new SGRDefinition([58, 5, null], 59, [
        [0],
        [59],
        [58, 5, null],
        [58, 2, null, null, null],
    ]),
    new SGRDefinition([58, 2, null, null, null], 59, [
        [0],
        [59],
        [58, 5, null],
        [58, 2, null, null, null],
    ]),
    // Ideogram
    new SGRDefinition([60], 65, ideogramCloseBy),
    new SGRDefinition([61], 65, ideogramCloseBy),
    new SGRDefinition([62], 65, ideogramCloseBy),
    new SGRDefinition([63], 65, ideogramCloseBy),
    new SGRDefinition([64], 65, ideogramCloseBy),
    // Super/Sub script
    new SGRDefinition([73], 75, [[0], [73], [74], [75]]),
    new SGRDefinition([74], 75, [[0], [73], [74], [75]]),
];
const allClosing = [0, ...definitions.map((def) => def.close)];

function extractCodes(sequence: string): Array<number> {
    const matches = sequence.match(SGR_REGEXP);
    if (matches === null) return [];

    // No code is same as 0
    if (matches.groups?.code === "") {
        return [0];
    }

    if (matches.groups?.code) {
        return [Number(matches.groups?.code)];
    }
    if (matches.groups?.codes) {
        return matches.groups?.codes.split(";").map(Number);
    }
    /* c8 ignore next 2 */
    return [];
}

export function getCodes(sequences: Array<AnsiSequence>): Array<number> {
    return sequences
        .filter(
            (sequence) =>
                sequence.sequence.startsWith(FE_ESCAPE.CSI) &&
                sequence.sequence.endsWith("m"),
        )
        .flatMap((sequence) => extractCodes(sequence.sequence));
}

export function simplifyCodes(codes: Array<number>): Array<number> {
    const left: Array<number> = [...codes];
    const actions: Array<SGRAction> = [];
    let iteration = 0;
    codeLoop: while (left.length > 0) {
        iteration++;
        /* c8 ignore next 3 */
        if (iteration > codes.length) {
            throw new Error("Outbound");
        }

        const firstCode = left[0];
        const toClose = actions.find(
            (action) =>
                action.isClosed === false &&
                action.def.closeBy.some(
                    (closeCode) => closeCode.join("|") === String(firstCode),
                ),
        );

        if (toClose) {
            toClose.isClosed = true;
            left.shift();
            continue;
        }

        for (const definition of definitions.toSorted(
            (first, second) => second.parameterCount - first.parameterCount,
        )) {
            const params = left.slice(0, definition.parameterCount);
            if (definition.isParamsValid(params)) {
                const toClose = actions.find(
                    (action) =>
                        action.isClosed === false && action.closableBy(params),
                );

                if (toClose) {
                    toClose.isClosed = true;
                }

                actions.push(new SGRAction(definition, params));
                left.splice(0, params.length);
                continue codeLoop;
            }
        }

        if (allClosing.includes(firstCode)) {
            for (const action of actions) {
                if (action.closableBy([firstCode])) {
                    action.isClosed = true;
                }
            }
            left.splice(0, 1);
            continue;
        }

        throw new Error("Invalid code");
    }

    return actions
        .filter((action) => action.isClosed === false)
        .flatMap((action) => action.params);
}
export function closeCodes(codes: Array<number>) {
    const left: Array<number> = [...simplifyCodes(codes)];
    const actions: Array<SGRAction> = [];
    let iteration = 0;
    codeLoop: while (left.length > 0) {
        iteration++;
        /* c8 ignore next 3 */
        if (iteration > codes.length) {
            throw new Error("Outbound");
        }
        for (const definition of definitions.toSorted(
            (first, second) => second.parameterCount - first.parameterCount,
        )) {
            const params = left.slice(0, definition.parameterCount);
            if (definition.isParamsValid(params)) {
                actions.push(new SGRAction(definition, params));
                left.splice(0, params.length);
                continue codeLoop;
            }
        }
        /* c8 ignore next 2 */
        throw new Error("Invalid code");
    }

    return actions
        .filter((action) => action.isClosed === false)
        .map((action) => action.def.close);
}

export const toClose: toCloseType = (input: ParsedText, offset?: number) => {
    const parsed = input.filter((item) => item instanceof AnsiSequence);
    const close = closeCodes(getCodes(parsed));

    if (close.length === 0) return [];

    return [
        new AnsiSequence(
            FE_ESCAPE.CSI,
            `${FE_ESCAPE.CSI}${close.join(";")}${SGR_END}`,
            sequencesLength(input) + (offset ?? 0),
        ),
    ];
};

export const toReopen: toReopenType = (input: ParsedText, offset?: number) => {
    const parsed = input.filter((item) => item instanceof AnsiSequence);
    const simplified = simplifyCodes(getCodes(parsed));

    if (simplified.length === 0) return [];

    return [
        new AnsiSequence(
            FE_ESCAPE.CSI,
            `${FE_ESCAPE.CSI}${simplified.join(";")}${SGR_END}`,
            sequencesLength(input) + (offset ?? 0),
        ),
    ];
};

/**
 * Merge consecutive SGR
 * @param input
 */
export const postprocessor: postprocess = (input) => {
    const result: ParsedText = [];

    if (input.length < 2) {
        return input;
    }

    for (let index = 0; index < input.length; index++) {
        const sequence = input[index];
        const nextSequence = input[index + 1] ?? undefined;

        if (sequence instanceof TextSequence) {
            result.push(new TextSequence(sequence.sequence, sequence.start));
            continue;
        }
        if (
            nextSequence === undefined ||
            nextSequence instanceof TextSequence
        ) {
            result.push(
                new AnsiSequence(
                    sequence.kind,
                    sequence.sequence,
                    sequence.start,
                ),
            );
            continue;
        }

        const currentCode = getCodes([sequence]);
        const nextCode = getCodes([nextSequence]);

        if (currentCode.length === 0 || nextCode.length === 0) {
            result.push(
                new AnsiSequence(
                    sequence.kind,
                    sequence.sequence,
                    sequence.start,
                ),
            );
            continue;
        }

        const newSequence =
            FE_ESCAPE.CSI + [...currentCode, ...nextCode].join(";") + SGR_END;
        result.push(
            new AnsiSequence(FE_ESCAPE.CSI, newSequence, sequence.start),
        );
        index++;
    }

    return recalculatePosition(result);
};

// SGR - Select Graphic Rendition
export const matcher = new AnsiMatcher(
    FE_ESCAPE.CSI,
    SGR_REGEXP,
    FE_ESCAPE.CSI,
);

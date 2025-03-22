import { InvalidChar } from "../errors";
import { type WrapOptions, stripAnsi, wrap } from "../index";

export type EncapsulateOption = {
    /**
     * Set to true if the decorator add char before the first line of the input text
     */
    beforeLine?: boolean;
    /**
     * Set to true if the decorator need add char(s) before each line
     */
    beforeCol?: boolean;
    /**
     * Set to true if the decorator add char after the last line of the input text
     */
    afterLine?: boolean;
    /**
     * Set to true if the decorator need add char(s) after each line
     */
    afterCol?: boolean;
    /**
     * The decorator function will be call multiple times:
     * - With `line` === -1, and `col` from 0 (or -1) to `cols` - 1 (or `cols`) if `beforeLine` is `true`
     * - With `line` === `lines`, and `col` from 0 (or -1) to `cols` - 1 (or `cols`) if `afterLine` is `true`
     * - With `col` === -1, and `line` from 0 (or -1) to `lines` - 1 (or `lines`) if `beforeCol` is `true`
     * - With `col` === `cols`, and `line` from 0 (or -1) to `lines` - 1 (or `lines`) if `afterCol` is `true`
     * @param line
     * @param col
     * @param lines
     * @param cols
     */
    decorator: (
        line: number,
        col: number,
        lines: number,
        cols: number,
    ) => string;
};
export const ASCIIBox = boxChar("+", "+", "+", "+", "-", "-", "|", "|");
export const roundedBox = boxChar("╭", "╮", "╰", "╯", "─", "─", "│", "│");
export const doubleSquareBox = boxChar("╔", "╗", "╚", "╝", "═", "═", "║", "║");
export const squareBox = boxChar("┌", "┐", "└", "┘", "─", "─", "│", "│");
export function boxChar(
    topLeft: string,
    topRight: string,
    bottomLeft: string,
    bottomRight: string,
    top: string,
    bottom: string,
    left: string,
    right: string,
): EncapsulateOption {
    if (
        `${top}${topRight}${topLeft}${bottom}${bottomLeft}${left}${right}`.includes(
            "\n",
        )
    ) {
        throw new InvalidChar(
            "The properties top, topRight, topLeft, bottom, bottomLeft, left, right can't contain a new line",
        );
    }
    if (stripAnsi(top).length > 1 || stripAnsi(bottom).length > 1) {
        throw new InvalidChar(
            "The properties top and bottom must be only one char",
        );
    }

    return {
        beforeCol: left.length > 0,
        afterCol: right.length > 0,
        beforeLine: top.length > 0,
        afterLine: bottom.length > 0,
        decorator: (line, col, lines, cols) => {
            if (line === -1 && col === -1) {
                return topLeft;
            }
            if (line === -1 && col === cols) {
                return topRight;
            }
            if (line === lines && col === -1) {
                return bottomLeft;
            }
            if (line === lines && col === cols) {
                return bottomRight;
            }
            if (line === -1) {
                return top;
            }
            if (line === lines) {
                return bottom;
            }
            if (col === -1) {
                return left;
            }
            if (col === cols) {
                return right;
            }
            return " ";
        },
    };
}
export const curlyBracket: EncapsulateOption = {
    afterLine: false,
    beforeLine: false,
    beforeCol: true,
    afterCol: false,
    decorator: (line, col, lines, cols) => {
        if (lines === 1) {
            return "{ ";
        }
        if (lines === 2) {
            return line === 0 ? "⎰ " : "⎱ ";
        }
        if (lines % 2 === 1) {
            if (line === 0) {
                return "⎧ ";
            }
            if (line === lines - 1) {
                return "⎩ ";
            }
            if (line === (lines - 1) / 2) {
                return "⎨ ";
            }
            return "⎪ ";
        }
        if (lines % 2 === 0) {
            if (line === 0) {
                return "⎧ ";
            }
            if (line === lines - 1) {
                return "⎩ ";
            }
            if (line === lines / 2 - 1) {
                return "⎭ ";
            }
            if (line === lines / 2) {
                return "⎫ ";
            }
            return "⎪ ";
        }
        return " ";
    },
};
export function padding(
    top: number,
    right: number,
    bottom: number,
    left: number,
): EncapsulateOption {
    return {
        beforeLine: top > 0,
        afterLine: bottom > 0,
        beforeCol: left > 0,
        afterCol: right > 0,
        decorator: (line, col, lines, cols) => {
            if (line === -1 && col === 0) {
                return "\n".repeat(top - 1);
            }
            if (col === -1 && line >= 0 && line < lines)
                return " ".repeat(left);
            if (col === cols && line >= 0 && line < lines)
                return " ".repeat(right);
            if (line === lines && col === 0) {
                return "\n".repeat(bottom - 1);
            }
            return " ";
        },
    };
}

export function encapsulate(input: string, options: EncapsulateOption): string {
    let result = "";
    const opts: Required<EncapsulateOption> = {
        beforeLine: false,
        beforeCol: false,
        afterLine: false,
        afterCol: false,
        ...options,
    };

    const lines = input.split("\n");
    const wrapSize = lines.reduce((max, line) => Math.max(max, line.length), 0);

    if (opts.beforeLine) {
        for (
            let index = -Number(opts.beforeCol);
            index < wrapSize + Number(opts.afterCol);
            index++
        ) {
            result += opts.decorator(-1, index, lines.length, wrapSize);
        }
        result += "\n";
    }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (opts.beforeCol) {
            result += opts.decorator(lineIndex, -1, lines.length, wrapSize);
        }
        result += lines[lineIndex];
        if (opts.afterCol) {
            result += " ".repeat(wrapSize - lines[lineIndex].length);
            result += opts.decorator(
                lineIndex,
                wrapSize,
                lines.length,
                wrapSize,
            );
        }
        result += "\n";
    }

    if (opts.afterLine) {
        for (
            let index = -Number(opts.beforeCol);
            index < wrapSize + Number(opts.afterCol);
            index++
        ) {
            result += opts.decorator(
                lines.length,
                index,
                lines.length,
                wrapSize,
            );
        }
        result += "\n";
    }

    return result;
}

export type Decorator = (input: string) => string;

export function createWrapDecorator(
    cols: number,
    options: WrapOptions,
): Decorator {
    return (input: string) => {
        return wrap(input, cols, options);
    };
}
export function createEncapsulateDecorator(
    cols: number,
    options: EncapsulateOption,
): Decorator {
    return (input: string) => {
        let result = "";
        const inputLine = input.split("\n");
        const lines = inputLine.length;
        const opts: Required<EncapsulateOption> = {
            beforeLine: false,
            beforeCol: false,
            afterLine: false,
            afterCol: false,
            ...options,
        };
        if (opts.beforeLine) {
            for (
                let index = -Number(opts.beforeCol);
                index < cols + Number(opts.afterCol);
                index++
            ) {
                result += opts.decorator(-1, index, lines, cols);
            }
            result += "\n";
        }

        for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
            if (opts.beforeCol) {
                result += opts.decorator(lineIndex, -1, lines, cols);
            }
            result += inputLine[lineIndex];
            if (opts.afterCol) {
                result += " ".repeat(cols - inputLine[lineIndex].length);
                result += opts.decorator(lineIndex, cols, lines, cols);
            }
            result += "\n";
        }

        if (opts.afterLine) {
            for (
                let index = -Number(opts.beforeCol);
                index < cols + Number(opts.afterCol);
                index++
            ) {
                result += opts.decorator(lines, index, lines, cols);
            }
            result += "\n";
        }

        return result.substring(0, result.length - 1);
    };
}

export function multiDecorator(...decorators: Array<Decorator>): Decorator {
    return (input) =>
        decorators.reduce((newInput, decorator) => decorator(newInput), input);
}

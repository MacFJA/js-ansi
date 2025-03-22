# @macfja/ansi

A lib to handle operation on ANSI text

## Installation

```shell
npm install @macfja/ansi
# or
pnpm add --save @macfja/ansi
# or
yarn add --save @macfja/ansi
```

## API

### Main package

#### `parse` function

Parse a string and return a list of text or ansi sequence.

```ts
/**
 * Parse a string into a series of Text and Ansi sequence
 * @param text
 */
declare function parse(text: string): ParsedText;
```

#### `stringify` function

Transform a list of sequence to a ANSI text (reverse of `parse`)

```ts
/**
 * Stringify a series of Text and Ansi sequence into a string
 * @param input
 */
declare function stringify(input: ParsedText): string;
```

#### `insertAt` function

Insert a string inside an ansi text at a visual position.  
The inserted string is isolated from the ansi text (ANSI instruction are stop before the inserted text, and restarted after it).

```ts
/**
 * Insert a text into an Ansi text at a visible (printable) position
 * @param text The text to insert into
 * @param visiblePosition The visible (printable) position where to insert the text
 * @param value The text to insert
 */
declare function insertAt(text: string | ParsedText, visiblePosition: number, value: string): string;
```

#### `wrap` function

Wrap an ANSI text at a defined size.  
Can be a hard wrap or a soft wrap (if it can, it won't break word)

```ts
/**
 * Wrap an Ansi text within a defined length
 * @param text The text to wrap
 * @param cols The maximum width of the text
 * @param options
 */
declare function wrap(text: string, cols: number, options?: WrapOptions): string;

type WrapOptions = {
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
```

#### `stripAnsi` function

Remove all ANSI instruction from a text

```ts
/**
 * Remove all Ansi Escape Code from a text
 * @param text
 */
declare function stripAnsi(text: string | ParsedText): string;
```

#### `ansiPosition` function

Return the ANSI position from a visual position

```ts
/**
 * Return the ANSI position from a visual position
 * @param text The ANSI text to search in
 * @param visiblePosition The visible (printable) position
 */
declare function ansiPosition(text: string | ParsedText, visiblePosition: number): number;
```

#### `truncate` function

Truncate (no wrapping) an ANSI text at a defined size.  
Text can be truncate at the start, the end or in the middle

```ts
/**
 * Limit the length of an Ansi text by truncating it if needed
 * @param text The text to truncate
 * @param cols The maximum width of the text
 * @param position Where to truncate [default: "end"]
 */
declare function truncate(text: string, cols: number, position?: "start" | "middle" | "end"): string;
```

### Extensions package

You can extend the behavior of this lib with extensions:

#### Finding an ANSI code

The library come with many standard ANSI escape code:

| Code       | Name                                      |
|------------|-------------------------------------------|
| CUU        | Cursor Up                                 |
| CUD        | Cursor Down                               |
| CUF        | Cursor Forward                            |
| CUB        | Cursor Back                               |
| CNL        | Cursor Next Line                          |
| CPL        | Cursor Previous Line                      |
| CHA        | Cursor Horizontal Absolute                |
| ED         | Erase in Display                          |
| EL         | Erase in Line                             |
| SU         | Scroll Up                                 |
| SD         | Scroll Down                               |
| CUP        | Cursor Position                           |
| HVP        | Horizontal Vertical Position              |
|            | AUX  On                                   |
|            | AUX  Off                                  |
| DSR        | Device Status Report                      |
| SGR        | Select Graphic Rendition                  |
| OSC (link) | Operating System Command (Hypertext Link) |

But there are many more code (standard and non-standard).

To add the capacity to correctly parse them, you can add new ANSI code matcher:

<details>
<summary>Example: Implementation of the "Disable reporting focus" code</summary>

```ts
import { registerAnsiMatcher, AnsiMatcher, FE_ESCAPE } from "@macfja/ansi/extension"
import regexpEscape from "regexp.escape";

const noReportFocus = new AnsiMatcher(
    // The Ansi Escape code category 
    FE_ESCAPE.CSI,
    // The regular expression that match the escape code (the match '0' will be used)
    new RegExp(regexpEscape(`${FE_ESCAPE.CSI}?1004l`)),
    // The non dynamic part of the escape code (use to quickly search in text)
    `${FE_ESCAPE.CSI}?1004l`
)
registerAnsiMatcher(noReportFocus)
```

</details>

#### Optimizing the parser result

Sometimes an ANSI text can be optimized,
for example with SGR multiple instruction can be grouped together (like foreground color, background color, etc.).
To do those optimisation, a postprecessor can be applied after the parsing of the text:

<details>
<summary>Example: remplacing matching 24bit color with 3/4 bit color</summary>

```ts
import { type postprocess, registerPostprocess, recalculatePosition, type ParsedText, AnsiSequence, FE_ESCAPE } from "@macfja/ansi/extension"

const colorPostprocessor: postprocess = (input: ParsedText) => {
    // VGA Color
    // https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
    const colorMap = {
        0: [0,0,0],
        1: [170,0,0],
        2: [0,170,0],
        3: [170,85,0],
        4: [0,0,170],
        5: [170,0,170],
        6: [0,170,170],
        7: [170,170,170],
    }
    return recalculatePosition(input.map(item => {
        if (
            !(item instanceof AnsiSequence)
            || item.kind !== FE_ESCAPE.CSI
            || !item.sequence.endsWith('m')
            || !item.sequence.startsWith(`${FE_ESCAPE.CSI}38;2;`)
            || !item.sequence.startsWith(`${FE_ESCAPE.CSI}48;2;`)
        ) {
            return item;
        }
        const color = item.sequence.match(/(?<type>[34]8;2;(?<r>\d+);(?<g>\d+);(?<b>\d+)m$/)
        if (color.groups?.type === undefined || color.groups?.r === undefined || color.groups?.g === undefined || color.groups?.b === undefined) {
            return item;
        }
        const colorCode = colorMap.findIndex(codes => codes.join('-') === `${color.groups.r}-${color.groups.g}-${color.groups.b}`)
        if (colorCode === undefined) {
            return item
        }
        return new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}${color.groups.type}${colorCode}m`, item.start)
    }))
}

registerPostprocess(colorPostprocessor)
```

</details>


#### Sequence cutting helper

When doing some operation of ANSI text (inserting a char, wrapping lines, etc.),
we need to close any ANSI code that is still affect the rendering, and reopen everything after.
To do so, there are 2 functions (one for closing code, one for reopening them)

```ts
declare function registerToClose(fn: toClose): void;
declare function registerToReopen(fn: toReopen): void;
type toClose = (input: ParsedText, offset?: number) => Array<AnsiSequence>;
type toReopen = (input: ParsedText, offset?: number) => Array<AnsiSequence>;
```

### Decorate package

The decorate package come with a function to decorate a text:

```ts
declare function encapsulate(input: string, options: EncapsulateOption): string;
```

The function second parameter is an object describing how to decorate the text:

```ts
type EncapsulateOption = {
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
    decorator: (line: number, col: number, lines: number, cols: number) => string;
};
```

Several pre-made EncapsulateOption are available:

- `ASCIIBox`: Create a box with `+`, `-` and `|`
- `roundedBox`: Create a box with a continuous line with rounded border
- `doubleSquareBox`: : Create a box with a continuous double line
- `squareBox`: : Create a box with a continuous line
- `curlyBracket`: Prefix the text with a big curly bracket
- `padding()`: A function to create a padding/margin space around the text
- `boxChar()`: A function to create a box

<details>
<summary>Examples</summary>

**roundedBox**

```ts
import { encapsulate, squareBox } from "@macfja/ansi/decorate"

console.log(encapsulate(' Lorem ipsum dolor sit amet,  \n consectetur adipiscing elit. ', roundedBox))
```

```text
╭──────────────────────────────╮
│ Lorem ipsum dolor sit amet,  │
│ consectetur adipiscing elit. │
╰──────────────────────────────╯
```

---

**curlyBracket**

```ts
import { encapsulate, curlyBracket } from "@macfja/ansi/decorate"

console.log(encapsulate('Lorem ipsum\ndolor sit\namet,\nconsectetur\nadipiscing elit.', curlyBracket))
```

```text
⎧ Lorem ipsum
⎪ dolor sit
⎨ amet,
⎪ consectetur
⎩ adipiscing elit.
```

</details>

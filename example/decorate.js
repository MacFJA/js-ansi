import {
    boxChar,
    createEncapsulateDecorator,
    createWrapDecorator,
    curlyBracket,
    doubleSquareBox,
    encapsulate,
    multiDecorator,
    padding,
    roundedBox,
} from "../src/decorate.js";

function createSection(cols) {
    const wrapped = createWrapDecorator(cols - 4, {
        whiteSpace: "fill",
        break: "word",
    });
    const box = createEncapsulateDecorator(
        cols,
        boxChar(
            "\x1b[36m╭─\x1b[39m",
            "\x1b[36m─╮\x1b[39m",
            "\x1b[36m╰─\x1b[39m",
            "\x1b[36m─╯\x1b[39m",
            "\x1b[36m─\x1b[39m",
            "\x1b[36m─\x1b[39m",
            "\x1b[36m│\x1b[39m ",
            " \x1b[36m│\x1b[39m",
        ),
    );
    return (input) => box(wrapped(input));
}

const section = createSection(40);
console.log(
    section(
        "Hello world!\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
);

const alert = (cols) =>
    multiDecorator(
        createWrapDecorator(cols - 4, {
            whiteSpace: "fill",
            break: "word",
        }),

        createEncapsulateDecorator(
            cols,
            boxChar(
                "\x1b[31m╓─\x1b[39m",
                "\x1b[31m─╖\x1b[39m",
                "\x1b[31m╙─\x1b[39m",
                "\x1b[31m─╜\x1b[39m",
                "\x1b[31m─\x1b[39m",
                "\x1b[31m─\x1b[39m",
                "\x1b[31m║\x1b[39m ",
                " \x1b[31m║\x1b[39m",
            ),
        ),
    );
console.log(
    alert(40)(
        "Hello world!\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
);

console.log(
    multiDecorator(
        createWrapDecorator(20, { break: "word", whiteSpace: "trim" }),
        createEncapsulateDecorator(22, curlyBracket),
        createEncapsulateDecorator(24, padding(1, 0, 1, 2)),
        createEncapsulateDecorator(26, doubleSquareBox),
    )("Hello world!\nLorem ipsum dolor sit amet, consectetur adipiscing elit."),
);

console.log(
    encapsulate(
        " Lorem ipsum dolor sit amet,  \n consectetur adipiscing elit. ",
        roundedBox,
    ),
);
console.log(
    encapsulate(
        "Lorem ipsum\ndolor sit\namet,\nconsectetur\nadipiscing elit.",
        curlyBracket,
    ),
);

import test from "ava";
import {
    ASCIIBox,
    curlyBracket,
    doubleSquareBox,
    encapsulate,
    roundedBox,
    squareBox,
} from "../../src/display/decorate.js";

const text = "Lorem ipsum\ndolor sit amet,\nconsectetur adipiscing elit.";

test(`Test ${encapsulate.name} function with normal text (ASCIIBox)`, (t) => {
    t.is(
        encapsulate(text, ASCIIBox),
        "+----------------------------+\n" +
            "|Lorem ipsum                 |\n" +
            "|dolor sit amet,             |\n" +
            "|consectetur adipiscing elit.|\n" +
            "+----------------------------+\n",
    );
});

test(`Test ${encapsulate.name} function with normal text (curlyBracket - 1 line)`, (t) => {
    t.is(
        encapsulate("Lorem ipsum dolor sit amet", curlyBracket),
        "{ Lorem ipsum dolor sit amet\n",
    );
});

test(`Test ${encapsulate.name} function with normal text (curlyBracket - 2 lines)`, (t) => {
    t.is(encapsulate("1\n2", curlyBracket), "⎰ 1\n" + "⎱ 2\n");
});

test(`Test ${encapsulate.name} function with normal text (curlyBracket - 3 lines)`, (t) => {
    t.is(
        encapsulate(text, curlyBracket),
        "⎧ Lorem ipsum\n" +
            "⎨ dolor sit amet,\n" +
            "⎩ consectetur adipiscing elit.\n",
    );
});

test(`Test ${encapsulate.name} function with normal text (curlyBracket - 4 lines)`, (t) => {
    t.is(
        encapsulate("1\n2\n3\n4", curlyBracket),
        "⎧ 1\n" + "⎭ 2\n" + "⎫ 3\n" + "⎩ 4\n",
    );
});
test(`Test ${encapsulate.name} function with normal text (curlyBracket - 5 lines)`, (t) => {
    t.is(
        encapsulate("1\n2\n3\n4\n5", curlyBracket),
        "⎧ 1\n" + "⎪ 2\n" + "⎨ 3\n" + "⎪ 4\n" + "⎩ 5\n",
    );
});
test(`Test ${encapsulate.name} function with normal text (curlyBracket - 6 lines)`, (t) => {
    t.is(
        encapsulate("1\n2\n3\n4\n5\n6", curlyBracket),
        "⎧ 1\n" + "⎪ 2\n" + "⎭ 3\n" + "⎫ 4\n" + "⎪ 5\n" + "⎩ 6\n",
    );
});

test(`Test ${encapsulate.name} function with normal text (squareBox)`, (t) => {
    t.is(
        encapsulate(text, squareBox),
        "┌────────────────────────────┐\n" +
            "│Lorem ipsum                 │\n" +
            "│dolor sit amet,             │\n" +
            "│consectetur adipiscing elit.│\n" +
            "└────────────────────────────┘\n",
    );
});
test(`Test ${encapsulate.name} function with normal text (roundedBox)`, (t) => {
    t.is(
        encapsulate(text, roundedBox),
        "╭────────────────────────────╮\n" +
            "│Lorem ipsum                 │\n" +
            "│dolor sit amet,             │\n" +
            "│consectetur adipiscing elit.│\n" +
            "╰────────────────────────────╯\n",
    );
});
test(`Test ${encapsulate.name} function with normal text (doubleSquareBox)`, (t) => {
    t.is(
        encapsulate(text, doubleSquareBox),
        "╔════════════════════════════╗\n" +
            "║Lorem ipsum                 ║\n" +
            "║dolor sit amet,             ║\n" +
            "║consectetur adipiscing elit.║\n" +
            "╚════════════════════════════╝\n",
    );
});

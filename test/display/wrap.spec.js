import test from "ava";
import { resetLinkGeneratedId } from "../../src/ansi-sequence/osc.js";
import { hardWrap, softWrap } from "../../src/display/wrap.js";
import { wrap } from "../../src/index.js";

const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const ansiText =
    "Check out \u001B]8;;https://www.example.com\u0007\x1B[1mmy\x1B[22m website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.";

test(`Test ${hardWrap.name} function with normal text (hard wrap)`, (t) => {
    t.is(
        hardWrap(text, 10, { whiteSpace: "preserve", break: "char" }),
        "Lorem ipsu\nm dolor si\nt amet, co\nnsectetur \nadipiscing\n elit.",
    );
    t.is(
        wrap(text, 10, { whiteSpace: "preserve", break: "char" }),
        "Lorem ipsu\nm dolor si\nt amet, co\nnsectetur \nadipiscing\n elit.",
    );
});

test(`Test ${softWrap.name} function with normal text (soft wrap)`, (t) => {
    t.is(
        softWrap(text, 10, { whiteSpace: "preserve", break: "word" }),
        "Lorem \nipsum \ndolor sit \namet, \nconsectetu\nr \nadipiscing\n elit.",
    );
    t.is(
        wrap(text, 10),
        "Lorem \nipsum \ndolor sit \namet, \nconsectetu\nr \nadipiscing\n elit.",
    );
});

test(`Test ${wrap.name} function with ansi text (soft wrap)`, (t) => {
    resetLinkGeneratedId();
    t.is(
        wrap(ansiText, 15),
        "Check out \u001B]8;id=__1;https://www.example.com\x1B\\\x1B[1mmy\x1B[22m \u001B]8;;\x1B\\\n" +
            "\u001B]8;id=__1;https://www.example.com\x1B\\website\u001B]8;;\x07, it is \n" +
            "\u001B]8;id=__2;https://www.example.com\x1B\\supercalifragil\u001B]8;;\x1B\\\n" +
            "\u001B]8;id=__2;https://www.example.com\x1B\\isticexpialidoc\u001B]8;;\x1B\\\n" +
            "\u001B]8;id=__2;https://www.example.com\x1B\\ious\u001B]8;;\x07.",
    );
});

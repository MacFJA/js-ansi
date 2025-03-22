import test from "ava";
import { AnsiSequence, TextSequence, parse } from "../../src/index.js";
import { stripAnsi } from "../../src/index.js";
import { FE_ESCAPE } from "../../src/types.js";

test(`Test ${parse.name} function with SGR`, (t) => {
    const input =
        "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.\x1b[39m";
    t.deepEqual(parse(input), [
        new TextSequence("The quick brown ", 0),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[31m", 16),
        new TextSequence("fox jumped over ", 21),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[39m", 37),
        new TextSequence("the lazy ", 42),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[32m", 51),
        new TextSequence("dog and then ran away with the unicorn.", 56),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[39m", 95),
    ]);
});

test(`Test ${parse.name} function with OSC`, (t) => {
    const input =
        "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.\x1b[39m";
    t.deepEqual(parse(input), [
        new TextSequence("The quick brown ", 0),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[31m", 16),
        new TextSequence("fox jumped over ", 21),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[39m", 37),
        new TextSequence("the lazy ", 42),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[32m", 51),
        new TextSequence("dog and then ran away with the unicorn.", 56),
        new AnsiSequence(FE_ESCAPE.CSI, "\x1b[39m", 95),
    ]);
});

test(`Test ${stripAnsi.name} function with OSC hyperlink`, (t) => {
    const input =
        "Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.";
    t.deepEqual(parse(input), [
        new TextSequence("Check out ", 0),
        new AnsiSequence(
            FE_ESCAPE.OSC,
            "\u001B]8;id=__1;https://www.example.com\x1B\\",
            10,
        ),
        new TextSequence("my website", 46),
        new AnsiSequence(FE_ESCAPE.OSC, "\u001B]8;;\u0007", 56),
        new TextSequence(", it is ", 62),
        new AnsiSequence(
            FE_ESCAPE.OSC,
            "\u001B]8;id=__2;https://www.example.com\u001B\\",
            70,
        ),
        new TextSequence("supercalifragilisticexpialidocious", 106),
        new AnsiSequence(FE_ESCAPE.OSC, "\u001B]8;;\u0007", 140),
        new TextSequence(".", 146),
    ]);
});

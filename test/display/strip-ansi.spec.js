import test from "ava";
import { stripAnsi } from "../../src/index.js";

test(`Test ${stripAnsi.name} function with SGR`, (t) => {
    const input =
        "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.\x1b[39m";
    t.is(
        stripAnsi(input),
        "The quick brown fox jumped over the lazy dog and then ran away with the unicorn.",
    );
});

test(`Test ${stripAnsi.name} function with OSC hyperlink`, (t) => {
    const input =
        "Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.";
    t.is(
        stripAnsi(input),
        "Check out my website, it is supercalifragilisticexpialidocious.",
    );
});

test(`Test ${stripAnsi.name} function with short`, (t) => {
    t.is(stripAnsi("\x1b[36m─\x1b[39m"), "─");
});

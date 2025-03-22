import test from "ava";
import { ansiPosition } from "../../src/index.js";

test(`Test ${ansiPosition.name} function with plain text`, (t) => {
    const input =
        "The quick brown fox jumped over the lazy dog and then ran away with the unicorn.";
    t.is(ansiPosition(input, 41), 41);
});

test(`Test ${ansiPosition.name} function with outside position in plain text`, (t) => {
    const input = "The quick brown fox.";
    t.is(ansiPosition(input, 41), 20);
});
test(`Test ${ansiPosition.name} function with outside position`, (t) => {
    const input = "\x1b[31mThe quick brown fox.\x1b[39m";
    t.is(ansiPosition(input, 41), 30);
});

test(`Test ${ansiPosition.name} function with SGR`, (t) => {
    const input =
        "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.\x1b[39m";
    t.is(ansiPosition(input, 41), 51);
});

test(`Test ${ansiPosition.name} function with OSC hyperlink`, (t) => {
    const input =
        "Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.";
    // 62 + injection of id params (+6) + normalisation (+1)
    t.is(ansiPosition(input, 27), 69);
});

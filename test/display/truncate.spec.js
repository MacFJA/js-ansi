import test from "ava";
import { truncate } from "../../src/display/truncate.js";

const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

test(`Test ${truncate.name} function at end`, (t) => {
    t.is(truncate(text, 20), "Lorem ipsum dolor s\x1B[2m…\x1B[0m");
});
test(`Test ${truncate.name} function at start`, (t) => {
    t.is(truncate(text, 20, "start"), "\x1B[2m…\x1B[0mur adipiscing elit.");
});
test(`Test ${truncate.name} function at middle`, (t) => {
    t.is(truncate(text, 20, "middle"), "Lorem ips\x1B[2m…\x1B[0mcing elit.");
});
test(`Test ${truncate.name} function when not needed`, (t) => {
    t.is(truncate("Lorem ipsum dolor", 20), "Lorem ipsum dolor");
});

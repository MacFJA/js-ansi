import test from "ava";
import {
    closeCodes,
    getCodes,
    postprocessor,
    simplifyCodes,
} from "../../src/ansi-sequence/sgr.js";
import { TextSequence, parse } from "../../src/index.js";
import { AnsiSequence } from "../../src/index.js";
import { FE_ESCAPE } from "../../src/types.js";

const input =
    "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.\x1b[39m";
const openInput =
    "The quick brown \x1b[31mfox jumped over \x1b[39mthe lazy \x1b[32mdog and then ran away with the unicorn.";

test(`Test ${getCodes.name} function with close`, (t) => {
    const seqs = parse(input);
    t.deepEqual(
        getCodes(seqs.filter((s) => s instanceof AnsiSequence)),
        [31, 39, 32, 39],
    );
});

test(`Test ${simplifyCodes.name} function with close`, (t) => {
    t.deepEqual(simplifyCodes([31, 39, 32, 39]), []);
});

test(`Test ${closeCodes.name} function with close`, (t) => {
    t.deepEqual(closeCodes([31, 39, 32, 39]), []);
});

test(`Test ${getCodes.name} function with open`, (t) => {
    const seqs = parse(openInput);

    t.deepEqual(
        getCodes(seqs.filter((s) => s instanceof AnsiSequence)),
        [31, 39, 32],
    );
});

test(`Test ${simplifyCodes.name} function with open`, (t) => {
    t.deepEqual(simplifyCodes([31, 39, 32]), [32]);
});

test(`Test ${closeCodes.name} function with open`, (t) => {
    t.deepEqual(closeCodes([31, 39, 32]), [39]);
});

// ----------

test(`Test ${postprocessor.name} function`, (t) => {
    t.deepEqual(
        postprocessor([
            new TextSequence("Hello ", 0),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}1m`, 6),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}32m`, 10),
            new TextSequence("World", 15),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}39m`, 20),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}22m`, 25),
            new TextSequence("!", 30),
        ]),
        [
            new TextSequence("Hello ", 0),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}1;32m`, 6),
            new TextSequence("World", 13),
            new AnsiSequence(FE_ESCAPE.CSI, `${FE_ESCAPE.CSI}39;22m`, 18),
            new TextSequence("!", 26),
        ],
    );
});

// ----------

test(`Test ${simplifyCodes.name} function with nested ansi`, (t) => {
    t.deepEqual(simplifyCodes([31, 32, 39]), []);
});

test(`Test ${getCodes.name} function with a reset (no code)`, (t) => {
    const seqs = parse("The quick brown \x1b[31mfox\x1b[m");
    t.deepEqual(getCodes(seqs), [31, 0]);
});

test(`Test ${getCodes.name} function with a multiple code in sequence`, (t) => {
    const seqs = parse("The quick brown \x1b[31;1mfox\x1b[m");
    t.deepEqual(getCodes(seqs), [31, 1, 0]);
});

// ----------

test(`Test ${simplifyCodes.name} function with wrong code`, /** @param {import('ava').ExecutionContext} t */ (t) => {
    t.throws(() => simplifyCodes([999]), {
        instanceOf: Error,
        message: "Invalid code",
    });
});

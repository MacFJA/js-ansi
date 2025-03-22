export {
    registerPostprocess,
    registerToReopen,
    registerToClose,
    registerAnsiMatcher,
} from "./extensions";
export {
    type toReopen,
    type toClose,
    type postprocess,
    TextSequence,
    AnsiSequence,
    AnsiMatcher,
    type ParsedText,
    FE_ESCAPE,
} from "./types";
export { recalculatePosition } from "./lexer-parser";

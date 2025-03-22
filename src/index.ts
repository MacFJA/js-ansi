import * as osc from "./ansi-sequence/osc";
import * as sgr from "./ansi-sequence/sgr";

import {
    registerAnsiMatcher,
    registerPostprocess,
    registerToClose,
    registerToReopen,
} from "./extensions";

registerPostprocess(sgr.postprocessor);
registerToClose(sgr.toClose);
registerToReopen(sgr.toReopen);
registerAnsiMatcher(sgr.matcher);

registerPostprocess(osc.postprocessor);
registerToClose(osc.toClose);
registerToReopen(osc.toReopen);
registerAnsiMatcher(...osc.matchers);

export { parse, stringify } from "./lexer-parser";
export { TextSequence, AnsiSequence, type ParsedText } from "./types";
export { insertAt } from "./display/insert";
export { wrap, type WrapOptions } from "./display/wrap";
export { stripAnsi, ansiPosition } from "./display/strip";
export { truncate } from "./display/truncate";
export * from "./errors";

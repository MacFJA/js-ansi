import { insertAt } from "./insert";
import { ansiPosition, stripAnsi } from "./strip";

/**
 * Limit the length of an Ansi text by truncating it if needed
 * @param text The text to truncate
 * @param cols The maximum width of the text
 * @param position Where to truncate [default: "end"]
 */
export function truncate(
    text: string,
    cols: number,
    position: "start" | "middle" | "end" = "end",
): string {
    const lines = text.split("\n");

    return lines
        .map((line) => {
            const stripLine = stripAnsi(line);
            if (stripLine.length < cols) {
                return line;
            }
            if (position === "end") {
                return insertAt(line, cols - 1, "\x1b[2m…\x1b[0m").substring(
                    0,
                    ansiPosition(line, cols) + 8,
                );
            }
            if (position === "start") {
                return insertAt(
                    line,
                    stripLine.length - cols + 1,
                    "\x1b[2m…\x1b[0m",
                ).substring(ansiPosition(line, stripLine.length - cols) + 1);
            }

            const [left] = insertAt(line, Math.floor(cols / 2) - 1, "\n").split(
                "\n",
            );
            const [, right] = insertAt(
                line,
                stripLine.length - Math.floor(cols / 2),
                "\n",
            ).split("\n");
            return `${left}\x1b[2m…\x1b[0m${right}`;
        })
        .join("\n");
}

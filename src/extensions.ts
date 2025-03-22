import type { AnsiMatcher, postprocess, toClose, toReopen } from "./types";

export const toCloses: Array<toClose> = [];
export const toReopens: Array<toReopen> = [];
export const postProcesses: Array<postprocess> = [];
export const matchers: Array<AnsiMatcher> = [];

export function registerToClose(fn: toClose): void {
    toCloses.push(fn);
}
export function registerToReopen(fn: toReopen): void {
    toReopens.push(fn);
}
export function registerPostprocess(fn: postprocess): void {
    postProcesses.push(fn);
}
export function registerAnsiMatcher(...matcher: Array<AnsiMatcher>): void {
    matchers.push(...matcher);
    matchers.sort((first, second) => second.quick.length - first.quick.length);
}

// Backwards-compatible alias: canonical implementation lives in
// `./text.parser.ts` (`TextParser`, name "txt"). Kept so older imports
// of `./txt.parser` keep working without duplicating logic.
export { TextParser as TxtParser } from "./text.parser"
export { TextParser } from "./text.parser"

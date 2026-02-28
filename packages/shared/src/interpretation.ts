import { z } from "zod";

export const interpretationModeSchema = z.enum(["literal", "abstract"]);
export type InterpretationMode = z.infer<typeof interpretationModeSchema>;

import { z } from "zod";

export const mappingNoteSchema = z.object({
  signal: z.string(),
  effect: z.string(),
});

export const explainSchema = z.object({
  inferred_genre: z.string(),
  instrumentation: z.array(z.string()),
  mapping_notes: z.array(mappingNoteSchema),
});

export type MappingNote = z.infer<typeof mappingNoteSchema>;
export type Explain = z.infer<typeof explainSchema>;

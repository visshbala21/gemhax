import { z } from "zod";

export const directorModeSchema = z.enum([
  "album_cover",
  "cinematic_still",
  "surreal_dream",
  "anime_frame",
  "game_concept_art",
  "minimal_poster",
  "custom",
]);

export type DirectorMode = z.infer<typeof directorModeSchema>;

/** Per-mode stylistic rules injected into the prompt composer. */
export const DIRECTOR_STYLE_RULES: Record<DirectorMode, string> = {
  album_cover:
    "Album cover artwork. Bold graphic composition, iconic central subject, strong color blocking, high visual impact suitable for a vinyl record sleeve. Square framing.",
  cinematic_still:
    "Cinematic film still. Anamorphic widescreen framing, dramatic lighting with volumetric rays, shallow depth of field, film grain, color-graded with teal-and-orange split toning. 2.39:1 aspect feel.",
  surreal_dream:
    "Surrealist dreamscape. Impossible geometry, melting forms, floating elements defying gravity, Salvador Dali meets digital art. Hyper-detailed textures on impossible objects, iridescent lighting.",
  anime_frame:
    "Anime key frame. Studio Ghibli-inspired cel shading, expressive character poses, vibrant saturated palette, dynamic speed lines for energy, soft ambient occlusion. Japanese animation aesthetic.",
  game_concept_art:
    "Video game concept art. Epic scale environment painting, atmospheric perspective, painterly digital brushwork, detailed foreground props, lore-rich world-building details. Unreal Engine aesthetic.",
  minimal_poster:
    "Minimalist poster design. Flat geometric shapes, limited 3-color palette, bold negative space, Swiss design grid, no gradients, clean vector-like edges. Typographic composition without actual text.",
  custom:
    "Custom director mode. Follow the user's custom instruction as the primary style directive.",
};

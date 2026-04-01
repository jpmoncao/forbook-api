import { z } from "zod";

export const uploadImageBodySchema = z
    .object({
        image: z.instanceof(File, { message: "Imagem deve ser um arquivo" }),
    })
    .strict();

export type UploadImageBody = z.infer<typeof uploadImageBodySchema>;

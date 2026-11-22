import { z } from "zod";

export const extractRequestSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL must start with http:// or https://",
    }),
  maxPages: z.number().int().min(1).max(40).optional().default(15),
});

export const convertRequestSchema = z.object({
  sourceJobId: z.string().uuid().optional(),
  prompt: z
    .string()
    .min(8)
    .max(4000)
    .default(
      "Convert this Framer template into a clean, production-ready Next.js App Router project with reusable React components, Tailwind CSS, and accessible markup.",
    ),
  framework: z.enum(["nextjs", "react"]).default("nextjs"),
});

export type ExtractRequest = z.infer<typeof extractRequestSchema>;
export type ConvertRequest = z.infer<typeof convertRequestSchema>;

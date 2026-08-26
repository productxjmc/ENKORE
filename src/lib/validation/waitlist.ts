import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.email("Enter a valid email address"),
});

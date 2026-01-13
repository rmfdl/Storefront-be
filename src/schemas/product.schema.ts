import { z } from "zod";

export const categories = [
  "Free Courses",
  "Scholarship Mentoring",
  "TOEFL/IELTS",
  "Grammar",
  "Convo",
  "English for Specific Purpose",
  "Scholarship Support Service",
  "Product Digital",
] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  price: z.number().positive("Price must be positive"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  image: z.string().optional(), // we omit this during validation
  category: z.enum(categories, {  message: "Invalid category" } ),
});

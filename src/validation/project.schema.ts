import { ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({
      error: "Project name is required"
    }).min(1, "Project name is required")
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters"),
  description: z
    .string({
      error: "Description is required"
    }).max(500, "Description must be at most 500 characters")
    .max(500, "Description must be at most 500 characters")
    .optional(),
  client: z.object({
    name: z.string({
      error: "Client name is required"
    }).min(1, "Client name is required"),
    email: z.email({
      error: "Invalid email address"
    }).optional(),
    company: z.string({
      error: "Invalid company name"
    }).optional(),
  }),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum([ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED]).optional(),
  client: z
    .object({
      name: z.string().min(1, "Client name is required").optional().or(z.literal("")),
      email: z.email("Invalid email address").optional().or(z.literal("")),
      company: z.string().optional().or(z.literal("")),
    })
    .optional(),
});

export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
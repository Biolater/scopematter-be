import { ProjectStatus } from "@prisma/client";
import { UpdateProjectSchema } from "../../validation/project.schema";

export interface CreateProjectInput {
  userId: string;
  name: string;
  description: string | undefined;
  client: {
    name: string;
    email?: string | undefined;
    company?: string | undefined;
  };
}

export interface GetProjectsInput {
  userId: string;
}

export interface GetProjectInput {
  id: string;
  userId: string;
}

export interface DeleteProjectInput {
  id: string;
  userId: string;
}

export interface UpdateProjectInput {
  id: string;
  userId: string;
  data: UpdateProjectSchema;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ClientUpdateData {
  name?: string;
  email?: string;
  company?: string;
}
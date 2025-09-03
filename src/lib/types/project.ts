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
import type { users } from "@/db/schema.js";

export type PublicUser = {
  id: number;
  name: string | null;
  email: string;
  createdAt: Date;
};

export function toPublicUser(user: (typeof users)["$inferSelect"]): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

"use client";

import { createAuthClient } from "better-auth/react";

import { adminClient } from "better-auth/client/plugins";

import { roles } from "./roles";

export const authClient = createAuthClient({ plugins: [adminClient({ roles })] });

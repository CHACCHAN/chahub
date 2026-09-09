import { betterAuth } from "better-auth";
import { authOptions } from "./config";

export { authOptions, authPool } from "./config";
export const auth = betterAuth(authOptions);

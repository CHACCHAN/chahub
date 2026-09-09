import { auth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { withOidcContext } from "@/lib/better-auth/oidc-context";

const handlers = toNextJsHandler(auth);
export const GET = (request: Request) => withOidcContext(() => handlers.GET(request));
export const POST = (request: Request) => withOidcContext(() => handlers.POST(request));

// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)", "/api/qstash-webhook(.*)"],
  ignoredRoutes: ["/api/qstash-webhook(.*)"], // webhooks shouldn't require auth
});

export const config = {
  matcher: [
    // Match all routes except _next & static files
    "/((?!_next|.*\\..*).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

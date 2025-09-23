import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const runtime = "nodejs"; // recommended for auth via headers

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });

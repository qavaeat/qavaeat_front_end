// // app/api/chefs/notifications/stream/route.ts
// import { NextRequest } from "next/server";
// import { getChefFromSession } from "@/lib/auth";
// import { notificationRegistry } from "@/lib/sse-registry";

// export async function GET(req: NextRequest) {
//   const chef = await getChefFromSession(req);
//   if (!chef) return new Response("Unauthorized", { status: 401 });

//   const stream = new ReadableStream({
//     start(controller) {
//       // Register this chef's stream so we can push to it later
//       notificationRegistry.register(chef.businessId, controller);

//       // Send a heartbeat every 30s to keep connection alive
//       const heartbeat = setInterval(() => {
//         try {
//           controller.enqueue(`data: {"type":"ping"}\n\n`);
//         } catch {
//           clearInterval(heartbeat);
//         }
//       }, 30_000);

//       // Cleanup when client disconnects
//       req.signal.addEventListener("abort", () => {
//         clearInterval(heartbeat);
//         notificationRegistry.unregister(chef.businessId, controller);
//       });
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache, no-transform",
//       "Connection": "keep-alive",
//       "X-Accel-Buffering": "no", // critical for nginx
//     },
//   });
// }
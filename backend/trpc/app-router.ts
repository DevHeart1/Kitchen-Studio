import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { pantryScanRouter } from "./routes/pantry-scan";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  pantryScan: pantryScanRouter,
});

export type AppRouter = typeof appRouter;

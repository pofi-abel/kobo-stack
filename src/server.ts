import { connectDB } from "./config/db";
import { nibssTokenService } from "./services/nibss/nibssTokenService";
import { env } from "./config/env";
import app from "./app";

async function start(): Promise<void> {
  // 1. Connect to MongoDB Atlas
  await connectDB();

  // 2. Pre-warm NIBSS token before accepting requests
  await nibssTokenService.init();

  // 3. Start HTTP server
  const port = parseInt(env.PORT, 10);
  app.listen(port, () => {
    console.log(`Server running on port ${port} [${env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", (err as Error).message);
  process.exit(1);
});

import "@/config/env.js";
import { app } from "@/config/express.js";
import config from "@/config/vars.js";
import { logger } from "@/utils/logger.js";

app.listen(config.port, () => {
  logger.info(`APP is running on http://localhost:${config.port}/api`);
});

export default app;

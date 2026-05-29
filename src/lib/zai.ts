import ZAI from "z-ai-web-dev-sdk";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Helper to create ZAI instance that works in both dev and Vercel production
export async function createZAI() {
  // In Vercel production, use environment variables
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    // Create a temporary config file for the SDK
    const configDir = path.join(os.tmpdir(), "z-ai-config-dir");
    const configPath = path.join(configDir, ".z-ai-config");

    try {
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        configPath,
        JSON.stringify({
          baseUrl: process.env.ZAI_BASE_URL,
          apiKey: process.env.ZAI_API_KEY,
          chatId: process.env.ZAI_CHAT_ID || "",
          token: process.env.ZAI_TOKEN || "",
          userId: process.env.ZAI_USER_ID || "",
        })
      );

      // Change cwd temporarily so SDK finds the config
      const originalCwd = process.cwd();
      process.chdir(configDir);
      const zai = await ZAI.create();
      process.chdir(originalCwd);
      return zai;
    } catch (err) {
      console.error("Error creating ZAI config for production:", err);
      throw err;
    }
  }

  // In development, use the default config (from home dir or /etc)
  return await ZAI.create();
}

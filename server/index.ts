import express from "express";
import { isApiKeyConfigured, serverConfig } from "./config";
import { handleResearchPartner } from "./routes/researchPartner";

const app = express();
app.use(express.json({ limit: "1mb" }));

/** Non-sensitive readiness info for the researcher. Never exposes the key. */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: serverConfig.useMockLlm ? "mock" : "openai",
    model: serverConfig.useMockLlm ? "mock" : serverConfig.model,
    apiKeyConfigured: isApiKeyConfigured(),
  });
});

app.post("/api/research-partner", handleResearchPartner);

app.listen(serverConfig.port, () => {
  const mode = serverConfig.useMockLlm
    ? "mock Research Partner (USE_MOCK_LLM=true)"
    : `OpenAI model ${serverConfig.model}`;
  console.log(`[server] listening on http://localhost:${serverConfig.port} — using ${mode}`);
  if (!serverConfig.useMockLlm && !isApiKeyConfigured()) {
    console.warn(
      "[server] OPENAI_API_KEY is not set. Copy .env.example to .env and add your key, or set USE_MOCK_LLM=true.",
    );
  }
});

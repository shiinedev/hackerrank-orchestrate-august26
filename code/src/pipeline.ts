import { buildMessageContext, type MessageContext } from "./context-model.ts";
import type { LoadedDataset } from "./data-loader.ts";
import { MediaAnalyzer, type MediaAnalyzerConfig, type MediaUnderstanding } from "./media-analyzer.ts";
import { writeOutputCsv } from "./output.ts";
import { retrieveEvidence } from "./retriever.ts";
import { routeMessage } from "./router.ts";
import { finalizeDecision } from "./safety-policy.ts";
import type { OpenAiConfig } from "./openai.ts";
import type { MessageRow, OutputRow } from "./schemas.ts";

export type PipelineDependencies = {
  mediaAnalyzer?: Pick<MediaAnalyzer, "analyze">;
  route?: typeof routeMessage;
};

export async function routeMessageContext(
  context: MessageContext,
  config?: OpenAiConfig,
  dependencies: PipelineDependencies = {},
): Promise<OutputRow> {
  const evidence = retrieveEvidence(context);
  const mediaAnalyzer = dependencies.mediaAnalyzer;
  const media = mediaAnalyzer ? await mediaAnalyzer.analyze(context) : await analyzeMediaIfNeeded(context);
  const decision = await (dependencies.route ?? routeMessage)({ context, evidence, media }, config);
  return finalizeDecision(context, decision, media);
}

async function analyzeMediaIfNeeded(context: MessageContext): Promise<MediaUnderstanding | undefined> {
  if (!context.message.media_type) return undefined;
  const analyzer = new MediaAnalyzer();
  return analyzer.analyze(context);
}

export async function routeMessages(
  dataset: LoadedDataset,
  messages: MessageRow[],
  config?: OpenAiConfig,
  mediaConfig?: MediaAnalyzerConfig,
  dependencies: PipelineDependencies = {},
): Promise<OutputRow[]> {
  const mediaAnalyzer = dependencies.mediaAnalyzer ?? (mediaConfig ? new MediaAnalyzer(mediaConfig) : undefined);
  const rows: OutputRow[] = [];

  for (const message of messages) {
    const context = buildMessageContext(dataset, message);
    const evidence = retrieveEvidence(context);
    const media = message.media_type
      ? mediaAnalyzer
        ? await mediaAnalyzer.analyze(context)
        : await analyzeMediaIfNeeded(context)
      : undefined;
    const decision = await (dependencies.route ?? routeMessage)({ context, evidence, media }, config);
    rows.push(finalizeDecision(context, decision, media));
  }

  return rows;
}

export async function generateOutputCsv(
  dataset: LoadedDataset,
  config?: OpenAiConfig,
  mediaConfig?: MediaAnalyzerConfig,
): Promise<OutputRow[]> {
  const rows = await routeMessages(dataset, dataset.messages, config, mediaConfig);
  await writeOutputCsv(rows, dataset.messages.map((message) => message.message_id));
  return rows;
}

import { createOutputEnvelopeSchema } from "./output-schemas";
import { SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION as definition, SmartCampaignCreativeOutputSchema } from "./wire-creative-agent-wire.generated";
export { CreativeGenerationSchema, CreativeSelectionSchema, SmartCampaignCreativeInputSchema, SmartCampaignCreativeOutputSchema, SourceAudioImportSchema, SourceAudioUploadCompleteSchema, SourceAudioUploadSchema, SourceAudioUploadStatusSchema } from "./wire-creative-agent-wire.generated";
export const SMART_CAMPAIGN_CREATIVE_TOOL_DEFINITION = { ...definition, outputSchema: createOutputEnvelopeSchema(SmartCampaignCreativeOutputSchema) };

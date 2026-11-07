import { ARTIST_INTAKE_TOOL_DEFINITION as definition } from "./artist-intake-wire.generated";
import { AnyOutputEnvelopeSchema } from "./output-schemas";

export { ArtistIntakeInputSchema } from "./artist-intake-wire.generated";
export const ARTIST_INTAKE_TOOL_DEFINITION = {
	...definition,
	outputSchema: AnyOutputEnvelopeSchema,
};

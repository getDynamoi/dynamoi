import { ChannelResultsSchema } from "../channel-results-schema";
/** Allowlisted presentation data. Never forward arbitrary domain records to the model. */
export type WorkspaceArtist = {
	id: string;
	name: string;
	organizationName?: string;
};
export type WorkspaceData = {
	artistCount: number;
	artists: WorkspaceArtist[];
	nextCursor?: string;
};
export type WorkspaceRecord = {
	id: string;
	artistId?: string;
	channel?: {
		period: string;
		asOf: string | null;
		observedThrough: string;
		missingDays: number;
		placeholderDays: number;
		source: string;
		attribution: string;
		metrics: { label: string; value: number }[];
	};
	kind: "artist" | "campaign" | "smartlink";
	name: string;
	status?: string;
	campaignType?: "SMART_CAMPAIGN" | "YOUTUBE";
	isPublic?: boolean;
	sampleResults?: boolean;
	warnings?: string[];
	channelAvailability?: {
		status: "pending" | "unavailable";
		period?: string;
		asOf?: string;
		observedThrough?: string;
	};
	url?: string;
	metrics?: { label: string; value: number }[];
	period?: string;
	source?: string;
};
export const UUID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function object(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}
export function text(value: unknown, max = 160): string {
	return typeof value === "string"
		? Array.from(value)
				.map((character) => {
					const code = character.codePointAt(0) ?? 0;
					return code < 32 || code === 127 ? " " : character;
				})
				.join("")
				.slice(0, max)
		: "";
}
function count(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}
function day(value: unknown): string | undefined {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
		? value
		: undefined;
}
function windowPeriod(value: unknown): string | undefined {
	const dates = object(value);
	const start = day(dates["start"]);
	const end = day(dates["end"]);
	return start && end ? `${start} to ${end}` : undefined;
}
export function artists(value: unknown): WorkspaceArtist[] {
	return (Array.isArray(value) ? value : []).slice(0, 50).flatMap((item) => {
		const row = object(item);
		return typeof row["id"] === "string" &&
			UUID.test(row["id"]) &&
			text(row["name"])
			? [
					{
						id: row["id"],
						name: text(row["name"]),
						...(text(row["organizationName"])
							? { organizationName: text(row["organizationName"]) }
							: {}),
					},
				]
			: [];
	});
}
export function cursor(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 && value.length <= 2048
		? value
		: undefined;
}
/** Only generated Dynamoi public links; no credentials, fragments or tracking query. */
export function publicLink(value: unknown): string | undefined {
	if (typeof value !== "string" || value.length > 2048) {
		return undefined;
	}
	try {
		const url = new URL(value);
		if (
			url.protocol !== "https:" ||
			url.username ||
			url.password ||
			url.port ||
			!["streamit.fm", "play.dynamoi.com"].includes(url.hostname) ||
			url.search ||
			url.hash
		) {
			return undefined;
		}
		return url.href;
	} catch {
		return undefined;
	}
}
export type WorkspaceRoute = {
	artistId: string;
	kind?: "campaign" | "smartlink";
	id?: string;
};
/** Host has already decoded the app-relative path. Reject alternate/encoded forms. */
export function parseDeepLink(hostState: unknown): WorkspaceRoute | null {
	const state = object(hostState);
	if (Object.keys(state).length !== 1 || !Object.hasOwn(state, "url")) {
		throw new Error("Unsupported workspace link.");
	}
	const value = state["url"];
	if (value === "/") {
		return null;
	}
	if (
		typeof value !== "string" ||
		value.length > 180 ||
		/[%?#\\\s]/.test(value)
	) {
		throw new Error("Unsupported workspace link.");
	}
	const match = /^\/artists\/([^/]+)(?:\/(campaigns|links)\/([^/]+))?$/.exec(
		value,
	);
	if (
		!(match && UUID.test(match[1] ?? "")) ||
		(match[3] && !UUID.test(match[3]))
	) {
		throw new Error("Unsupported workspace link.");
	}
	return {
		artistId: match[1] ?? "",
		...(match[3]
			? {
					id: match[3],
					kind:
						match[2] === "campaigns"
							? ("campaign" as const)
							: ("smartlink" as const),
				}
			: {}),
	};
}
function projectChannel(
	row: Record<string, unknown>,
	kind: WorkspaceRecord["kind"],
	warnings: string[],
): Pick<WorkspaceRecord, "channel" | "channelAvailability"> {
	const parsedChannel = ChannelResultsSchema.safeParse(row["channelResults"]);
	let channel: WorkspaceRecord["channel"];
	let channelAvailability: WorkspaceRecord["channelAvailability"];
	if (
		kind === "campaign" &&
		parsedChannel.success &&
		parsedChannel.data.status !== "available"
	) {
		const observed = parsedChannel.data;
		const asOf = day(observed.provenance.asOfDate);
		const observedThrough =
			observed.status === "pending"
				? day(observed.coverage.observedThroughDay)
				: undefined;
		const period =
			observed.status === "pending"
				? windowPeriod(observed.dateRange)
				: undefined;
		channelAvailability = {
			status: observed.status,
			...(observedThrough ? { observedThrough } : {}),
			...(period ? { period } : {}),
			...(asOf ? { asOf } : {}),
		};
		warnings.push(
			observed.status === "pending"
				? "YouTube channel results are pending; no channel totals are available."
				: "YouTube channel results are unavailable; no channel totals are available.",
		);
	} else if (
		kind === "campaign" &&
		row["channelResults"] !== undefined &&
		!parsedChannel.success
	) {
		warnings.push(
			"YouTube channel results could not be verified; uncertain totals are omitted.",
		);
	}
	if (
		kind === "campaign" &&
		parsedChannel.success &&
		parsedChannel.data.status === "available"
	) {
		const observed = parsedChannel.data;
		const channelMetrics: { label: string; value: number }[] = [];
		const views = count(observed.channelMetrics.views);
		const subscribers = count(observed.channelMetrics.subscribersGained);
		if (views !== undefined) {
			channelMetrics.push({ label: "Channel views", value: views });
		}
		if (subscribers !== undefined) {
			channelMetrics.push({ label: "Subscribers gained", value: subscribers });
		}
		channel = {
			asOf: day(observed.channelMetrics.provenance.asOfDate) ?? null,
			attribution: observed.channelMetrics.provenance.attribution,
			metrics: channelMetrics,
			missingDays: observed.coverage.missingDays.length,
			observedThrough: day(observed.coverage.observedThroughDay) ?? "unknown",
			period: windowPeriod(observed.dateRange) ?? "Window unavailable",
			placeholderDays: observed.coverage.placeholderDays.length,
			source: observed.channelMetrics.provenance.source,
		};
	}
	return {
		...(channel ? { channel } : {}),
		...(channelAvailability ? { channelAvailability } : {}),
	};
}
export function projectRecord(
	kind: WorkspaceRecord["kind"],
	rawRecord: unknown,
	authorizedArtistId?: string,
	mode: "summary" | "detail" = "summary",
): WorkspaceRecord {
	const row = object(rawRecord);
	if (typeof row["id"] !== "string" || !UUID.test(row["id"])) {
		throw new Error("This record could not be loaded.");
	}
	const metrics: NonNullable<WorkspaceRecord["metrics"]> = [];
	const analytics = object(row["analytics"]);
	const totals = object(analytics["totals"]);
	const fields: [string, string][] =
		kind === "smartlink"
			? [
					["anonymousVisits", "Anonymous visits"],
					["streamingServiceClicks", "Streaming service clicks"],
					["youtubeVideoPlays", "YouTube video plays"],
				]
			: [
					["impressions", "Ad impressions"],
					["clicks", "Ad clicks"],
				];
	const warnings: string[] = [];
	const availability = analytics["countsAvailability"];
	const verified = availability === "available" || availability === "sample";
	const sampleResults = availability === "sample";
	if (mode === "detail" && Object.keys(analytics).length === 0) {
		warnings.push("Results could not be read for this record.");
	} else if (
		!verified &&
		(mode === "detail" || Object.keys(analytics).length > 0)
	) {
		warnings.push(
			availability === "not_linked"
				? "No ad platform is linked; no ad observations are available."
				: "Results are unavailable or incomplete; uncertain totals are omitted.",
		);
	}
	for (const [key, label] of verified ? fields : []) {
		const value = count(totals[key]);
		if (value !== undefined) {
			metrics.push({ label, value });
		}
	}
	const { channel, channelAvailability } = projectChannel(row, kind, warnings);
	const period = windowPeriod(analytics["dateRange"]);
	const url =
		kind === "smartlink" && row["isPublic"] === true
			? publicLink(row["publicUrl"])
			: undefined;
	return {
		id: row["id"],
		...(authorizedArtistId && UUID.test(authorizedArtistId)
			? { artistId: authorizedArtistId }
			: typeof row["artistId"] === "string" && UUID.test(row["artistId"])
				? { artistId: row["artistId"] }
				: kind === "artist"
					? { artistId: row["id"] }
					: {}),
		...(channel ? { channel } : {}),
		...(channelAvailability ? { channelAvailability } : {}),
		...(warnings.length > 0 ? { warnings } : {}),
		kind,
		...(kind === "campaign" &&
		(row["campaignType"] === "SMART_CAMPAIGN" ||
			row["campaignType"] === "YOUTUBE")
			? { campaignType: row["campaignType"] }
			: {}),
		...(kind === "smartlink" ? { isPublic: row["isPublic"] === true } : {}),
		...(sampleResults ? { sampleResults: true } : {}),
		name:
			text(
				kind === "smartlink"
					? row["releaseTitle"]
					: (row["contentTitle"] ?? row["name"]),
			) || "Untitled",
		...(text(row["status"] ?? row["publishState"], 80)
			? { status: text(row["status"] ?? row["publishState"], 80) }
			: {}),
		...(url ? { url } : {}),
		...(metrics.length > 0 ? { metrics } : {}),
		...(period ? { period } : {}),
		...(metrics.length > 0
			? {
					source:
						kind === "smartlink"
							? "Smart Link analytics"
							: sampleResults
								? "Sample campaign results"
								: "Ad-network delivery",
				}
			: {}),
	};
}
export function selectedContext(record: WorkspaceRecord): string {
	// Explicit selected entity references only; no account-wide identifiers or raw records.
	return JSON.stringify({
		artistId:
			record.artistId && UUID.test(record.artistId)
				? record.artistId
				: undefined,
		id: UUID.test(record.id) ? record.id : undefined,
		name: text(record.name),
		...(record.warnings?.length
			? {
					warnings: record.warnings
						.slice(0, 3)
						.map((warning) => text(warning, 160)),
				}
			: {}),
		...(record.channelAvailability
			? {
					channelAvailability: {
						status: record.channelAvailability.status,
						...(record.channelAvailability.period
							? { period: text(record.channelAvailability.period, 40) }
							: {}),
						...(record.channelAvailability.asOf
							? { asOf: text(record.channelAvailability.asOf, 40) }
							: {}),
						...(record.channelAvailability.observedThrough
							? {
									observedThrough: text(
										record.channelAvailability.observedThrough,
										40,
									),
								}
							: {}),
					},
				}
			: {}),
		type: record.kind,
		...(record.status ? { status: text(record.status, 80) } : {}),
		...(record.isPublic === true && publicLink(record.url)
			? { url: publicLink(record.url) }
			: {}),
		...(record.metrics?.length
			? {
					metrics: record.metrics.slice(0, 5).map(({ label, value }) => ({
						label: text(label, 80),
						value: count(value) ?? 0,
					})),
					source: text(record.source, 180),
				}
			: {}),
		...(record.period ? { period: text(record.period, 40) } : {}),
		...(record.channel
			? {
					channel: {
						asOf: record.channel.asOf ? text(record.channel.asOf, 40) : null,
						attribution: text(record.channel.attribution, 100),
						metrics: record.channel.metrics
							.slice(0, 2)
							.map(({ label, value }) => ({
								label: text(label, 80),
								value: count(value),
							})),
						missingDays: count(record.channel.missingDays),
						observedThrough: text(record.channel.observedThrough, 40),
						period: text(record.channel.period, 40),
						placeholderDays: count(record.channel.placeholderDays),
						source: text(record.channel.source, 100),
					},
				}
			: {}),
	});
}

/** Auto-selection requires a complete roster without duplicate names. */
export function initialArtist(
	roster: WorkspaceArtist[],
	rosterCursor?: string,
): WorkspaceArtist | undefined {
	if (rosterCursor) {
		return undefined;
	}
	const names = new Set<string>();
	for (const artist of roster) {
		if (names.has(artist.name)) {
			return undefined;
		}
		names.add(artist.name);
	}
	return roster[0];
}
export function artistLabel(
	artist: WorkspaceArtist,
	roster: WorkspaceArtist[],
): string {
	const label = (row: WorkspaceArtist) =>
		row.organizationName ? `${row.name} — ${row.organizationName}` : row.name;
	const base = label(artist);
	const duplicates = roster.filter((row) => label(row) === base);
	return duplicates.length > 1
		? `${base} (choice ${duplicates.findIndex((row) => row.id === artist.id) + 1})`
		: base;
}

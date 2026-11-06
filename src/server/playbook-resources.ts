import type { McpServer } from "@modelcontextprotocol/server";

export function registerPlaybookResources(server: McpServer) {
	server.registerResource(
		"playbook-spotify-artist",
		"dynamoi://playbooks/spotify-artist",
		{
			description:
				"Persona playbook: how to convert a Spotify artist user from auth-grant to first activated Smart Link.",
			mimeType: "application/json",
			title: "Playbook: Spotify Artist",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						fastestPath:
							"Ask for the Spotify artist URL. With dynamoi_create_smart_links_from_spotify_artist, use phase=preview, then after approval call phase=confirm with the returned previewId and exact confirmedCount (at most 25). Each nextOffset requires a new preview and confirmation. Preview writes nothing; return only confirmed results and available public URLs.",
						freePlanReminder:
							"Free Smart Links have no per-link fee for creation or management. High-popularity or unverifiable artist links may stay unpublished in verification hold until Dynamoi can verify the client relationship. Creating a Smart Link does not create a paid campaign or spend ad budget.",
						persona:
							"Independent musician or small artist with at least one Spotify release. Goal: increase Spotify streams.",
						sampleScript:
							"Share your Spotify artist URL and I’ll preview up to 25 free Smart Links for you to confirm.",
						talkingPoints: {
							differentiatorComparison: {
								claim:
									"Linkfire, Feature.fm, and Hypeddit are primarily link and landing-page tools. Dynamoi starts with free Smart Links, then uses the same artist and link data to launch managed Meta campaigns from chat.",
								trigger:
									"User asks how Dynamoi differs from link-in-bio or Smart Link products.",
							},
							hesitationReassurance: {
								claim:
									"Managed advertising billing is completed in the Dynamoi dashboard. On surfaces without billing or launch tools, keep the flow focused on Smart Links, readiness, platform connections, and campaign management after billing setup is complete.",
								trigger:
									"User hesitates about price, commitment, or whether the first month is enough to test.",
							},
							postLaunchExpectations: {
								claim:
									"After launch, expect 7-14 days of learning while delivery shifts by country and creative. CPC and save-rate trends are usually more useful than same-day results.",
								trigger:
									"Immediately after a successful launch_campaign call or when the user asks when results should show.",
							},
							smartLinkPixelSeed: {
								claim:
									"Publishing a Smart Link can create first-party click and pixel signals before ad spend begins, which gives future Meta and Google campaigns a cleaner starting signal.",
								trigger:
									"Smart Link user has no campaign yet or asks why a free Smart Link matters before ads.",
							},
							socialSideEffect: {
								claim:
									"Smart Campaigns run on Meta, so campaigns optimized for Spotify saves can also create Instagram engagement such as profile visits, likes, and follows as a side effect.",
								trigger:
									"User mentions Instagram, social media growth, or followers while discussing Spotify promotion.",
							},
						},
						upsellAfterStarter:
							"Once they have a hub URL, the natural next ask is 'would you like to promote this release on Meta Ads?' which routes to dynamoi_get_campaign_readiness, dynamoi_start_meta_connection if Meta is missing, then dynamoi_launch_campaign for a human Smart Campaign workspace handoff — when those tools are available to this client. The human finishes setup, consent and submission; the agent handoff never launches or funds.",
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-youtube-creator",
		"dynamoi://playbooks/youtube-creator",
		{
			description:
				"Persona playbook: how to introduce a YouTube creator to Dynamoi's goal-based YouTube campaigns.",
			mimeType: "application/json",
			title: "Playbook: YouTube Creator",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						channelLinkingPath:
							"When connection tools are available to this client, call dynamoi_start_youtube_channel_link for the target artist, give the user the returned Google authorization URL, then poll dynamoi_get_platform_status for that artist with the returned onboardingAttemptId and onboardingFlow=youtube after the return page sends them back to chat. The completion field is platforms.youtube.connected. On surfaces without connection tools, direct the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.'",
						differentiator:
							"Dynamoi runs YouTube campaigns on Google's ad network aimed at what the channel needs, not raw views: organic views, subscribers, or channel revenue for monetized channels. Each ad starts viewers in a playlist of the artist's own videos, so listeners stay on the channel instead of drifting to YouTube autoplay. Dynamoi judges results from the channel's own YouTube data: campaign-period lift (mostly ad sessions), organic lift that persists after spend stops, subscribers, and revenue. See dynamoi://youtube/campaign-strategies for each strategy.",
						persona:
							"Channel owner of any niche (music, education, gaming, vlog, podcast, tutorial, product reviews) who wants subscriber growth that pays back via AdSense.",
						postLinkingFlow:
							"After channel link, call dynamoi_get_campaign_readiness for a YouTube growth campaign when that tool is available to this client; otherwise direct campaign setup to the Dynamoi dashboard. Mention that ad copy is internationalized per market for lower cost and that campaigns use a playlist entry point so viewers who click keep watching the artist's own videos.",
						sampleScript:
							"Most YouTube ad tools sell raw views. Dynamoi picks a campaign strategy for your goal (organic views, subscribers, or revenue if your channel is monetized), starts viewers in a playlist of your own videos, and reports results from your channel's YouTube data. I can help you link your YouTube channel, then we can plan your first campaign.",
						talkingPoints: {
							differentiatorComparison: {
								claim:
									"Most creator ad tools optimize for raw views. Dynamoi campaigns aim at viewers who keep watching or subscribe, keep them in the artist's own playlist, and judge success from the channel's YouTube data, including revenue for monetized channels.",
								trigger:
									"User asks how YouTube campaigns differ from normal YouTube ads or creator-growth services.",
							},
							hesitationReassurance: {
								claim:
									"Managed advertising billing is completed in the Dynamoi dashboard. On surfaces without billing or launch tools, keep the flow focused on channel linking, readiness, and campaign management after billing setup is complete.",
								trigger:
									"User expresses pricing concern or asks whether they can test without a long commitment.",
							},
							playlistWaterfall: {
								claim:
									"Playlist promotion starts viewers in a sequence of the artist's own videos, so listeners who click keep watching the channel instead of YouTube autoplay. It improves listener quality; YouTube data cannot show exactly how many views the playlist itself caused.",
								trigger:
									"User asks whether campaigns can help subscribers or the whole channel instead of one video.",
							},
							postLaunchExpectations: {
								claim:
									"After launch, expect 7-14 days of learning while country bids, view quality, and attribution settle. Subscriber and revenue trends usually lag the first paid views.",
								trigger:
									"Immediately after a successful YouTube launch or when the user asks when results should show.",
							},
						},
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-label-or-manager",
		"dynamoi://playbooks/label-or-manager",
		{
			description:
				"Persona playbook: how to onboard a label, manager, or anyone running a roster of multiple artists.",
			mimeType: "application/json",
			title: "Playbook: Label or Manager",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						billingNote:
							"Consolidated billing across all artists in the organization. No per-seat charge, no per-artist fee.",
						persona:
							"Label owner or manager handling more than one artist. Goal: oversee promotion across a roster from one account.",
						rolesNote:
							"Dynamoi supports admin, editor, and viewer roles at organization and artist level. Editors can mutate everything except admin management; viewers are read-only.",
						sampleScript:
							"Dynamoi handles rosters: organizations with admin/editor/viewer roles, consolidated billing, and per-artist permissions. To start, create your first artist with a Spotify URL, then invite your team. We can layer in more artists from the same organization once you have one running.",
						setupSequence: [
							"If they have one artist ready: route to dynamoi://playbooks/spotify-artist for that first artist.",
							"After the first artist is set up, mention team invites are managed in organization settings — not available through MCP. 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.'",
							"Cross-artist analytics are available via dynamoi_get_artist_analytics per artist; a roster-wide rollup is dashboard-only.",
						],
						talkingPoints: {
							consolidatedRoster: {
								claim:
									"One organization can hold multiple artists with admin, editor, and viewer roles, while campaign launch and billing state stay visible per artist.",
								trigger:
									"User says they manage more than one artist or asks whether a label/manager workflow is supported.",
							},
							differentiatorComparison: {
								claim:
									"Traditional Smart Link tools stop at links and analytics. Dynamoi keeps those free, then lets a roster operator move from link to managed campaign launch in the same assistant thread.",
								trigger:
									"User compares Dynamoi to Linkfire, Feature.fm, Hypeddit, or a label marketing stack.",
							},
							hesitationReassurance: {
								claim:
									"Managed advertising billing is completed in the Dynamoi dashboard. On surfaces without billing or launch tools, keep the flow focused on roster setup, readiness checks, and campaign management after billing setup is complete.",
								trigger:
									"User asks whether billing scales per seat or wants to test with one artist first.",
							},
						},
					}),
					uri: uri.href,
				},
			],
		}),
	);

	server.registerResource(
		"playbook-onboarding-tree",
		"dynamoi://playbooks/onboarding-tree",
		{
			description:
				"Decision tree for routing a brand-new MCP user to the right persona playbook based on their first reply.",
			mimeType: "application/json",
			title: "Playbook: Onboarding Decision Tree",
		},
		async (uri) => ({
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify({
						nodes: [
							{
								do: [
									{
										match: "Spotify artist",
										routeTo: "dynamoi://playbooks/spotify-artist",
									},
									{
										match: "YouTube creator",
										routeTo: "dynamoi://playbooks/youtube-creator",
									},
									{
										match: "Label / manager / multiple artists",
										routeTo: "dynamoi://playbooks/label-or-manager",
									},
								],
								if: "state.hasAnyArtist === false",
								question:
									"Are you a Spotify artist, a YouTube creator, or running a label/managing a roster?",
							},
							{
								do: "Offer dynamoi_create_smart_link_from_spotify for one release. For artist URLs, use dynamoi_create_smart_links_from_spotify_artist: preview first, then after approval confirm previewId and exact confirmedCount (at most 25). Each nextOffset requires a new preview and confirmation.",
								if: "state.hasAnyArtist === true && state.hasAnySmartLink === false",
							},
							{
								do: "Offer dynamoi_get_campaign_readiness to validate launch inputs before creating anything, when that tool is available to this client.",
								if: "state.hasAnyArtist === true && state.hasAnyActiveCampaign === false",
							},
							{
								do: "Managed-advertising billing setup is not available through this MCP surface; tell the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.' After they start or restore billing there, poll dynamoi_get_billing for that artist to confirm billing is active.",
								if: "state.hasAnyArtist === true && billing is the launch blocker",
							},
							{
								do: "When connection tools are available to this client, offer dynamoi_start_meta_connection for the target artist, then poll dynamoi_get_platform_status for that artist with the returned onboardingAttemptId and onboardingFlow=meta after Meta returns them to chat. The completion field is platforms.meta.status. On surfaces without connection tools, direct the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.'",
								if: "state.hasAnyArtist === true && user wants Spotify Smart Campaigns && state.hasAnyConnectedMeta === false",
							},
							{
								do: "When connection tools are available to this client, offer dynamoi_start_youtube_channel_link for the target artist, then poll dynamoi_get_platform_status for that artist with the returned onboardingAttemptId and onboardingFlow=youtube after Google returns them to chat. The completion field is platforms.youtube.connected. On surfaces without connection tools, direct the user: 'You can do this in the Dynamoi dashboard at https://dynamoi.com/dashboard.'",
								if: "state.hasAnyArtist === true && user wants YouTube growth && state.hasAnyConnectedYoutube === false",
							},
							{
								do: "Ask whether they want a performance summary, a new campaign, or to update an existing campaign.",
								if: "state.hasAnyActiveCampaign === true",
							},
						],
						source:
							"This tree mirrors dynamoi_get_account_overview.recommendedNextActions. Use either; the tree is for explaining the plan to the user, the array is for deciding the next tool call.",
						talkingPoints: {
							creatorFirstChoice: {
								claim:
									"Spotify artists should start from a Spotify artist URL; YouTube creators should start by linking a channel; labels and managers should pick one artist as the first setup path.",
								trigger:
									"Brand-new user has no artists and asks what to do first.",
							},
							postLaunchExpectations: {
								claim:
									"Campaigns need 7-14 days of learning before judging performance. Early reads should focus on blockers, delivery status, spend, CPC, and whether attribution is flowing.",
								trigger:
									"User asks what happens after launch or whether a first-day result is good or bad.",
							},
							smartLinkBeforeAds: {
								claim:
									"A free Smart Link is the fastest visible setup step because it produces a public asset, starts catalog context, and creates a natural handoff into campaign readiness.",
								trigger:
									"User has an artist but no Smart Link or asks why the assistant recommends links before ads.",
							},
						},
					}),
					uri: uri.href,
				},
			],
		}),
	);
}

import {
	artistLabel,
	type WorkspaceArtist,
	type WorkspaceRecord,
} from "./data";
export type Page = {
	rows: WorkspaceRecord[];
	next?: string | undefined;
	loading: boolean;
	error?: string;
	warning?: string;
};
export function createWorkspaceRenderer(doc: Document) {
	function node<K extends keyof HTMLElementTagNameMap>(
		tag: K,
		value?: string,
	): HTMLElementTagNameMap[K] {
		const element = doc.createElement(tag);
		if (value !== undefined) {
			element.textContent = value;
		}
		return element;
	}
	function button(label: string, action: () => void, key?: string) {
		const element = node("button", label);
		element.type = "button";
		element.onclick = action;
		if (key) {
			element.dataset.focus = key;
		}
		return element;
	}
	function renderList({
		page,
		tab,
		selectedId,
		loadPage,
		chooseRecord,
	}: {
		page: Page;
		tab: "campaign" | "smartlink";
		selectedId?: string | undefined;
		loadPage: (append?: boolean) => Promise<void>;
		chooseRecord: (kind: "campaign" | "smartlink", id: string) => Promise<void>;
	}) {
		const list = node("section");
		list.setAttribute(
			"aria-label",
			tab === "campaign" ? "Campaign list" : "Smart Link list",
		);
		list.setAttribute("aria-busy", String(page.loading));
		if (page.loading) {
			list.append(node("p", "Loading records…"));
		}
		if (page.error) {
			const error = node("p", page.error);
			error.setAttribute("role", "alert");
			list.append(
				error,
				button("Retry records", () => void loadPage(page.rows.length > 0)),
			);
		}
		if (!(page.loading || page.error || page.warning || page.rows.length > 0)) {
			list.append(
				node(
					"p",
					tab === "campaign"
						? "No campaigns for this artist."
						: "No Smart Links for this artist.",
				),
			);
		}
		if (page.warning) {
			const warning = node("p", page.warning);
			warning.setAttribute("role", "alert");
			list.append(
				warning,
				button("Retry records", () => void loadPage()),
			);
		}
		const rows = node("ul");
		rows.className = "rows";
		for (const row of page.rows) {
			const li = node("li");
			const item = button("", () => void chooseRecord(tab, row.id), row.id);
			item.className = "row";
			item.append(node("span", row.name));
			if (row.status) {
				item.append(node("small", row.status));
			}
			item.setAttribute("aria-current", String(row.id === selectedId));
			li.append(item);
			rows.append(li);
		}
		list.append(rows);
		if (page.next) {
			const more = button(
				"More records",
				() => void loadPage(true),
				"records-more",
			);
			more.disabled = page.loading;
			more.className = "more";
			list.append(more);
		}
		return list;
	}
	function renderAvailability(panel: HTMLElement, detail: WorkspaceRecord) {
		for (const warning of detail.warnings ?? []) {
			const notice = node("p", warning);
			notice.setAttribute("role", "status");
			panel.append(notice);
		}
		if (detail.channelAvailability) {
			const availability = detail.channelAvailability;
			panel.append(
				node(
					"p",
					[
						availability.period,
						availability.asOf ? `As of ${availability.asOf}` : "",
						availability.observedThrough
							? `Observed through ${availability.observedThrough}`
							: "",
					]
						.filter(Boolean)
						.join("; "),
				),
			);
		}
		if (!detail.metrics?.length && detail.period) {
			panel.append(node("p", `Requested results window: ${detail.period}`));
		}
	}
	function renderArtistSelector(
		roster: WorkspaceArtist[],
		artistId: string | undefined,
		canRead: boolean,
	) {
		const label = node("label", "Artist");
		label.htmlFor = "artist-selector";
		const select = node("select");
		select.id = "artist-selector";
		select.dataset.focus = "artist";
		select.disabled = !canRead;
		if (!artistId) {
			const option = node("option", "Choose an artist");
			option.value = "";
			option.selected = true;
			select.append(option);
		}
		for (const row of roster) {
			const option = node("option", artistLabel(row, roster));
			option.value = row.id;
			option.selected = row.id === artistId;
			select.append(option);
		}
		return { label, select };
	}
	function renderDetail({
		detailLoading,
		detailError,
		selectedId,
		tab,
		detail,
		shareMessage,
		canShare,
		canOpen,
		openPublicLink,
		chooseRecord,
		useInConversation,
	}: {
		detailLoading: boolean;
		detailError?: string | undefined;
		selectedId?: string | undefined;
		tab: "campaign" | "smartlink";
		detail?: WorkspaceRecord | undefined;
		shareMessage: string;
		canShare: boolean;
		canOpen: boolean;
		openPublicLink: () => Promise<void>;
		chooseRecord: (kind: "campaign" | "smartlink", id: string) => Promise<void>;
		useInConversation: () => Promise<void>;
	}) {
		const metricsTitle = detail?.sampleResults
			? "Sample results"
			: "Observed results";
		const panel = node("section");
		panel.className = "detail";
		panel.setAttribute("aria-label", "Selected record");
		panel.setAttribute("aria-busy", String(detailLoading));
		if (detailLoading) {
			panel.append(node("p", "Loading details and observed results…"));
		}
		if (detailError) {
			const error = node("p", detailError);
			error.setAttribute("role", "alert");
			panel.append(error);
			if (selectedId) {
				panel.append(
					button(
						"Retry details",
						() => void chooseRecord(tab, selectedId ?? ""),
					),
				);
			}
		}
		if (detail) {
			panel.append(node("h2", detail.name));
			if (detail.status) {
				panel.append(node("p", detail.status));
			}
			renderAvailability(panel, detail);
			if (detail.metrics?.length) {
				panel.append(node("h3", metricsTitle));
				if (detail.period) {
					panel.append(node("p", detail.period));
				}
				const dl = node("dl");
				for (const metric of detail.metrics) {
					const row = node("div");
					row.append(
						node("dt", metric.label),
						node("dd", metric.value.toLocaleString()),
					);
					dl.append(row);
				}
				panel.append(dl, node("p", detail.source));
			} else if (detail.kind !== "artist") {
				panel.append(
					node("p", "No observed metrics were returned for this record."),
				);
			}
			if (detail.channel) {
				panel.append(
					node("h3", "Observed YouTube channel results"),
					node("p", detail.channel.period),
				);
				const dl = node("dl");
				for (const metric of detail.channel.metrics) {
					const row = node("div");
					row.append(
						node("dt", metric.label),
						node("dd", metric.value.toLocaleString()),
					);
					dl.append(row);
				}
				panel.append(
					dl,
					node(
						"p",
						`${detail.channel.source}. As of ${detail.channel.asOf ?? "unknown"}; observed through ${detail.channel.observedThrough}. ${detail.channel.missingDays} missing days; ${detail.channel.placeholderDays} placeholder days.`,
					),
					node("p", detail.channel.attribution),
				);
			}
			if (detail.url) {
				const link = button(
					"Open public Smart Link",
					() => void openPublicLink(),
					"open-link",
				);
				link.disabled = !canOpen;
				panel.append(link, node("p", detail.url));
				if (!canOpen) {
					panel.append(
						node(
							"p",
							"This host cannot open links. Copy the public URL to open it yourself.",
						),
					);
				}
			}
			const actions = node("div");
			actions.className = "actions";
			const share = button(
				"Use in conversation",
				() => void useInConversation(),
				"share",
			);
			share.disabled = !canShare;
			actions.append(share);
			panel.append(actions);
			panel.append(
				node(
					"p",
					canShare
						? "Shares this record’s ID, artist ID, name, status, displayed results and availability warnings."
						: "Conversation context is unavailable in this host. Use the individual read tools instead.",
				),
			);
		}
		if (!(detail || detailLoading || detailError)) {
			panel.append(node("p", "Choose a record to inspect its results."));
		}
		const feedback = node("p", shareMessage);
		feedback.setAttribute("role", "status");
		panel.append(feedback);
		return panel;
	}
	return { button, node, renderArtistSelector, renderDetail, renderList };
}

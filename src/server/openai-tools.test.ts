import { expect, test } from "bun:test";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createDynamoiMcpServer, type Phase3Adapter } from "./create-server";

function buildStubAdapter(overrides: Partial<Phase3Adapter>): Phase3Adapter {
	const stub = async () => ({
		message: "Adapter method not used in tests.",
		status: "error" as const,
	});
	return new Proxy({} as Phase3Adapter, {
		get: (_target, property) =>
			typeof property === "string" && property in overrides
				? overrides[property as keyof Phase3Adapter]
				: stub,
	});
}

// Public server boundary: the dashboard test verifies safe inner failure propagation.
test("public search observes one safe failed invocation", async () => {
	const failure = {
		kind: "unknown",
		message: "Something went wrong. Please try again.",
		status: "error",
	} as const;
	const observations: string[] = [];
	let innerCalls = 0;
	const server = createDynamoiMcpServer({
		adapter: buildStubAdapter({
			openAiSearch: async () => {
				innerCalls += 1;
				return failure;
			},
		}),
		onToolCall: (observation) => {
			observations.push(observation.toolName);
		},
	});
	const client = new Client({ name: "openai-search-test", version: "0.0.0" });
	const [clientTransport, serverTransport] =
		InMemoryTransport.createLinkedPair();
	try {
		await server.connect(serverTransport);
		await client.connect(clientTransport);
		const result = await client.callTool({
			arguments: { query: "Artist" },
			name: "search",
		});
		expect(result.isError).toBe(true);
		expect(result.structuredContent).toMatchObject({
			kind: "unknown",
			status: "error",
		});
		expect(result.structuredContent).toEqual(failure);
		expect(observations).toEqual(["search"]);
		expect(innerCalls).toBe(1);
	} finally {
		await client.close();
		await server.close();
	}
});

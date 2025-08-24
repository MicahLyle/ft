import { computed, createApp, reactive, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

function generateAlphanumeric(length = 7) {
	// Exclude visually similar characters: I, O, l, 0, 1
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
	let out = "";
	for (let i = 0; i < length; i += 1) {
		out += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return out;
}

function generateNodePassword() {
	return generateAlphanumeric(7);
}

class Node {
	constructor(index) {
		this.index = index;
		this.id = `fe-${index + 1}`;
		this.state = reactive({
			frontendId: this.id,
			initialized: true,
			password: generateNodePassword(),
			status: "pending",
			frontendElapsedMs: undefined,
			djangoStartDeltaMs: undefined,
			djangoElapsedMs: undefined,
			djangoPid: undefined,
			djangoTid: undefined,
			httpStatus: undefined,
			ok: undefined,
			error_type: undefined,
			_error: undefined,
		});
	}

	async run(operation, config) {
		const jsStartEpochMs = Date.now();
		const jsStartPerfMs = performance.now();
		this.state.status = "started";
		this.state._error = undefined;

		const endpoint = {
			ping: "/api/sync/pw/ping",
			"hash-pw": "/api/sync/pw/set",
			"check-pw": "/api/sync/pw/check",
			"hash-and-check-pw": "/api/sync/pw/set-and-check",
		}[operation];

		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Django-Request-ID": this.id,
				},
				body: JSON.stringify({
					pw: this.state.password,
					db: config.db,
					operation,
					hasher: config.hasher,
				}),
			});

			// Timings
			const jsEndPerfMs = performance.now();
			this.state.frontendElapsedMs = Number((jsEndPerfMs - jsStartPerfMs).toFixed(4));

			// Headers
			const hdr = res.headers;
			const djangoStartIso = hdr.get("X-Django-Request-Start");
			const djangoPerfMs = hdr.get("X-Django-Perf-Time-MS");
			const djangoPid = hdr.get("X-Django-Python-Process-ID");
			const djangoTid = hdr.get("X-Django-Native-Thread-ID") || hdr.get("X-Django-Python-Thread-ID");

			if (djangoStartIso) {
				const djangoStartEpochMs = Date.parse(djangoStartIso);
				this.state.djangoStartDeltaMs = Number((djangoStartEpochMs - jsStartEpochMs).toFixed(4));
			}
			if (djangoPerfMs) {
				this.state.djangoElapsedMs = Number(parseFloat(djangoPerfMs).toFixed(4));
			}
			this.state.djangoPid = djangoPid || undefined;
			this.state.djangoTid = djangoTid || undefined;
			this.state.httpStatus = res.status;

			let data = null;
			try {
				data = await res.json();
			} catch (_) {
				data = null;
			}

			this.state.ok = data && "ok" in data ? data.ok : undefined;
			this.state.error_type = data && "error_type" in data ? data.error_type : undefined;
			if (this.state.httpStatus >= 500 || this.state.httpStatus === 404) {
				this.state.ok = false;
			}
			this.state.status = "completed";
			return { data, status: res.status };
		} catch (err) {
			this.state._error = String(err);
			this.state.status = "error";
			this.state.httpStatus = undefined;
			this.state.error_type = undefined;
			return { data: null, status: undefined, error: err };
		}
	}
}

const App = {
	setup() {
		const running = ref(false);
		const hasHashed = ref(false);
		const hasHashedAndChecked = ref(false);

		const config = reactive({
			db: "sqlite",
			operation: "ping",
			hasher: "pbkdf2",
			nodeCount: 100,
		});

		const nodes = reactive([]);

		function ensureNodes(n) {
			if (n < nodes.length) {
				nodes.splice(n); // shrink
				return;
			}
			for (let i = nodes.length; i < n; i += 1) {
				nodes.push(new Node(i));
			}
		}

		const startedCount = computed(() => nodes.filter((n) => n.state.status !== "pending").length);
		const completedCount = computed(() => nodes.filter((n) => n.state.status === "completed").length);

		async function runAll() {
			if (running.value) return;
			running.value = true;
			ensureNodes(Math.min(Math.max(config.nodeCount, 1), 300));
			for (const n of nodes) {
				n.state.status = "pending";
				n.state.frontendElapsedMs = undefined;
				n.state.djangoStartDeltaMs = undefined;
				n.state.djangoElapsedMs = undefined;
				n.state.djangoPid = undefined;
				n.state.djangoTid = undefined;
				n.state.httpStatus = undefined;
				n.state.ok = undefined;
				n.state.error_type = undefined;
				n.state._error = undefined;
			}

			const promises = nodes.map(async (n) => {
				const { data, status } = await n.run(config.operation, config);
				if (config.operation === "hash-pw" && data && data.ok === true) {
					hasHashed.value = true;
				}
				if (config.operation === "hash-and-check-pw" && data) {
					if (data.ok === true) hasHashed.value = true;
					if (typeof data.ok1 === "boolean" || typeof data.ok2 === "boolean") {
						hasHashedAndChecked.value = Boolean(data.ok1 && data.ok2);
					}
				}
			});

			await Promise.allSettled(promises);
			running.value = false;
		}

		const canSelectCheckOps = computed(() => hasHashed.value);

		return {
			nodes,
			running,
			config,
			hasHashed,
			hasHashedAndChecked,
			canSelectCheckOps,
			startedCount,
			completedCount,
			runAll,
			ensureNodes,
		};
	},
	template: `
		<div>
			<h1>Concurrent Request Test</h1>
			<div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
				<label>DB:</label>
				<select v-model="config.db" :disabled="running">
					<option value="sqlite">sqlite</option>
					<option value="postgres">postgres</option>
					<option value="mysql">mysql</option>
				</select>

				<label>Operation:</label>
				<select v-model="config.operation" :disabled="running">
					<option value="ping">ping</option>
					<option value="hash-pw">hash-pw</option>
					<option value="check-pw" :disabled="!canSelectCheckOps">check-pw</option>
					<option value="hash-and-check-pw" :disabled="!canSelectCheckOps">hash-and-check-pw</option>
				</select>

				<label>Hasher:</label>
				<select v-model="config.hasher" :disabled="running">
					<option value="pbkdf2">pbkdf2</option>
					<option value="argon">argon</option>
					<option value="bcrypt">bcrypt</option>
				</select>

				<label>Nodes:</label>
				<input type="number" v-model.number="config.nodeCount" min="1" max="300" :disabled="running" style="width: 80px;" />
				<button @click="runAll" :disabled="running">Run {{ config.nodeCount }} Requests</button>
				<span style="margin-left: 12px;">Started: {{ startedCount }}/{{ nodes.length }} • Completed: {{ completedCount }}/{{ nodes.length }}</span>
				<span v-if="hasHashed" style="margin-left: 12px; color: green;">hashed once</span>
				<span v-if="hasHashedAndChecked" style="margin-left: 6px; color: green;">hash+check succeeded</span>
			</div>

			<table border="1" cellspacing="0" cellpadding="6" v-if="nodes.length > 0">
				<thead>
					<tr>
						<th>Frontend ID</th>
						<th>HTTP</th>
						<th>OK</th>
						<th>Error Type</th>
						<th>Frontend Elapsed (ms)</th>
						<th>Django Start Δms</th>
						<th>Django Elapsed (ms)</th>
						<th>Django PID</th>
						<th>Django TID</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="n in nodes" :key="n.state.frontendId">
						<td>{{ n.state.frontendId }}</td>
						<td>{{ n.state.httpStatus ?? '' }}</td>
						<td>
							<span v-if="n.state.ok === true" style="color: green;">✔</span>
							<span v-else-if="n.state.ok === false" style="color: red;">✖</span>
							<span v-else style="color: gray;">?</span>
						</td>
						<td>{{ n.state.error_type ?? '' }}</td>
						<td>{{ n.state.frontendElapsedMs ?? '' }}</td>
						<td>{{ n.state.djangoStartDeltaMs ?? '' }}</td>
						<td>{{ n.state.djangoElapsedMs ?? '' }}</td>
						<td>{{ n.state.djangoPid ?? '' }}</td>
						<td>{{ n.state.djangoTid ?? '' }}</td>
						<td>
							<span v-if="n.state.status === 'pending'">pending</span>
							<span v-else-if="n.state.status === 'started'">started</span>
							<span v-else-if="n.state.status === 'completed'">completed</span>
							<span v-else>error</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	`,
};

createApp(App).mount("#app");

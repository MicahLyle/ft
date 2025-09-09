const { computed, createApp, reactive, ref } = globalThis.Vue;

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
			jsStartEpochMs: undefined,
			jsEndEpochMs: undefined,
			frontendElapsedMs: undefined,
			djangoStartDeltaMs: undefined,
			djangoElapsedMs: undefined,
			djangoPid: undefined,
			djangoTid: undefined,
			httpStatus: undefined,
			ok: undefined,
			error_type: undefined,
			_error: undefined,
			concurrencyC1: undefined,
			concurrencyC2: undefined,
			concurrencyC3: undefined,
			concurrencyC4: undefined,
		});
	}

	async run(operation, config) {
		const jsStartEpochMs = Date.now();
		const jsStartPerfMs = performance.now();
		this.state.status = "started";
		this.state._error = undefined;
		this.state.jsStartEpochMs = jsStartEpochMs;

		const endpoint = {
			ping: "/api/sync/pw/ping",
			"hash-pw": "/api/sync/pw/set",
			"check-pw": "/api/sync/pw/check",
			"hash-and-check-pw": "/api/sync/pw/set-and-check",
			"hash-and-store-pw": "/api/sync/pw/set-and-store",
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
			this.state.jsEndEpochMs = Date.now();

			// Headers
			const hdr = res.headers;
			const djangoStartIso = hdr.get("X-Django-Request-Start");
			const djangoPerfMs = hdr.get("X-Django-Perf-Time-MS");
			const djangoPid = hdr.get("X-Django-Python-Process-ID");
			const djangoTid = hdr.get("X-Django-Native-Thread-ID") || hdr.get("X-Django-Python-Thread-ID");
			const c1s = hdr.get("X-Django-Concurrency-Start-Before");
			const c2s = hdr.get("X-Django-Concurrency-Start-After");
			const c3s = hdr.get("X-Django-Concurrency-End-Before");
			const c4s = hdr.get("X-Django-Concurrency-End-After");

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
			this.state.concurrencyC1 =
				c1s !== null && c1s !== "" && !Number.isNaN(parseInt(c1s, 10)) ? parseInt(c1s, 10) : undefined;
			this.state.concurrencyC2 =
				c2s !== null && c2s !== "" && !Number.isNaN(parseInt(c2s, 10)) ? parseInt(c2s, 10) : undefined;
			this.state.concurrencyC3 =
				c3s !== null && c3s !== "" && !Number.isNaN(parseInt(c3s, 10)) ? parseInt(c3s, 10) : undefined;
			this.state.concurrencyC4 =
				c4s !== null && c4s !== "" && !Number.isNaN(parseInt(c4s, 10)) ? parseInt(c4s, 10) : undefined;

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
			this.state.jsEndEpochMs = Date.now();
			return { data: null, status: undefined, error: err };
		}
	}
}

// Utility stats helpers
function numericMedian(values) {
	const nums = values
		.filter((v) => typeof v === "number" && !Number.isNaN(v))
		.slice()
		.sort((a, b) => a - b);
	if (nums.length === 0) return undefined;
	const mid = Math.floor(nums.length / 2);
	if (nums.length % 2 === 0) return Number(((nums[mid - 1] + nums[mid]) / 2).toFixed(4));
	return Number(nums[mid].toFixed(4));
}

function numericMean(values) {
	const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
	if (nums.length === 0) return undefined;
	const sum = nums.reduce((acc, v) => acc + v, 0);
	return Number((sum / nums.length).toFixed(4));
}

// 32 PID colors
const PROCESS_COLOR_PALETTE = [
	"red",
	"orangered",
	"tomato",
	"coral",
	"darkorange",
	"orange",
	"gold",
	"goldenrod",
	"yellowgreen",
	"chartreuse",
	"lawngreen",
	"limegreen",
	"seagreen",
	"mediumseagreen",
	"teal",
	"darkcyan",
	"deepskyblue",
	"dodgerblue",
	"cornflowerblue",
	"royalblue",
	"mediumblue",
	"slateblue",
	"mediumpurple",
	"blueviolet",
	"mediumorchid",
	"orchid",
	"deeppink",
	"hotpink",
	"crimson",
	"indigo",
	"rebeccapurple",
	"darkmagenta",
];

// 64 TID colors
const THREAD_COLOR_PALETTE = [
	"firebrick",
	"darkred",
	"brown",
	"chocolate",
	"saddlebrown",
	"sienna",
	"salmon",
	"darksalmon",
	"lightsalmon",
	"sandybrown",
	"burlywood",
	"tan",
	"wheat",
	"moccasin",
	"navajowhite",
	"peachpuff",
	"bisque",
	"antiquewhite",
	"blanchedalmond",
	"papayawhip",
	"cornsilk",
	"darkgoldenrod",
	"khaki",
	"darkkhaki",
	"lemonchiffon",
	"green",
	"darkgreen",
	"forestgreen",
	"darkolivegreen",
	"mediumaquamarine",
	"aquamarine",
	"springgreen",
	"mediumspringgreen",
	"lightgreen",
	"palegreen",
	"darkseagreen",
	"aqua",
	"cyan",
	"turquoise",
	"mediumturquoise",
	"paleturquoise",
	"lightcyan",
	"lightblue",
	"powderblue",
	"lightskyblue",
	"skyblue",
	"steelblue",
	"navy",
	"midnightblue",
	"blue",
	"darkblue",
	"darkslateblue",
	"fuchsia",
	"magenta",
	"purple",
	"darkviolet",
	"darkorchid",
	"plum",
	"thistle",
	"violet",
	"lavender",
	"pink",
	"lightpink",
	"palevioletred",
];

function buildCountsWithColors(values, palette) {
	const counts = new Map();
	for (const v of values) {
		if (!v) continue;
		counts.set(v, (counts.get(v) || 0) + 1);
	}
	const unique = Array.from(counts.keys()).sort();
	const result = [];
	for (let i = 0; i < unique.length; i += 1) {
		const key = unique[i];
		result.push({ key, count: counts.get(key), color: palette[i % palette.length] });
	}
	return result;
}

function computeConcurrencyBuckets(nodes) {
	const valid = nodes.filter(
		(n) => typeof n.state.jsStartEpochMs === "number" && typeof n.state.jsEndEpochMs === "number"
	);
	if (valid.length === 0) return [];
	const globalStart = Math.min(...valid.map((n) => n.state.jsStartEpochMs));
	const globalEnd = Math.max(...valid.map((n) => n.state.jsEndEpochMs));
	const total = globalEnd - globalStart;
	if (!(total > 0)) return [];

	// Precompute server intervals in epoch for nodes that have Django times
	const serverIntervals = nodes
		.map((n) => {
			const hasAll =
				typeof n.state.jsStartEpochMs === "number" &&
				typeof n.state.djangoStartDeltaMs === "number" &&
				typeof n.state.djangoElapsedMs === "number";
			if (!hasAll) return null;
			const start = n.state.jsStartEpochMs + n.state.djangoStartDeltaMs;
			const end = start + n.state.djangoElapsedMs;
			return { start, end };
		})
		.filter(Boolean);

	const bucketCount = 20;
	const bucketWidth = total / bucketCount;
	const out = [];
	for (let i = 0; i < bucketCount; i += 1) {
		const center = globalStart + (i + 0.5) * bucketWidth;
		const concurrency = serverIntervals.reduce((acc, iv) => acc + (iv.start <= center && center <= iv.end ? 1 : 0), 0);
		out.push({ deltaMs: Number((center - globalStart).toFixed(4)), concurrency });
	}
	return out;
}

function buildNodeGroupStats(nodes) {
	const elapsed = nodes.map((n) => n.state.djangoElapsedMs).filter((v) => typeof v === "number" && !Number.isNaN(v));
	const min = elapsed.length ? Number(Math.min(...elapsed).toFixed(4)) : undefined;
	const max = elapsed.length ? Number(Math.max(...elapsed).toFixed(4)) : undefined;
	const median = numericMedian(elapsed);
	const mean = numericMean(elapsed);

	const pidCounts = buildCountsWithColors(
		nodes.map((n) => n.state.djangoPid),
		PROCESS_COLOR_PALETTE
	);
	const tidCounts = buildCountsWithColors(
		nodes.map((n) => n.state.djangoTid),
		THREAD_COLOR_PALETTE
	);

	const buckets = computeConcurrencyBuckets(nodes);

	// Concurrency summary from buckets
	const concurrencyValues = buckets.map((b) => b.concurrency);
	const concurrencyMin = concurrencyValues.length ? Math.min(...concurrencyValues) : undefined;
	const concurrencyMax = concurrencyValues.length ? Math.max(...concurrencyValues) : undefined;
	const concurrencyMedian = concurrencyValues.length ? numericMedian(concurrencyValues) : undefined;
	const concurrencyMean = concurrencyValues.length ? numericMean(concurrencyValues) : undefined;

	// Compute the maximum server end delta (relative to earliest JS start), to size x-axes
	let maxServerEndDelta = undefined;
	const serverCandidates = nodes.filter(
		(n) =>
			typeof n.state.jsStartEpochMs === "number" &&
			typeof n.state.djangoStartDeltaMs === "number" &&
			typeof n.state.djangoElapsedMs === "number"
	);
	if (serverCandidates.length > 0) {
		const globalStart = Math.min(...serverCandidates.map((n) => n.state.jsStartEpochMs));
		const endDeltas = serverCandidates.map((n) => {
			const start = n.state.jsStartEpochMs + n.state.djangoStartDeltaMs;
			const end = start + n.state.djangoElapsedMs;
			return end - globalStart;
		});
		if (endDeltas.length > 0) {
			maxServerEndDelta = Number(Math.max(...endDeltas).toFixed(4));
		}
	}

	// Total time for all requests (based on JS start/end across nodes)
	const jsValid = nodes.filter(
		(n) => typeof n.state.jsStartEpochMs === "number" && typeof n.state.jsEndEpochMs === "number"
	);
	let totalBatchMs = undefined;
	if (jsValid.length > 0) {
		const gStart = Math.min(...jsValid.map((n) => n.state.jsStartEpochMs));
		const gEnd = Math.max(...jsValid.map((n) => n.state.jsEndEpochMs));
		const total = gEnd - gStart;
		totalBatchMs = total > 0 ? Number(total.toFixed(4)) : undefined;
	}

	const distinctProcesses = pidCounts.length;
	const distinctThreads = tidCounts.length;

	return {
		min,
		max,
		median,
		mean,
		pidCounts,
		tidCounts,
		buckets,
		maxServerEndDelta,
		// New summary fields
		distinctProcesses,
		distinctThreads,
		concurrencyMin,
		concurrencyMax,
		concurrencyMedian,
		concurrencyMean,
		totalBatchMs,
	};
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
				n.state.jsStartEpochMs = undefined;
				n.state.jsEndEpochMs = undefined;
				// 50% password regeneration for hash operations
				if (config.operation === "hash-pw" || config.operation === "hash-and-check-pw") {
					if (!n.state.password) {
						n.state.password = generateNodePassword();
					} else if (Math.random() < 0.5) {
						n.state.password = generateNodePassword();
					}
				}
			}

			const promises = nodes.map(async (n) => {
				const { data, status } = await n.run(config.operation, config);
				if ((config.operation === "hash-pw" || config.operation === "hash-and-store-pw") && data && data.ok === true) {
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

		const groupStats = computed(() => buildNodeGroupStats(nodes));

		// ECharts options (computed)
		const pidBarOptions = computed(() => {
			const builder = (globalThis.FTCharts && FTCharts.options && FTCharts.options.buildPidCountBarOptions) || null;
			return builder ? builder(groupStats.value) : {};
		});
		const tidBarOptions = computed(() => {
			const builder = (globalThis.FTCharts && FTCharts.options && FTCharts.options.buildTidCountBarOptions) || null;
			return builder ? builder(groupStats.value) : {};
		});
		const idxToDjangoElapsedOptions = computed(() => {
			const builder =
				(globalThis.FTCharts && FTCharts.options && FTCharts.options.buildIndexToValueScatterOptions) || null;
			return builder ? builder("Req Index → Django Elapsed ms", nodes, "djangoElapsedMs") : {};
		});
		const idxToOverallMsOptions = computed(() => {
			const builder =
				(globalThis.FTCharts && FTCharts.options && FTCharts.options.buildIndexToOverallRequestTimeOptions) || null;
			return builder ? builder(nodes) : {};
		});
		const concurrencyLineOptions = computed(() => {
			const builder =
				(globalThis.FTCharts && FTCharts.options && FTCharts.options.buildConcurrencyLineOptions) || null;
			return builder ? builder(groupStats.value) : {};
		});
		const waterfallOptions = computed(() => {
			const builder = (globalThis.FTCharts && FTCharts.options && FTCharts.options.buildWaterfallOptions) || null;
			return builder ? builder(nodes) : {};
		});

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
			groupStats,
			pidBarOptions,
			tidBarOptions,
			idxToDjangoElapsedOptions,
			idxToOverallMsOptions,
			concurrencyLineOptions,
			waterfallOptions,
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
					<option value="hash-and-store-pw" >hash-and-store-pw</option>
					<option value="check-pw" :disabled="!canSelectCheckOps">check-pw</option>
					<option value="hash-and-check-pw" :disabled="!canSelectCheckOps">hash-and-check-pw</option>

				</select>

				<label>Hasher:</label>
				<select v-model="config.hasher" :disabled="running">
					<option value="pbkdf2">pbkdf2</option>
					<option value="argon">argon</option>
					<option value="bcrypt">bcrypt</option>
					<option value="blake3">blake3</option>
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
						<th>Password</th>
						<th>HTTP</th>
						<th>OK</th>
						<th>Error Type</th>
						<th>Frontend Elapsed (ms)</th>
						<th>Django Start Δms</th>
						<th>Django Elapsed (ms)</th>
						<th>Django PID</th>
						<th>Django TID</th>
						<th>Req C</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="n in nodes" :key="n.state.frontendId">
						<td>{{ n.state.frontendId }}</td>
						<td>{{ n.state.password }}</td>
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
							<span v-if="n.state.concurrencyC1 !== undefined || n.state.concurrencyC2 !== undefined || n.state.concurrencyC3 !== undefined || n.state.concurrencyC4 !== undefined">
								{{ [n.state.concurrencyC1, n.state.concurrencyC2, n.state.concurrencyC3, n.state.concurrencyC4].map(v => v === undefined ? '' : v).join(', ') }}
							</span>
							<span v-else></span>
						</td>
						<td>
							<span v-if="n.state.status === 'pending'">pending</span>
							<span v-else-if="n.state.status === 'started'">started</span>
							<span v-else-if="n.state.status === 'completed'">completed</span>
							<span v-else>error</span>
						</td>
					</tr>
				</tbody>
			</table>

			<!-- Summary Stats -->
			<div v-if="nodes.length > 0" style="margin-top: 16px; padding: 12px; border: 2px solid #999; background: #fafafa; font-size: 15px;">
				<h3 style="margin: 0 0 8px 0; font-size: 18px;">Summary</h3>
				<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 16px; align-items: center;">
					<div><strong>Processes</strong>: {{ groupStats.distinctProcesses ?? '—' }}</div>
					<div><strong>Threads</strong>: {{ groupStats.distinctThreads ?? '—' }}</div>
					<div><strong>Total time (ms)</strong>: {{ groupStats.totalBatchMs ?? '—' }}</div>

					<div><strong>Django Min (ms)</strong>: {{ groupStats.min ?? '—' }}</div>
					<div><strong>Django Max (ms)</strong>: {{ groupStats.max ?? '—' }}</div>
					<div><strong>Django Mean (ms)</strong>: {{ groupStats.mean ?? '—' }}</div>
					<div><strong>Django Median (ms)</strong>: {{ groupStats.median ?? '—' }}</div>

					<div><strong>Concurrency Min</strong>: {{ groupStats.concurrencyMin ?? '—' }}</div>
					<div><strong>Concurrency Max</strong>: {{ groupStats.concurrencyMax ?? '—' }}</div>
					<div><strong>Concurrency Mean</strong>: {{ groupStats.concurrencyMean ?? '—' }}</div>
					<div><strong>Concurrency Median</strong>: {{ groupStats.concurrencyMedian ?? '—' }}</div>
				</div>
			</div>

			<div v-if="nodes.length > 0" style="margin-top: 16px;">
				<h3>Charts</h3>
				<div>
					<div id="chart-group-main" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
						<v-chart :option="pidBarOptions" autoresize style="width: 100%; height: 260px; border: 1px solid #ddd;" />
						<v-chart :option="tidBarOptions" autoresize style="width: 100%; height: 260px; border: 1px solid #ddd;" />
						<v-chart :option="idxToDjangoElapsedOptions" autoresize style="width: 100%; height: 260px; border: 1px solid #ddd;" />
						<v-chart :option="idxToOverallMsOptions" autoresize style="width: 100%; height: 260px; border: 1px solid #ddd;" />
					</div>
					<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px;">
						<v-chart :option="concurrencyLineOptions" autoresize style="width: 100%; height: 260px; border: 1px solid #ddd; grid-column: span 2;" />
						<v-chart :option="waterfallOptions" autoresize style="width: 100%; height: 340px; border: 1px solid #ddd; grid-column: span 2;" />
					</div>
				</div>
			</div>

			<div v-if="nodes.length > 0" style="margin-top: 16px;">
				<h3>Raw Stats</h3>
				<div>
					<strong>Django Elapsed (ms)</strong>:
					<span>min={{ groupStats.min ?? '—' }}</span>,
					<span>max={{ groupStats.max ?? '—' }}</span>,
					<span>median={{ groupStats.median ?? '—' }}</span>,
					<span>mean={{ groupStats.mean ?? '—' }}</span>
				</div>
				<div style="margin-top: 8px; display: flex; gap: 24px; flex-wrap: wrap;">
					<div>
						<strong>PID counts</strong>
						<div v-if="groupStats.pidCounts.length === 0">—</div>
						<div v-for="p in groupStats.pidCounts" :key="'pid-' + p.key" style="display: flex; align-items: center; gap: 6px;">
							<span :style="{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: p.color, border: '1px solid #999' }"></span>
							<span>PID {{ p.key }}: {{ p.count }}</span>
						</div>
					</div>
					<div>
						<strong>TID counts</strong>
						<div v-if="groupStats.tidCounts.length === 0">—</div>
						<div v-for="t in groupStats.tidCounts" :key="'tid-' + t.key" style="display: flex; align-items: center; gap: 6px;">
							<span :style="{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: t.color, border: '1px solid #999' }"></span>
							<span>TID {{ t.key }}: {{ t.count }}</span>
						</div>
					</div>
				</div>

				<div style="margin-top: 8px;">
					<strong>Concurrency (20 buckets)</strong>
					<div v-if="groupStats.buckets.length === 0">—</div>
					<div v-else style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px 12px;">
						<div v-for="b in groupStats.buckets" :key="'b-' + b.deltaMs">Δ{{ Math.round(b.deltaMs) }} ms → {{ b.concurrency }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
};

const __app = createApp(App);
if (globalThis.FTCharts && typeof FTCharts.registerCharts === "function") {
	FTCharts.registerCharts(__app);
}
__app.mount("#app");

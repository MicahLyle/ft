import { createApp, ref, reactive, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

function generateAlphanumeric(length = 10) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let out = '';
	for (let i = 0; i < length; i += 1) {
		out += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return out;
}

const App = {
	setup() {
		const totalRequests = 50;
		const running = ref(false);
		const password = ref(generateAlphanumeric(10));
		const rows = reactive(Array.from({ length: totalRequests }, (_, idx) => ({
			frontendId: `fe-${idx + 1}`,
			status: 'pending',
			frontendElapsedMs: undefined,
			djangoStartDeltaMs: undefined,
			djangoElapsedMs: undefined,
			djangoPid: undefined,
			djangoTid: undefined,
			_error: undefined,
		})));

		const startedCount = computed(() => rows.filter(r => r.status !== 'pending').length);
		const completedCount = computed(() => rows.filter(r => r.status === 'completed').length);

		async function sendOne(index) {
			const row = rows[index];
			const requestId = row.frontendId;
			const jsStartEpochMs = Date.now();
			const jsStartPerfMs = performance.now();
			row.status = 'started';

			try {
				const res = await fetch('/api/pw', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Django-Request-ID': requestId,
					},
					body: JSON.stringify({ pw: password.value }),
				});

				// Measure timings
				const jsEndPerfMs = performance.now();
				row.frontendElapsedMs = Number((jsEndPerfMs - jsStartPerfMs).toFixed(4));

				// Extract server headers
				const hdr = res.headers;
				const djangoStartIso = hdr.get('X-Django-Request-Start');
				const djangoPerfMs = hdr.get('X-Django-Perf-Time-MS');
				const djangoPid = hdr.get('X-Django-Python-Process-ID');
				const djangoTid = hdr.get('X-Django-Native-Thread-ID') || hdr.get('X-Django-Python-Thread-ID');

				if (djangoStartIso) {
					const djangoStartEpochMs = Date.parse(djangoStartIso);
					row.djangoStartDeltaMs = Number((djangoStartEpochMs - jsStartEpochMs).toFixed(4));
				}
				if (djangoPerfMs) {
					row.djangoElapsedMs = Number(parseFloat(djangoPerfMs).toFixed(4));
				}
				row.djangoPid = djangoPid || undefined;
				row.djangoTid = djangoTid || undefined;

				// Best-effort body consume to free the connection
				try { await res.json(); } catch (_) { /* ignore */ }

				row.status = 'completed';
			} catch (err) {
				row._error = String(err);
				row.status = 'error';
			}
		}

		async function runAll() {
			if (running.value) return;
			running.value = true;
			// reset rows
			for (const row of rows) {
				row.status = 'pending';
				row.frontendElapsedMs = undefined;
				row.djangoStartDeltaMs = undefined;
				row.djangoElapsedMs = undefined;
				row.djangoPid = undefined;
				row.djangoTid = undefined;
				row._error = undefined;
			}

			const promises = Array.from({ length: totalRequests }, (_, i) => sendOne(i));
			await Promise.allSettled(promises);
			running.value = false;
		}

		function regeneratePassword() {
			password.value = generateAlphanumeric(10);
		}

		// No auto-run; user must click the button to start

		return {
			rows,
			running,
			password,
			startedCount,
			completedCount,
			runAll,
			regeneratePassword,
		};
	},
	template: `
		<div>
			<h1>Concurrent Request Test</h1>
			<div style="margin-bottom: 12px;">
				<label>Password: </label>
				<input :value="password" readonly style="width: 180px; margin-right: 8px;" />
				<button @click="regeneratePassword" :disabled="running || startedCount > 0">Regenerate</button>
				<button @click="runAll" v-if="startedCount === 0" style="margin-left: 8px;">Run 50 Requests</button>
				<span style="margin-left: 12px;" v-if="startedCount > 0">Started: {{ startedCount }}/50 • Completed: {{ completedCount }}/50</span>
			</div>

			<table border="1" cellspacing="0" cellpadding="6" v-if="startedCount > 0">
				<thead>
					<tr>
						<th>Frontend ID</th>
						<th>Frontend Elapsed (ms)</th>
						<th>Django Start Δms</th>
						<th>Django Elapsed (ms)</th>
						<th>Django PID</th>
						<th>Django TID</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.frontendId">
						<td>{{ row.frontendId }}</td>
						<td>{{ row.frontendElapsedMs ?? '' }}</td>
						<td>{{ row.djangoStartDeltaMs ?? '' }}</td>
						<td>{{ row.djangoElapsedMs ?? '' }}</td>
						<td>{{ row.djangoPid ?? '' }}</td>
						<td>{{ row.djangoTid ?? '' }}</td>
						<td>
							<span v-if="row.status === 'pending'">pending</span>
							<span v-else-if="row.status === 'started'">started</span>
							<span v-else-if="row.status === 'completed'">completed</span>
							<span v-else>error</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	`,
};

createApp(App).mount('#app');



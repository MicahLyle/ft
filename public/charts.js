(function (global) {
	"use strict";

	function registerCharts(app) {
		if (!app || typeof app.component !== "function") {
			console.warn("[charts.js] registerCharts(app) requires a Vue app instance.");
			return;
		}

		var component = global.VueECharts;
		if (!component) {
			console.warn("[charts.js] VueECharts global not found. Ensure vue-echarts is loaded.");
			return;
		}

		app.component("v-chart", component);
	}

	// ---- Option builders ----
	function buildBarOptionsFromCounts(title, counts) {
		var labels = counts.map(function (c) { return String(c.key); });
		var data = counts.map(function (c) { return { value: c.count, itemStyle: { color: c.color } }; });
		return {
			title: { text: title },
			animation: false,
			tooltip: { trigger: "axis" },
			xAxis: { type: "category", data: labels, axisLabel: { rotate: 30 } },
			yAxis: { type: "value" },
			series: [
				{ type: "bar", data: data }
			],
		};
	}

	function buildPidCountBarOptions(nodeGroupStats) {
		var counts = (nodeGroupStats && nodeGroupStats.pidCounts) || [];
		return buildBarOptionsFromCounts("PID → Count", counts);
	}

	function buildTidCountBarOptions(nodeGroupStats) {
		var counts = (nodeGroupStats && nodeGroupStats.tidCounts) || [];
		return buildBarOptionsFromCounts("TID → Count", counts);
	}

	function buildIndexToValueScatterOptions(title, nodes, valueKey) {
		var points = [];
		for (var i = 0; i < nodes.length; i += 1) {
			var n = nodes[i];
			var v = n && n.state ? n.state[valueKey] : undefined;
			if (typeof v === "number" && !Number.isNaN(v)) {
				points.push([i + 1, v]);
			}
		}
		return {
			title: { text: title },
			animation: false,
			tooltip: { trigger: "item" },
			xAxis: { type: "value", name: "req index" },
			yAxis: { type: "value" },
			series: [
				{ type: "scatter", symbolSize: 6, data: points }
			],
		};
	}

	function buildIndexToOverallRequestTimeOptions(nodes) {
		return buildIndexToValueScatterOptions("Req Index → Overall Request (Frontend) ms", nodes, "frontendElapsedMs");
	}

	function buildConcurrencyLineOptions(nodeGroupStats) {
		var buckets = (nodeGroupStats && nodeGroupStats.buckets) || [];
		var data = buckets.map(function (b) { return [b.deltaMs, b.concurrency]; });
		var maxEnd = (nodeGroupStats && nodeGroupStats.maxServerEndDelta) || undefined;
		var xMax = typeof maxEnd === "number" && !Number.isNaN(maxEnd) ? maxEnd + 100 : undefined;
		return {
			title: { text: "Δms → Concurrency" },
			animation: false,
			tooltip: { trigger: "axis" },
			xAxis: { type: "value", name: "Δms", min: 0, max: xMax },
			yAxis: { type: "value", name: "concurrency", min: 0, minInterval: 1 },
			series: [
				{ type: "line", showSymbol: true, symbolSize: 4, data: data }
			],
		};
	}

	function buildWaterfallOptions(nodes) {
		var valid = nodes.filter(function (n) {
			return typeof n.state.jsStartEpochMs === "number"
				&& typeof n.state.djangoStartDeltaMs === "number"
				&& typeof n.state.djangoElapsedMs === "number";
		});
		if (valid.length === 0) {
			return { title: { text: "Django Server Intervals (Waterfall)" } };
		}
		var globalStart = Math.min.apply(null, valid.map(function (n) { return n.state.jsStartEpochMs; }));
		var intervals = valid.map(function (n, i) {
			var start = n.state.jsStartEpochMs + n.state.djangoStartDeltaMs;
			var end = start + n.state.djangoElapsedMs;
			return {
				index: n.index,
				label: n.state.frontendId || ("req-" + (n.index + 1)),
				startDelta: Number((start - globalStart).toFixed(4)),
				endDelta: Number((end - globalStart).toFixed(4)),
			};
		});
		var labels = intervals.map(function (iv) { return iv.label; });
		var seriesData = intervals.map(function (iv) { return [iv.startDelta, iv.endDelta, iv.index]; });
		var palette = [
			"red", "green", "blue", "orange", "purple",
			"teal", "olive", "maroon", "navy", "lime",
			"aqua", "fuchsia", "silver", "gray", "black",
			"brown", "coral", "darkgoldenrod", "darkcyan", "indigo",
		];

		return {
			title: { text: "Django Server Intervals (Waterfall)" },
			animation: false,
			axisPointer: {
				show: true,
				type: "line",
				label: {
					show: true,
					formatter: (function () {
						var ints = intervals;
						return function (params) {
							var x = params && typeof params.value === "number" ? params.value : undefined;
							if (typeof x !== "number" || Number.isNaN(x)) return "";
							var act = ints.filter(function (iv) { return iv.startDelta <= x && x <= iv.endDelta; });
							return "Δ" + Math.round(x) + " ms — C=" + act.length;
						};
					})()
				}
			},
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "line" },
				formatter: (function () {
					var ints = intervals;
					return function (params) {
						var p = Array.isArray(params) ? params[0] : params;
						var x = p && (p.axisValue != null ? Number(p.axisValue) : undefined);
						if (typeof x !== "number" || Number.isNaN(x)) return "";
						var act = ints.filter(function (iv) { return iv.startDelta <= x && x <= iv.endDelta; });
						var head = "Δ" + Math.round(x) + " ms — active: " + act.length;
						if (act.length === 0) return head;
						var list = act.slice(0, 10).map(function (iv) { return iv.label; }).join(", ");
						var more = act.length > 10 ? " …" : "";
						return head + "<br/>" + list + more;
					};
				})()
			},
			grid: { top: 50, right: 20, bottom: 20, left: 120 },
			xAxis: { type: "value", name: "Δms" },
			yAxis: { type: "category", data: labels, inverse: true },
			series: [{
				type: "custom",
				renderItem: function (params, api) {
					var start = api.value(0);
					var end = api.value(1);
					var idx = api.value(2);
					var startCoord = api.coord([start, idx]);
					var endCoord = api.coord([end, idx]);
					var height = 8;
					return {
						type: "rect",
						shape: {
							x: startCoord[0],
							y: startCoord[1] - height / 2,
							width: Math.max(1, endCoord[0] - startCoord[0]),
							height: height,
						},
						style: {
							fill: palette[idx % palette.length],
							opacity: 0.9,
						},
						emphasis: { style: { opacity: 1 } },
					};
				},
				encode: { x: [0, 1], y: 2 },
				data: seriesData,
			}]
		};
	}

	global.FTCharts = {
		registerCharts: registerCharts,
		options: {
			buildPidCountBarOptions: buildPidCountBarOptions,
			buildTidCountBarOptions: buildTidCountBarOptions,
			buildIndexToValueScatterOptions: buildIndexToValueScatterOptions,
			buildIndexToOverallRequestTimeOptions: buildIndexToOverallRequestTimeOptions,
			buildConcurrencyLineOptions: buildConcurrencyLineOptions,
			buildWaterfallOptions: buildWaterfallOptions,
		},
	};
})(typeof window !== "undefined" ? window : this);

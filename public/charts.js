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

	global.FTCharts = {
		registerCharts: registerCharts,
	};
})(typeof window !== "undefined" ? window : this);

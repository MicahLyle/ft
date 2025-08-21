import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const App = {
	setup() {
		const message = ref('Hello World');
		const count = ref(0);
		const increment = () => {
			count.value += 1;
		};
		const decrement = () => {
			count.value -= 1;
		};
		return { message, count, increment, decrement };
	},
	template: `
		<div>
			<h1>{{ message }}</h1>
			<p>Count: {{ count }}</p>
			<button @click="decrement">-</button>
			<button @click="increment">+</button>
		</div>
	`,
};

createApp(App).mount('#app');



<template>
	<div class="app">
		<nav class="navbar navbar-light bg-light">
			<span class="navbar-brand">
				<span class="text-blue">json</span>
				<span class="text-orange">FM</span>
			</span>
			<span class="navbar-text">
				<a href="https://github.com/demianh/json-fm">GitHub</a>
			</span>
		</nav>
		<div class="container-fluid">
			<MainTable></MainTable>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainTable from "@/components/MainTable.vue";

@Component({
	components: {
		MainTable,
	},
})
export default class App extends Vue {}
</script>

<style lang="scss">
	body .app {
		font-family: 'Work Sans', sans-serif;
	}

	// Global Styles

	.text-blue {
		color: $blue-dark;
	}

	.text-orange {
		color: $orange-dark;
	}

	.app {
		input.form-control::-webkit-input-placeholder {
			color: #ddd;
		}

		a {
			color: $blue-light;
			cursor: pointer;
		}
		a:hover {
			color: $blue-dark;
		}

		h1, h2, h3, h4, h5 {
			font-weight: 700 !important;
		}

		h4 {
			color: $blue-dark;
			font-size: 1.1rem;
		}

		.table th,
		.table td,
		.table input {
			font-size: 13px;
		}

		.navbar-brand {
			font-family: 'Calistoga', cursive;
		}
	}
</style>

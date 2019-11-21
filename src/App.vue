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
	// Global Styles
	input.form-control::-webkit-input-placeholder {
		color: #ddd;
	}

	.text-blue {
		color: $blue-dark;
	}

	.text-orange {
		color: $orange-dark;
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

	.app {
		a {
			color: $blue-light;
			cursor: pointer;
		}
		a:hover {
			color: $blue-dark;
		}
	}
</style>

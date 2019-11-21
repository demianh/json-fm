<template>
	<div class="main-table mt-3">
		<h4>
			Your JSON Data
			<a @click="showJson = !showJson" tabindex="-1" style="font-size: 14px">Show Input Data</a>
		</h4>
		<div class="mb-2" v-if="showJson">
			<textarea v-model="input" style="width: 100%; height: 200px" class="form-control"></textarea>
		</div>
		<h4>Sheet ({{sheet.length}} rows)</h4>
		<div v-if="sheet">
			<table class="table table-sm">
				<tr>
					<th v-for="(col, $index) in cols" class="col-config">
						<vue-simple-suggest
							v-model="col.property"
							:min-length="0"
							:list="propertySuggestions"
							:max-suggestions="1000"
							:filter-by-query="true"
							value-attribute="id"
							display-attribute="id"
						>
						</vue-simple-suggest>
						<input type="text" v-model="col.filter" class="form-control mt-1" :class="{'is-invalid': filterErrors[$index]}" placeholder="filter expression" :disabled="!schema[col.property]">
						<div class="invalid-feedback">{{filterErrors[$index]}}</div>
						<label class="form-check">
							<input class="form-check-input" type="checkbox" v-model="col.group" :disabled="!schema[col.property]">
							<span class="form-check-label">Group</span>
						</label>
						<label class="form-check" v-if="schema[col.property] && (schema[col.property].array || schema[col.property].object)">
							<input class="form-check-input" type="checkbox" v-model="col.expand">
							<span class="form-check-label">Expand</span>
						</label>
					</th>
					<th v-if="hasGroupCols" class="col-config">COUNT</th>
					<th class="col-config" style="width: 50px">
						<button class="btn btn-success" @click="addCol">+</button>
					</th>
				</tr>
				<tr>
					<th v-for="(col, $index) in cols" class="col-sort">
						<a @click="setSort($index)" :class="{'font-weight-bold': sortBy[0][0] === $index}" tabindex="-1">sort</a>
					</th>
					<th v-if="hasGroupCols" class="col-sort">
						<a @click="setSort(cols.length)" :class="{'font-weight-bold': sortBy[0][0] === cols.length}" tabindex="-1">sort</a>
					</th>
					<th class="col-sort"></th>
				</tr>
				<tr v-for="row in sheet">
					<td v-for="cell in row">
						<span v-if="cell === null" class="text-muted">
							null
						</span>
						<span v-else>
							{{cell}}
						</span>
					</td>
					<td></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
// @ts-ignore
import VueSimpleSuggest from 'vue-simple-suggest'
let objectHash = require('object-hash');

//import * as exampleData from '../../examples/small.json';
//import * as exampleData from '../../examples/songs.json';
import * as exampleData from '../../examples/nested.json';
import SchemaAnalyzer from "@/helpers/SchemaAnalyzer";

interface ColConfig {
	property?: string;
	filter?: string;
	group: boolean;
	expand: boolean;
}

@Component({
	components: {VueSimpleSuggest}
})
export default class MainTable extends Vue {

	showJson: boolean = true;

	cols: ColConfig[] = [
		{
			property: 'name',
			group: false,
			expand: false,
		},
		{
			property: 'props.color',
			group: false,
			expand: false,
		},
		{
			property: 'actions',
			group: false,
			expand: true,
		},
		{
			property: 'props',
			group: false,
			expand: false,
		}
	];

	filterErrors = {};

	sortBy: [number, 'asc'|'desc'][] = [[0,'asc']];

	input: string = '[]';

	mounted() {
		// load example data
		// @ts-ignore
		this.input = JSON.stringify(exampleData.default);
	}

	get parsedInput(): any[] {
		let parsed: any = JSON.parse(this.input);
		if (Array.isArray(parsed)) {
			return parsed;
		} else {
			if (typeof parsed === 'object') {
				return [parsed];
			} else {
				return [];
			}
		}
	}

	get schema(): {[prop: string]: any } {
		let analyzer = new SchemaAnalyzer(this.parsedInput);
		return analyzer.getSchema();
	}

	get propertySuggestions() {
		return Object.keys(this.schema).map((key) => {
			return {id: key, title: key + ' (' + Object.keys(this.schema[key]).join(', ') + ')'}
		});
	}

	get hasGroupCols(): boolean {
		return this.cols.some(col => col.group && col.property && this.schema[col.property]);
	}

	get hasFilters(): boolean {
		return this.cols.some(col => col.filter);
	}

	get rawSheet(): any[] {
		let rows: any[] = [];
		this.filterErrors = {};

		// collect raw rows
		this.parsedInput.forEach(entry => {
			rows.push(this.getRawRow(entry));
		});
		return rows;
	}

	get expandedSheet() {
		let rows = this.rawSheet;
		this.cols.forEach((col, index) => {
			if (col.expand) {
				let expanded: any[] = [];
				rows.forEach(row => {
					expanded = expanded.concat(this.explodeRow(row, index))
				});
				rows = expanded;
			}
		});
		return rows;
	}

	get filteredSheet() {
		let rows = this.expandedSheet;
		if (this.hasFilters) {
			try {
				rows = rows.filter(row => {
					return this.cols.every((col, index) => {
						if (col.filter && col.filter.length > 0) {
							return this.evaluateFilter.call({}, col.filter, row[index], row, index);
						}
						return true;
					});
				});
			} catch (e) {
				return [];
			}
		}
		return rows;
	}

	get groupedSheet() {
		let rows = this.filteredSheet;
		if (this.hasGroupCols) {
			let hashes = new Map();
			let groupRows: any[] = [];
			let groupCols: number[] = [];
			this.cols.forEach((col, index) => {
				if (col.group && col.property && this.schema[col.property]) {
					groupCols.push(index);
				}
			});
			rows.forEach((row) => {
				let hashObj: any[] = [];
				groupCols.forEach(groupCol => {
					hashObj.push(row[groupCol])
				});
				//let hash = objectHash(hashObj);
				let hash = this.hash(hashObj);
				if (hashes.has(hash)) {
					hashes.set(hash, hashes.get(hash) + 1);
				} else {
					groupRows.push(row);
					hashes.set(hash, 1);
				}
			});

			// add count
			groupRows.forEach((row) => {
				let hashObj: any[] = [];
				groupCols.forEach(groupCol => {
					hashObj.push(row[groupCol])
				});
				let hash = this.hash(hashObj);
				row.push(hashes.get(hash));
			});

			rows = groupRows;
		}
		return rows;
	}

	get sortedSheet() {
		// sort
		return this.groupedSheet.sort((a, b) => {
			let sortIndex = this.sortBy[0][0];
			let sortOrder = this.sortBy[0][1];
			let ca = a[sortIndex];
			let cb = b[sortIndex];
			if (!isNaN(ca) && !isNaN(cb)) {
				// sort numbers
				if (sortOrder === 'asc') {
					return parseFloat(ca) - parseFloat(cb);
				} else {
					return parseFloat(cb) - parseFloat(ca);
				}
			} else {
				// sort strings
				if (sortOrder === 'asc') {
					return ('' + ca).localeCompare(cb);
				} else {
					return ('' + cb).localeCompare(ca);
				}
			}
		});
	}

	get sheet() {
		return this.sortedSheet;
	}

	private hash(obj: any) {
		return JSON.stringify(obj);
	}

	public evaluateFilter(filter: string, value: any, row: any[], index: number): boolean {
		try {
			return !!eval(filter);
		} catch (e) {
			let message = e.message || 'Syntax Error';
			this.$set(this.filterErrors, index, message);
			throw e;
		}
	}

	public explodeRow(row: any, index: number): any[] {
		let rows: any[] = [];
		if (Array.isArray(row[index])) {
			row[index].forEach((value: any) => {
				let newRow = row.slice();
				newRow[index] = value;
				rows.push(newRow);
			})
		} else if (typeof row[index] === 'object') {
			Object.keys(row[index]).forEach((key: any) => {
				let newRow = row.slice();
				newRow[index] = key + ': ' + row[index][key];
				rows.push(newRow);
			})
		} else {
			rows = [row.slice()];
		}
		return rows;
	}

	public getRawRow(entry: any) {
		let row: any[] = [];
		this.cols.forEach(col => {
			let cellValue = '';
			if (col && col.property) {
				let parts = col.property.split('.');
				let val = entry;
				parts.forEach((part) => {
					if (val !== null) {
						if (val && part in val) {
							val = val[part];
						} else {
							val = null;
						}
					}
				});
				if (val !== null) {
					cellValue = val;
				}
			}
			row.push(cellValue)
		});
		return row;
	}

	public addCol() {
		this.cols.push({
			group: false,
			expand: false
		})
	}

	public setSort(index: number) {
		if (this.sortBy[0][0] === index) {
			if (this.sortBy[0][1] == 'asc') {
				this.$set(this.sortBy[0], 1, 'desc')
			} else {
				this.sortBy[0][1] = 'asc';
				this.$set(this.sortBy[0], 1, 'asc')
			}
		} else {
			this.sortBy[0] = [index, 'asc'];
			this.$set(this.sortBy, 0, [index, 'asc'])
		}
	}
}
</script>

<style scoped lang="scss">
.col-config {
	background: #dee2e6;
	font-weight: normal;
}
.col-sort {
	background: #f1f2f3;
	font-weight: normal;

	a {
		cursor: pointer;
	}
}
</style>

<template>
	<div class="main-table mt-3">
		<h4 @click="showJson = !showJson">JSON</h4>
		<div class="mb-2" v-if="showJson">
			<textarea v-model="input" style="width: 100%; height: 80px" class="form-control"></textarea>
		</div>
		<h4>Sheet ({{sheet.length}} rows)</h4>
		<div v-if="sheet">
			<table class="table table-sm">
				<tr>
					<th v-for="(col, $index) in cols" class="col-config">
						<input type="text" v-model="col.property" class="form-control mb-1" placeholder="property">
						<input type="text" v-model="col.explode" class="form-control mb-1" placeholder="explode">
						<input type="text" v-model="col.filter" class="form-control" :class="{'is-invalid': filterErrors[$index]}" placeholder="filter expression">
						<div class="invalid-feedback">{{filterErrors[$index]}}</div>
						<label class="form-check">
							<input class="form-check-input" type="checkbox" v-model="col.group">
							<span class="form-check-label">Group</span>
						</label>
					</th>
					<th v-if="hasGroupCols" class="col-config"></th>
					<th class="col-config" style="width: 50px">
						<button class="btn btn-success" @click="addCol">+</button>
					</th>
				</tr>
				<tr>
					<th v-for="(col, $index) in cols" class="col-sort">
						<a @click="setSort($index)" :class="{'text-muted': sortBy[0][0] !== $index}">sort</a>
					</th>
					<th v-if="hasGroupCols" class="col-sort">
						<a @click="setSort(cols.length)" :class="{'text-muted': sortBy[0][0] !== cols.length}">sort</a>
					</th>
					<th class="col-sort"></th>
				</tr>
				<tr v-for="row in sheet">
					<td v-for="cell in row">
						{{cell}}
					</td>
					<td></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
let objectHash = require('object-hash');

import * as exampleData from '../../examples/small.json';
//import * as exampleData from '../../examples/songs.json';

interface ColConfig {
	property?: string;
	explode?: string;
	filter?: string;
	group: boolean;
}

@Component
export default class MainTable extends Vue {
	@Prop() private msg!: string;

	showJson: boolean = false;

	cols: ColConfig[] = [
		{
			property: 'title',
			group: false,
		},
		{
			property: 'pageRondoBlue',
			group: false,
		},
		{
			explode: 'author',
			group: false,
		},
		{
			explode: 'chords',
			group: false,
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

	get hasGroupCols(): boolean {
		return this.cols.some(col => col.group);
	}

	get hasFilters(): boolean {
		return this.cols.some(col => col.filter);
	}

	get sheet(): any[] {
		let rows: any[] = [];
		this.filterErrors = {};

		// collect raw rows
		this.parsedInput.forEach(entry => {
			rows.push(this.getRawRow(entry));
		});

		// explode
		this.cols.forEach((col, index) => {
			if (col.explode) {
				let exploded: any[] = [];
				rows.forEach(row => {
					exploded = exploded.concat(this.explodeRow(row, index))
				});
				rows = exploded;
			}
		});

		// filter
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

		// group
		if (this.hasGroupCols) {
			let hashes = new Map();
			let groupRows: any[] = [];
			let groupCols: number[] = [];
			this.cols.forEach((col, index) => {
				if (col.group) {
					groupCols.push(index);
				}
			});
			rows.forEach((row) => {
				let hashObj: any[] = [];
				groupCols.forEach(groupCol => {
					hashObj.push(row[groupCol])
				});
				let hash = objectHash(hashObj);
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
				let hash = objectHash(hashObj);
				row.push(hashes.get(hash));
			});

			rows = groupRows;
		}


		// sort
		rows = rows.sort((a, b) => {
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

		return rows;
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
			Object.keys(row[index]).forEach((key: any, index: any) => {
				let newRow = row.slice();
				newRow[index] = key + ': ' + row[index][key];
				rows.push(newRow);
			})
		} else {
			rows = [row];
		}
		return rows;
	}

	public getRawRow(entry: any) {
		let row: any[] = [];
		this.cols.forEach(col => {
			let cellValue = '';
			if (col && col.property) {
				if (entry && col.property in entry) {
					cellValue = entry[col.property];
				}
			}
			if (col && col.explode) {
				if (entry && col.explode in entry) {
					cellValue = entry[col.explode];
				}
			}
			row.push(cellValue)
		});
		return row;
	}

	public addCol() {
		this.cols.push({
			group: false
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

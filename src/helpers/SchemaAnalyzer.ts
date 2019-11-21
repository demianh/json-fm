import {Vue} from "vue-property-decorator";

export default class SchemaAnalyzer {

	private readonly json: any[] = [];

	constructor(json: any[]) {
		this.json = json;
	}

	public getSchema(): {[prop: string]: any } {
		let schema: any = {};
		this.analyzeArray(schema, this.json);
		console.log(schema);
		return schema;
	}

	private analyzeArray(schema: any, node: any[], prefix: string|null = null) {
		node.forEach(row => {
			Object.keys(row).forEach((key: string) => {
				let prefixedKey: string = key;
				if (prefix) {
					prefixedKey = prefix + '.' + key;
				}

				let type: string = this.getType(row[key]);
				this.increaseTypeCount(schema, key, type);
				if (type === 'object') {
					this.analyzeObject(schema, row[key], prefixedKey);
				}
			});
		});
	}

	private analyzeObject(schema: any, node: any, prefix: string|null = null) {
		if (node !== null && typeof node === 'object') {
			Object.keys(node).forEach((key) => {
				let prefixedKey: string = key;
				if (prefix) {
					prefixedKey = prefix + '.' + key;
				}

				let type: string = this.getType(node[key]);
				this.increaseTypeCount(schema, prefixedKey, type);

				// child object types
				if (type === 'object') {
					this.analyzeObject(schema, node[key], prefixedKey);
				}
			});
		}
	}

	private getType(value: any): string {
		if (value === null) {
			return 'null';
		}
		let type: string = typeof value;
		if (Array.isArray(value)) {
			type = 'array';
		}
		return type;
	}

	private increaseTypeCount(schema: any, key: string, type: string): void {
		if (!(key in schema)) {
			Vue.set(schema, key, {})
		}
		if (!(type in schema[key])) {
			Vue.set(schema[key], type, 1);
		} else {
			schema[key][type]++;
		}
	}
}

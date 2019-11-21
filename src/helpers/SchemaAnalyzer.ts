import {Vue} from "vue-property-decorator";

export default class SchemaAnalyzer {

	private readonly json: any[] = [];

	constructor(json: any[]) {
		this.json = json;
	}

	public getSchema(): {[prop: string]: any } {
		let schema: any = {};
		this.analyzeArray(schema, this.json);
		return schema;
	}

	private analyzeArray(schema: any, node: any[], prefix: string = '') {
		node.forEach(row => {
			if (Array.isArray(row)) {
				this.analyzeArray(schema, row, prefix + '.0');
			} else if (node !== null && typeof node === 'object') {
				this.analyzeObject(schema, row, prefix);
			}
		});
	}

	private analyzeObject(schema: any, node: any, prefix: string) {
		if (node !== null && typeof node === 'object') {
			Object.keys(node).forEach((key) => {
				this.analyzeProperty(schema, key, node[key], prefix);
			});
		}
	}

	private analyzeProperty(schema: any, key: string, value: any, prefix: string) {
		let prefixedKey: string = key;
		if (prefix) {
			prefixedKey = prefix + '.' + key;
		}

		let type: string = this.getType(value);
		this.increaseTypeCount(schema, prefixedKey, type);

		// child object types
		if (type === 'object') {
			this.analyzeObject(schema, value, prefixedKey);
		}
		if (type === 'array') {
			this.analyzeArray(schema, value, prefixedKey + '.0');
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

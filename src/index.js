import { pool } from "./connection";
import Model from "./model";
import schema from "./schema";

export default class CRUDe {
	constructor(dbDetails = null, debug = false) {
		this.conn = pool(dbDetails);
		this.client = null;
		this.debug = debug;
	}

	connect(dbDetails) {
		this.conn = pool(dbDetails);
	}

	async end() {
		await this.conn.end();
	}

	execute(params) {
		return this.conn.connect(params);
	}

	async createSchema(table, columns) {
		return await schema(table, columns, this);
	}

	async createModel(modelName, tableName) {
		const crude = this;

		if (typeof tableName === "string" && typeof modelName === "string") {
			const modelClass = class extends Model {
				constructor(fields) {
					super(tableName, crude);

					return this.insert(fields);
				}

				static get table() {
					return tableName;
				}

				static get conn() {
					return crude.conn;
				}

				static get debug() {
					return crude.debug;
				}
			};

			Object.defineProperty(modelClass, "name", { value: modelName });

			return modelClass;
		}

		return null;
	}
}

import { pool } from "./connection";
import Model from "./model";
import schema from "./schema";

export default class CRUDe {
	constructor(dbDetails = null) {
		this.conn = pool(dbDetails);
		this.client = null;
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

	async query(params) {
		return await this.conn.query(params);
	}

	async createSchema(table, columns) {
		return await schema(table, columns, this.conn);
	}

	async createModel(modelName, tableName) {
		const crude = this;

		if (typeof tableName === "string" && typeof modelName === "string") {
			const modelClass = class extends Model {
				constructor(fields) {
					super(tableName, crude);

					if (fields) {
						return this.insert(fields);
					}
				}

				static get table() {
					return tableName;
				}

				static get conn() {
					return crude;
				}
			};

			Object.defineProperty(modelClass, "name", { value: modelName });

			return modelClass;
		}

		return null;
	}
}

import { pool } from "./connection";
import Schema from "./schema";
import Model from "./model";

export default class CRUDe {
	constructor(dbDetails = null) {
		this.conn = pool(dbDetails);
		this.client = null;
	}

	connect(dbDetails) {
		this.conn = pool(dbDetails);
	};

	async end() {
		await this.conn.end();
	}

	execute(params) {
		return this.conn.connect(params);
	};

	async query(params) {
		return await this.conn.query(params);
	};

	createSchema(table, columns) {
		return new Schema(table, columns, this);
	};

	createModel(modelName, schema) {
		const crude = this;

		if (schema instanceof Schema && modelName) {
			const modelClass = class extends Model {
				constructor(fields = null) {
					super(schema.table, crude);

					if (fields) {
						this.insert(fields);
					}
				}
			};

			Object.defineProperty (modelClass, 'name', { value: modelName });

			return modelClass;
		}

		return null;
	};
};

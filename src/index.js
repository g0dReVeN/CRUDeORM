import { pool } from "./connection";
import customModel from "./customModel";
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

	execute(params) {
		return this.conn.connect(params);
	}

	async end() {
		await this.conn.end();
	}

	async createSchema(table, columns, constraints = null) {
		return await schema(table, columns, constraints, this);
	}

	createModel(modelName, tableName) {
		return customModel(tableName, modelName, this)
	}
}

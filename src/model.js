import { flatten } from "flat";
import Record from "./record";
import operatorEnum from "./enums/operatorEnum";

export default class Model {
	constructor(table, conn) {
		this.table = table;
		this.conn = conn;
	}

	static whereBuilder(fields) {
		let i = 0;

		return Object.entries(fields).reduce((acc, curr) => {
			if (++i > 1) acc += " AND ";

			if (typeof curr[1] === "object") {
				return (acc += Object.entries(curr[1]).reduce((acc2, curr2, j) => {
					if (j > 0) acc2 += " AND ";

					return (acc2 += `${curr[0]} ${operatorEnum[curr2[0]]} $${(i += j)}`);
				}, ""));
			} else return (acc += `${curr[0]} ${operatorEnum["$eq"]} $${i}`);
		}, "");
	}

	async insert(fields) {
		try {
			const keys = Object.keys(fields);

			if (keys.length < 1) {
				throw "Insert parameters less than 1";
			}

			const query = {
				text: `INSERT INTO ${this.table}(${keys.join(",")})
						VALUES(${keys.reduce((acc, key, i) => {
							if (i > 0) { acc += `, $${i + 1}`; }
							return acc;
						}, '$1')})
						RETURNING *`,
				values: Object.values(fields),
			};

			// return this.conn
			// 	.query(query)
			// 	.then((res) => {
			// 		return new Record(this.table, res.rows[0], this.conn);
			// 	})
			// 	.catch((error) => console.error(error.stack));
			const res = await this.conn.query(query);
			return new Record(this.table, res.rows[0], this.conn);
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async destroy(fields, constraints = "") {
		try {
			const keys = Object.keys(fields);

			if (keys.length < 1) {
				throw "Find parameters less than 1";
			}

			const query = {
				text: `DELETE FROM ${this.table} WHERE ${this.whereBuilder(
					fields
				)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			return this.conn
				.query(query)
				.then((res) => console.log("Data deleted successfully"))
				.catch((error) => console.error(error.stack));
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async find(fields, constraints = "", singleRecord = false) {
		try {
			const keys = Object.keys(fields);

			if (keys.length < 1) {
				throw "Find parameters less than 1";
			}

			const query = {
				text: `SELECT * FROM ${this.table} WHERE ${this.whereBuilder(
					fields
				)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			return this.conn
				.query(query)
				.then((res) => {
					if (singleRecord && res.rows.length) {
						return new Record(this.table, res.rows[0], this.conn);
					} else if (res.rows.length) {
						return res.rows.reduce((acc, curr) => {
							return acc.push(new Record(this.table, curr, this.conn));
						}, []);
					} else {
						return null;
					}
				})
				.catch((error) => console.error(error.stack));
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async findOne(fields, constraints = "") {
		return this.find(fields, constraints + " LIMIT 1", true);
	}

	static async findById(fields, constraints = "") {
		return this.find({ id: fields }, constraints + " LIMIT 1", true);
	}

	static async destroyById(fields, constraints = "") {
		return this.destroy({ id: fields }, constraints);
	}
}

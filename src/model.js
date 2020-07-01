import { flatten } from "flat";
import Record from "./record";
import operatorEnum from "./enums/operatorEnum";

export default class Model {
	constructor(table, conn) {
		this.table = table;
		this.conn = conn;
	}

	reduceRef(count) {
		let ref = "";

		for (let i = 2; i <= count; i++) {
			ref += `, $${i}`;
		}

		return ref;
	}

	whereBuilder(fields) {
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
                        VALUES($1${this.reduceRef(keys.length)})`,
				values: Object.values(fields),
			};

			return this.conn
				.query(query)
				.then((res) => {
					if (res.rows.length) {
						return new Record(this.table, res.rows[0], this.conn);
					} else {
						return null;
					}
				})
				.catch((error) => console.error(error.stack));
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
				text: `DELETE FROM ${this.table} WHERE ${this.whereBuilder(fields)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			return this.conn
				.query(query)
				.then((res) => {
					return res;
				})
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
				text: `SELECT * FROM ${this.table} WHERE ${this.whereBuilder(fields)} ${constraints}`,
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
}

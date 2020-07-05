import { flatten } from "flat";
import Record from "./record";
import operatorEnum from "./enums/operatorEnum";

export default class Model {
	constructor(table, crude) {
		this.table = table;
		this.conn = crude.conn;
		this.debug = crude.debug;
	}

	static referenceBuilder(fields, index = { i: 0 }, concatentor = " AND ") {
		const startPos = index.i;

		return Object.entries(fields).reduce((acc, curr) => {
			if (++index.i > startPos + 1) acc += concatentor;

			if (typeof curr[1] === "object" && curr[1].constructor.name === 'Object') {
				return (acc += Object.entries(curr[1]).reduce((acc2, curr2, j) => {
					if (j > 0) acc2 += concatentor;

					return (acc2 += `${curr[0]} ${
						operatorEnum[curr2[0]]
					} $${(index.i += j)}`);
				}, ""));
			} else return (acc += `${curr[0]} ${operatorEnum["$eq"]} $${index.i}`);
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
							if (i > 0) {
								acc += `, $${i + 1}`;
							}
							return acc;
						}, "$1")})
						RETURNING *`,
				values: Object.values(fields),
			};

			const res = await this.conn.query(query);

			if (this.debug) console.log("Data inserted successfully");

			return new Record(this.table, res.rows[0], this.conn);
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async find(fields, constraints = "", singleRecord = false) {
		try {
			if (Object.keys(fields).length < 1) {
				throw "Find parameters less than 1";
			}

			const query = {
				text: `SELECT * FROM ${this.table} WHERE ${this.referenceBuilder(
					fields
				)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			const res = await this.conn.query(query);

			if (res.rows.length) {
				if (this.debug) console.log("Data found successfully");

				if (singleRecord) {
					return new Record(this.table, res.rows[0], this.conn);
				} else {
					return res.rows.reduce((acc, curr) => {
						return acc.push(new Record(this.table, curr, this.conn));
					}, []);
				}
			} else {
				return null;
			}
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async update(updateFields, selectFields = null, constraints = "") {
		try {
			const updateValues = Object.values(updateFields);

			if (updateValues.length < 1) {
				throw "Update parameters less than 1";
			} else if (updateFields.hasOwnProperty("id")) {
				throw "id field found in update fields";
			}

			let selectValues = null;

			if (selectFields !== null) {
				selectValues = Object.values(selectFields);

				if (selectValues.length < 1) {
					throw "Select parameters less than 1";
				}
			}

			const i = {
				i: 0,
			};

			const query = {
				text: `UPDATE ${this.table}
                        SET ${this.referenceBuilder(updateFields, i, ", ")}
                        ${
													selectValues
														? "WHERE " + this.referenceBuilder(selectFields, i)
														: ""
												} ${constraints}`,
				values: selectValues ? updateValues.concat(selectValues) : updateValues,
			};

			await this.conn.query(query);

			if (this.debug) console.log("Data updated successfully");
		} catch (error) {
			console.error(error.stack);
		}
	}

	static async destroy(fields, constraints = "") {
		try {
			if (Object.keys(fields).length < 1) {
				throw "Find parameters less than 1";
			}

			const query = {
				text: `DELETE FROM ${this.table} WHERE ${this.referenceBuilder(
					fields
				)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			await this.conn.query(query);

			if (this.debug) console.log("Data deleted successfully");
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

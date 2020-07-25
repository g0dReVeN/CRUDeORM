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

		return Object.entries(fields).reduce((ref, [key, value]) => {
			if (++index.i > startPos + 1) ref += concatentor;

			if (value.constructor.name === "Object") {
				return (ref += Object.entries(value).reduce(
					(childRef, [childKey, childValue], j) => {
						if (j > 0) childRef += concatentor;

						return (childRef += `${key} ${
							operatorEnum[childKey]
						} $${(index.i += j)}`);
					},
					""
				));
			} else return (ref += `${key} ${operatorEnum["$eq"]} $${index.i}`);
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

	static async find(
		fields,
		constraints = "",
		andQuery = true,
		singleRecord = false
	) {
		try {
			if (Object.keys(fields).length < 1) {
				throw "Find parameters less than 1";
			}

			const query = {
				text: `SELECT * FROM ${this.table} WHERE ${this.referenceBuilder(
					fields,
					{ i: 0 },
					andQuery ? " AND " : " OR "
				)} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			const res = await this.conn.query(query);

			if (res.rows.length) {
				if (this.debug) console.log("Data found successfully");

				if (singleRecord) {
					return new Record(this.table, res.rows[0], this.conn);
				} else {
					return res.rows.reduce((acc, value) => {
						return [new Record(this.table, value, this.conn), ...acc];
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

	static async findOne(fields, constraints = "", andQuery = true) {
		return this.find(fields, constraints + " LIMIT 1", andQuery, true);
	}

	static async findById(fields, constraints = "", andQuery = true) {
		return this.find({ id: fields }, constraints + " LIMIT 1", andQuery, true);
	}

	static async destroyById(fields, constraints = "") {
		return this.destroy({ id: fields }, constraints);
	}

	async with(joinTable, whereFields = null, innerId = null, outerId = null) {
		try {
			const inner = innerId ? innerId : `${this.table}.${joinTable}_id`;
			const outer = outerId ? outerId : `${joinTable}.id`;
			const where = whereFields
				? `WHERE ${this.referenceBuilder(whereFields)}`
				: ``;

			const query = whereFields
				? {
						text: `SELECT * FROM ${this.table} INNER JOIN ${joinTable} ON ${inner} = ${outer} ${where}`,
						values: Object.values(flatten(whereFields)),
				  }
				: `SELECT * FROM ${this.table} INNER JOIN ${joinTable} ON ${inner} = ${outer}`;

			const res = await this.conn.query(query);

			if (this.debug) console.log("Data loaded successfully");

			if (res.rows.length) {
				return res.rows.reduce((acc, value) => {
					const record = new Record(
						`${this.table}_${joinTable}`,
						value,
						this.conn
					);
					record.__loadable = false;
					return [record, ...acc];
				}, []);
			} else {
				return null;
			}
		} catch (error) {
			console.error(error.stack);
		}
	}
}

export default class Record {
	constructor(table, fields, crude) {
		this.__table = table;
		this.__conn = crude.conn;
		this.__debug = crude.debug;
		this.__savable = true;
		this.__attributeList = Object.keys(fields);
		this.__attributeListSize = this.__attributeList.length;

		this.__attributeList.forEach((key) => {
			this[key] = fields[key];
		});
	}

	toArray() {
		return this.__attributeList.reduce((acc, key) => {
			return [...acc, this[key]];
		}, []);
	}

	toJSON() {
		return this.__attributeList.reduce((acc, key) => {
			return {
				...acc,
				key: this[key],
			};
		}, {});
	}

	async save() {
		try {
			if (!this.__savable)
				throw "This instance can longer be saved. Initialise new instance.";

			let i = 0;

			const query = {
				text: `UPDATE ${this.__table}
                        SET ${this.__attributeList.reduce((acc, attribute) => {
													if (attribute === "id") return acc;
													if (acc === "") return `${attribute} = $${(i += 1)}`;
													return `${acc}, ${attribute} = $${(i += 1)}`;
												}, "")}
                        WHERE id = $${this.__attributeListSize}`,
				values: this.__attributeList
					.filter((attribute) => {
						return attribute !== "id";
					})
					.push(Number(this.id)),
			};

			await this.__conn.query(query);

			if (this.__debug) console.log("Data saved successfully");
		} catch (error) {
			console.error(error.stack);
		}
	}

	async with(joinTable, innerId = null, outerId = null) {
		try {
			const inner = innerId ? innerId : `${this.__table}.${joinTable}_id`;
			const outer = outerId ? outerId : `${joinTable}.id`;

			const sql = `SELECT * FROM ${this.__table} INNER JOIN ${joinTable} ON ${inner} = ${outer};`;

			const res = await this.__conn.query(sql);

			if (this.__debug) console.log("Data loaded successfully");

			const newKeys = Object.keys(res.row[0]);
			this.__savable = false;
			this.__attributeList = [...this.__attributeList, newKeys];
			this.__attributeListSize = this.__attributeList.length;

			newKeys.forEach((key) => {
				this[key] = res.row[0][key];
			});
		} catch (error) {
			console.error(error.stack);
		}
	}

	async relation(relatedTable, primaryKey = null, foreignKey = null) {
		try {
			const inner = primaryKey ? primaryKey : `id`;
			const outer = foreignKey ? foreignKey : `${this.__table}_id`;

			const sql = `SELECT * FROM ${relatedTable} WHERE ${outer} = ${this[inner]};`;

			const res = await this.__conn.query(sql);

			if (this.__debug) console.log("Relation loaded successfully");

			if (res.rows.length) {
				return res.rows.reduce((acc, value) => {
					return acc.push(new Record(relatedTable, value, this.__conn));
				}, []);
			} else {
				return null;
			}
		} catch (error) {
			console.error(error.stack);
		}
	}
}

import Record from "./record";
import operatorEnum from "./enums/operatorEnum";
import { flatten } from "flat";

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

			this.conn
				.query(query)
				.then((res) => console.log("Data inserted successful")) // return this
				.catch((error) => console.error(error.stack));
		} catch (error) {
			console.error(error.stack);
		}
	}

	async find(fields, constraints = "") {
		try {
			const keys = Object.keys(fields);

			if (keys.length < 1) {
				throw "Find parameters less than 1";
			}

			let i = 0;

			const conditions = Object.entries(fields).reduce((acc, curr) => {
				if (++i > 1) acc += " AND ";

				if (typeof curr[1] === "object") {
					return (acc += Object.entries(curr[1]).reduce((acc2, curr2, j) => {
						if (j > 0) acc2 += " AND ";

						return (acc2 += `${curr[0]} ${operatorEnum[curr2[0]]} $${(i += j)}`);
					}, ""));
				} else return (acc += `${curr[0]} ${operatorEnum["$eq"]} $${i}`);
			}, "");

			const query = {
				text: `SELECT * FROM ${this.table} WHERE ${conditions} ${constraints}`,
				values: Object.values(flatten(fields)),
			};

			return this.conn
				.query(query)
				.then((res) => {
                    if (res.rows.length === 1) {
                        return new Record(this.table, res.rows[0], this.conn);
                    } else if (res.rows.length > 1) {
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

	async findOne(fields) {
		return this.find(fields, "LIMIT 1");
	}

	async findById(fields) {
		return this.find({ id: fields }, "LIMIT 1");
    }
}

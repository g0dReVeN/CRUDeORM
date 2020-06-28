export default class Schema {
	constructor(table, fields, conn) {
		this.table = table;
		this.fields = fields;
		this.conn = conn;

		this.createTable();
	}

	async createTable() {
		try {
			const sql = `
                        CREATE TABLE IF NOT EXISTS ${this.table} (
                        id SERIAL PRIMARY KEY,
                        ${Object.keys(this.fields)
													.map((key) => `${key} ${this.fields[key]}`)
													.join(",")}
                        );`;

			this.conn
				.query(sql)
				.then((res) => console.log("Table is successfully created")) // return this
				.catch((error) => console.error(error.stack));
		} catch (error) {
			console.error(error.stack);
		}
	}
}

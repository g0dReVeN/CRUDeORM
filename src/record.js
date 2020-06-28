export default class Record {
	constructor(table, fields, conn) {
        this.table = table;
		this.fields = Object.keys(fields).reduce((acc, curr) => {
            acc[curr] = fields[curr];
            return acc;
        }, {});
		this.conn = conn;
	}
    
    async save() {
        try {
            const query = {
                text: `UPDATE ${this.table}
                        SET ${Object.keys(this.fields)
                            .map((key) => `${key} = ${this.fields[key]}`)
                            .join(",")}
                        WHERE id = ${this.fields.id}`
            };
    
            this.conn
                .query(query)
                .then((res) => console.log("Data saved successful")) // return this
                .catch((error) => console.error(error.stack));
        } catch (error) {
            console.error(error.stack);
        }
    }
}

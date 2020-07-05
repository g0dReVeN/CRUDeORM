export default class Record {
	constructor(table, fields, crude) {
		this.__table = table;
        this.__conn = crude.conn;
        this.__debug = crude.debug;
		this.__attributeList = Object.keys(fields);
		this.__attributeListSize = this.__attributeList.length;

		this.__attributeList.forEach((key) => {
			this[key] = fields[key];
		});
	}

	async save() {
		try {
			let i = 0;

			const query = {
				text: `UPDATE ${this.__table}
                        SET ${this.__attributeList.reduce((acc, attribute) => {
															if (attribute === "id") return acc;
															if (acc === "")
																return `${attribute} = $${(i += 1)}`;
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
            
            if (this.__debug)
			    console.log("Data saved successfully");
		} catch (error) {
			console.error(error.stack);
		}
	}
}

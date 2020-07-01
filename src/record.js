export default class Record {
	constructor(table, fields, conn) {
        this.__table = table;
        this.__conn = conn;
        this.__attributeList = Object.keys(fields);
        this.__attributeListSize = this.__attributeList.length;

        this.__attributeList.forEach(key => {
            this[key] = fields[key];
        });
	}
    
    async save() {
        try {
            let i = 0;

            const query = {
                text: `UPDATE ${ this.__table }
                        SET ${ this.__attributeList
                            .map((attribute, index) => `${ attribute } = $${ index + 1 }`)
                            .join(",")}
                            ${ this.__attributeList.reduce((acc, attribute) => {
                                if (attribute === 'id')
                                    return acc;
                                if (acc === '')
                                    return `${attribute} = $${ i += 1 }`;
                                return `${acc}, ${attribute} = $${ i += 1 }`
                            }, '')}
                        WHERE id = $${this.__attributeListSize}`,
                values: this.__attributeList.filter(attribute => {
                    return attribute !== 'id';
                }).push(Number(this.id))
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

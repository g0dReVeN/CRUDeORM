export default async function (table, fields, crude) {
    let __constraints = '';

    if (fields.hasOwnProperty('__constraints')) {
        __constraints = fields.__constraints;
        delete fields.__constraints;
    }

	const sql = `
				CREATE TABLE IF NOT EXISTS ${table} (
				id SERIAL PRIMARY KEY,
				${Object.keys(fields)
					.map((key) => `${key} ${fields[key]}`)
					.join(",")}
				);`;

    await crude.conn.query(sql);
    
    if (crude.debug)
        console.log("Table created successfully");
        
	return table;
}

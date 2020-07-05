export default async function (table, fields, conn) {
	const sql = `
				CREATE TABLE IF NOT EXISTS ${table} (
				id SERIAL PRIMARY KEY,
				${Object.keys(fields)
					.map((key) => `${key} ${fields[key]}`)
					.join(",")}
				);`;

	await conn.query(sql);
	console.log("Table created successfully");
	return table;
}

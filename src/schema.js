import matchOptions from "./enums/matchOptionsEnum";
import onUDOptions from "./enums/onUDOptionsEnum";
import typeOptions from "./enums/typeOptionsEnum";

export default async function (table, columnsFields, constraintsFields, crude) {
	try {
		const columns = Object.entries(columnsFields).reduce(
			(cons, [key, value]) => {
				if (!value.hasOwnProperty("type")) throw "Missing Column Type";
				if (
					["$varchar", "$char", "$float"].includes(value.type) &&
					!value.hasOwnProperty("typeSize")
				)
					throw "Missing Type Size";
				if (
					value.type === "$numeric" &&
					value.hasOwnProperty("typeSize") &&
					(!Array.isArray(value.typeSize) ||
						value.typeSize.length !== 2 ||
						isNaN(value.typeSize[0]) ||
						isNaN(value.typeSize[1]) ||
						value.typeSize[0] < 1 ||
						value.typeSize[1] < 1)
				)
					throw "Type Size Error";

				const __typeSize = value.hasOwnProperty("typeSize")
					? value.type === "$numeric"
						? `(${value.typeSize[0]}, ${value.typeSize[1]})`
						: `(${value.typeSize})`
					: ``;
				const __null =
					value.hasOwnProperty("null") && value.null === true
						? `NULL`
						: `NOT NULL`;
				const __default = value.hasOwnProperty("default")
					? `DEFAULT ${value.default}`
					: ``;
				const __check = value.hasOwnProperty("check")
					? `CHECK ${value.check}`
					: ``;
				const __unique =
					value.hasOwnProperty("unique ") && value.unique === true
						? `UNIQUE`
						: ``;
				const __primaryKey =
					value.hasOwnProperty("primaryKey ") && value.primaryKey === true
						? `PRIMARY KEY`
						: ``;

				return (
					cons +
					`${cons !== "" ? "," : ""} ${key} ${
						typeOptions[value.type]
					} ${__typeSize} ${__null} ${__default} ${__check} ${__unique} ${__primaryKey}`
				);
			},
			""
		);

		const constraints = constraintsFields
			? Object.entries(constraintsFields).reduce((cons, [key, value]) => {
					if (
						!value.hasOwnProperty("foreignKey") ||
						!value.hasOwnProperty("references")
					)
						throw "Missing Foreign Key or Reference";

					const __match = `MATCH ${
						matchOptions[
							matchOptions.hasOwnProperty(value.match) ? value.match : "$simple"
						]
					}`;
					const __update = `ON UPDATE ${
						onUDOptions[
							onUDOptions.hasOwnProperty(value.update) ? value.update : "$na"
						]
					}`;
					const __delete = `ON DELETE ${
						onUDOptions[
							onUDOptions.hasOwnProperty(value.delete) ? value.delete : "$na"
						]
					}`;

					return (
						cons +
						`, CONSTRAINT ${key} FOREIGN KEY (${value.foreignKey}) REFERENCES ${value.references} ${__match} ${__update} ${__delete}`
					);
			  }, "")
			: "";

		const sql = `CREATE TABLE IF NOT EXISTS ${table} (${columns} ${constraints});`;

		await crude.conn.query(sql);

		if (crude.debug) console.log("Table created successfully");

		return table;
	} catch (error) {
		console.error(error.stack);
	}
}

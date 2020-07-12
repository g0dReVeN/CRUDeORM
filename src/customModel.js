import Model from "./baseModel";

export default function (tableName, modelName, crude) {
    const customModel = class extends Model {
        constructor(fields) {
            super(tableName, crude);

            return this.insert(fields);
        }

        static get table() {
            return tableName;
        }

        static get conn() {
            return crude.conn;
        }

        static get debug() {
            return crude.debug;
        }
    };

    Object.defineProperty(customModel, "name", { value: modelName });

    return customModel;
}
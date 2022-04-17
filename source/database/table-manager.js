const MySQLSettings = require("../../settings/mysql");

const MySQLConnection = require("./mysql");

class TableManager {
    #tableName;
    #columnsWithForeignKey;
    #foreignKeys;
    constructor(tableName) {
        this.#tableName = tableName;
        this.#columnsWithForeignKey = [];
        this.#foreignKeys = {};

        try {
            MySQLConnection.query(`SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=${MySQLConnection.escape(MySQLSettings.Name)} AND TABLE_NAME=${MySQLConnection.escape(this.#tableName)} AND REFERENCED_TABLE_SCHEMA IS NOT NULL;`, (error, results) => {
                if (error) {
                    console.log(("[MySQLDB]"), ("[TABLES]"), error);
                } else {
                    if (results?.length) {
                        results.forEach((result) => {
                            this.#columnsWithForeignKey.push(result.COLUMN_NAME);
                            this.#foreignKeys[result.COLUMN_NAME] = {
                                referencedTable: result.REFERENCED_TABLE_NAME,
                                referencedColumn: result.REFERENCED_COLUMN_NAME,
                                tableManager: new TableManager(result.REFERENCED_TABLE_NAME),
                            };
                        });
                    };
                };
            });
        } catch (error) {
            console.log(("[CATCHES]"), ("[MySQLDB]"), error);
        };
    };

    fetchRows = (filter, limit, offset) => new Promise((resolve, reject) => {
        try {
            MySQLConnection.query((`SELECT * FROM ${this.#tableName}${filter && Object.keys(filter)?.length ? (` WHERE ${Object.keys(filter).map((key) => {
                if (Array.isArray(filter[key])) return (`( ${(filter[key]).map((keyValue) => (` ${key}=${MySQLConnection.escape(keyValue)} `)).join(" OR ")} )`);
                else return(`${key}=${MySQLConnection.escape(filter[key])}`)
            }).join(" AND ")}`) : ""}${limit ? (` LIMIT ${limit}`) : ""}${offset ? (` OFFSET ${offset}`) : ""};`), async (error, results) => {
                if (error) return reject(error);
                else {
                    if (this.#columnsWithForeignKey?.length) {
                        let endResults = results;

                        for (let columnWithForeignKey of this.#columnsWithForeignKey) {
                            endResults = endResults.map(async (promisedResult) => {
                                let result = await promisedResult;
                                if (result[columnWithForeignKey]) {
                                    let foreignKeyData = this.#foreignKeys[columnWithForeignKey];
                                    let foreignKeyResults = await foreignKeyData.tableManager.fetchRow({ [foreignKeyData.referencedColumn]: result[columnWithForeignKey] });

                                    return ({
                                        ...result,
                                        [columnWithForeignKey]: foreignKeyResults
                                    });
                                } else return result;
                            });
                        };

                        Promise.all(endResults).then(resolve).catch(reject);
                    } else return resolve(results);
                };
            });
        } catch (error) {
            return reject(error);
        };
    });

    doesRowExist = (filter) => new Promise((resolve, reject) => {
        try {
            MySQLConnection.query((`SELECT EXISTS(SELECT * FROM ${this.#tableName} WHERE ${Object.keys(filter).map((key) => (`${key}=${MySQLConnection.escape(filter[key])}`)).join(" AND ")} LIMIT 1) as doesExist`), (error, result) => {
                if (error) return reject(error);
                else return resolve(result?.[0]?.doesExist);
            });
        } catch (error) {
            return reject(error);
        };
    });

    totalRows = (filter) => new Promise((resolve, reject) => {
        try {
            MySQLConnection.query((`SELECT COUNT(*) AS totalRows FROM ${this.#tableName}${filter && Object.keys(filter)?.length ? (` WHERE ${Object.keys(filter).map((key) => (`${key}=${MySQLConnection.escape(filter[key])}`)).join(" AND ")}`) : ""};`), (error, results) => {
                if (error) return reject(error);
                else return resolve(results?.[0]?.totalRows);
            });
        } catch (error) {
            return reject(error);
        };
    });

    deleteRow = (filter) => new Promise((resolve, reject) => {
        try {
            MySQLConnection.query((`DELETE FROM ${this.#tableName} WHERE ${Object.keys(filter).map((key) => (`${key}=${MySQLConnection.escape(filter[key])}`)).join(" AND ")}`), (error, result) => {
                if (error) return reject(error);
                else return resolve(result);
            });
        } catch (error) {
            return reject(error);
        };
    });

    insertRow = (values) => new Promise((resolve, reject) => {
        try {
            this.doesRowExist(values).then((doesExist) => {
                if (doesExist) this.fetchRows(values, 1).then((results) => resolve(results[0])).catch(reject);
                else MySQLConnection.query((`INSERT INTO ${this.#tableName} (${Object.keys(values).join(", ")}) VALUES (${Object.keys(values).map((key) => MySQLConnection.escape(values[key])).join(", ")})`), (error, result) => {
                    if (error) reject(error);
                    else this.fetchRows({ Id: result.insertId }).then((results) => resolve(results[0])).catch(reject);
                });
            }).catch(reject);
        } catch (error) {
            return reject(error);
        };
    });

    updateRow = (filter, values) => new Promise((resolve, reject) => {
        try {
            this.doesRowExist(filter).then((doesExist) => {
                if (doesExist) {
                    this.fetchRow(filter).then((row) => {
                        MySQLConnection.query((`UPDATE ${this.#tableName} SET ${Object.keys(values).map((key) => (`${key}=${MySQLConnection.escape(values[key])}`)).join(", ")} WHERE ${Object.keys(filter).map((key) => (`${key}=${MySQLConnection.escape(filter[key])}`)).join(", ")};`), (error, result) => {
                            if (error) reject(error);
                            else this.fetchRows({ Id: row.Id }).then((results) => resolve(results[0])).catch(reject);
                        });
                    }).catch(reject);
                } else this.insertRow({ ...filter, ...values }).then(resolve).catch(reject);
            }).catch(reject);
        } catch (error) {
            return reject(error);
        };
    });

    fetchRow = (filter) => new Promise((resolve, reject) => {
        try {
            this.doesRowExist(filter).then((doesExist) => {
                if (doesExist) this.fetchRows(filter, 1).then((results) => resolve(results[0])).catch(reject);
                else this.insertRow(filter).then(resolve).catch(reject);
            }).catch(reject);
        } catch (error) {
            return reject(error);
        };
    });
};

module.exports = TableManager;

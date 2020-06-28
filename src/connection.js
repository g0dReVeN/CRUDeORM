import dotenv from 'dotenv';
import { Pool } from "pg";

dotenv.config();

const pool = (dbDetails) => {
	return dbDetails ? new Pool(dbDetails) : new Pool({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		database: process.env.DB_NAME,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		max: 20,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
		// ssl: { rejectUnauthorized: false }
	});
};

export { pool };

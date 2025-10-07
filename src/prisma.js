import { PrismaClient } from "./generated/prisma/index.js";
import  dotenv from "dotenv";
dotenv.config();


const databaseUrl = `mysql://${process.env.MYSQLDB_USER}:${process.env.MYSQLDB_PASSWORD}@${process.env.MYSQLDB_HOST}:${process.env.MYSQLDB_PORT}/${process.env.MYSQLDB_DB}`;

const prisma = new PrismaClient();

export default prisma;
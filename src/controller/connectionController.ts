import type { NextFunction, Request, Response } from "express";
import DatabaseConnection from "../models/databases"
import { MongoClient } from "mongodb";
import { Client as PgClient } from "pg";
import mysql from "mysql2/promise";

export const runQuery = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { query, collection } = req.body;
  
      const connection = await DatabaseConnection.findById(id);
      if (!connection) {
        return res.status(404).json({ message: `Connection ${id} not found` });
      }
  
      let results;
  
      if (connection.type === "mongodb") {
        const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}`;
        const client = new MongoClient(uri);
        await client.connect();
  
        const db = client.db(connection.database);
        results = await db.collection(collection).find(query).toArray();
  
        await client.close();
      }
  
      else if (connection.type === "postgres") {
        const client = new PgClient({
          host: connection.host,
          port: connection.port,
          user: connection.username,
          password: connection.password,
          database: connection.database,
        });
        await client.connect();
  
        results = (await client.query(query)).rows;
  
        await client.end();
      }
  
      else if (connection.type === "mysql") {
        const conn = await mysql.createConnection({
          host: connection.host,
          port: connection.port,
          user: connection.username,
          password: connection.password,
          database: connection.database,
        });
  
        const [rows] = await conn.execute(query);
        results = rows;
  
        await conn.end();
      }
  
      else {
        return res.status(400).json({ message: `Unsupported type: ${connection.type}` });
      }
  
      res.status(200).json({ results });
  
    } catch (error) {
      res.status(500).json({
        message: "Failed to run query",
        error: (error as Error).message,
      });
    }
  };
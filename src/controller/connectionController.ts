import type { NextFunction, Request, Response } from "express";
import DatabaseConnection from "../models/databases"
import { MongoClient } from "mongodb";
import { Client as PgClient } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mysql from "mysql2/promise";
import { Prompts } from "../utils/prompts";
import Config from "../config/config"

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

const getMongoSchema = async (client: MongoClient, database: string) => {
  const db = client.db(database);
  const collections = await db.listCollections().toArray();
  const schema: any = {};

  for (const collection of collections) {
    const collectionName = collection.name;
    const sampleDocs = await db.collection(collectionName)
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();
    
    const fields: any = {};
    sampleDocs.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (!fields[key]) {
          fields[key] = {
            type: typeof doc[key],
            sampleValues: []
          };
        }
        if (fields[key].sampleValues.length < 3) {
          fields[key].sampleValues.push(doc[key]);
        }
      });
    });

    schema[collectionName] = {
      type: 'collection',
      fields,
      sampleCount: sampleDocs.length
    };
  }

  return schema;
};

const getPostgresSchema = async (client: PgClient) => {
  // Get all tables
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  const schema: any = {};

  for (const table of tablesResult.rows) {
    const tableName = table.table_name;
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableName]);

    const sampleResult = await client.query(`
      SELECT * FROM ${tableName} LIMIT 3
    `);

    const fields: any = {};
    columnsResult.rows.forEach(col => {
      fields[col.column_name] = {
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        sampleValues: sampleResult.rows.map(row => row[col.column_name]).filter(val => val !== null)
      };
    });

    schema[tableName] = {
      type: 'table',
      fields,
      sampleCount: sampleResult.rows.length
    };
  }

  return schema;
};

const getMysqlSchema = async (connection: any) => {
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
  `);
  
  const schema: any = {};

  for (const table of tables as any[]) {
    const tableName = table.TABLE_NAME;
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
    `, [tableName]);

    const [sampleData] = await connection.execute(`
      SELECT * FROM ?? LIMIT 3
    `, [tableName]);

    const fields: any = {};
    (columns as any[]).forEach(col => {
      fields[col.COLUMN_NAME] = {
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
        sampleValues: (sampleData as any[]).map(row => row[col.COLUMN_NAME]).filter(val => val !== null)
      };
    });

    schema[tableName] = {
      type: 'table',
      fields,
      sampleCount: (sampleData as any[]).length
    };
  }

  return schema;
};

export const runAiQueryHelper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    console.log(question)

    const connection = await DatabaseConnection.findById(id);
    if (!connection) {
      return res.status(404).json({ message: `Connection ${id} not found` });
    }

    let schema: any = {};

    if (connection.type === "mongodb") {
      const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}`;
      const client = new MongoClient(uri);
      await client.connect();
      
      schema = await getMongoSchema(client, connection.database);
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
      
      schema = await getPostgresSchema(client);
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
      
      schema = await getMysqlSchema(conn);
      await conn.end();
    }
    
    else {
      return res.status(400).json({ message: `Unsupported database type: ${connection.type}` });
    }

    const genAI = new GoogleGenerativeAI(Config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = Prompts.queryHelperPrompt(
      JSON.stringify(schema, null, 2),
      question,
      connection.type
    );

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      return res.status(500).json({
        message: "Failed to parse AI response",
        error: "Invalid JSON response from AI",
        rawResponse: aiResponse
      });
    }

    console.log(parsedResponse)

    let queryResults;
    try {
      if (connection.type === "mongodb") {
        const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}`;
        const client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db(connection.database);
        
        if (parsedResponse.aggregation) {
          queryResults = await db.collection(parsedResponse.collection)
            .aggregate(parsedResponse.aggregation).toArray();
        } else if (parsedResponse.query) {
          queryResults = await db.collection(parsedResponse.collection)
            .find(parsedResponse.query).limit(10).toArray();
        }
        
        await client.close();
      } 
      else {
        if (connection.type === "postgres") {
          const client = new PgClient({
            host: connection.host,
            port: connection.port,
            user: connection.username,
            password: connection.password,
            database: connection.database,
          });
          await client.connect();
          queryResults = (await client.query(parsedResponse.sql)).rows;
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
          const [rows] = await conn.execute(parsedResponse.sql);
          queryResults = rows;
          await conn.end();
        }
      }
    } catch (queryError) {
      return res.status(500).json({
        message: "Failed to execute generated query",
        error: (queryError as Error).message,
        generatedQuery: parsedResponse.sql || parsedResponse.query,
        aiResponse: parsedResponse
      });
    }

    res.status(200).json({
      success: true,
      question: question,
      schema: schema,
      aiResponse: parsedResponse,
      results: queryResults,
      resultCount: Array.isArray(queryResults) ? queryResults.length : 1
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to run AI query helper",
      error: (error as Error).message,
    });
  }
};
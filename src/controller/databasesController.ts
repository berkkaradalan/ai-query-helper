import type { NextFunction, Request, Response } from "express";
import DatabaseConnection from "../models/databases"

export const createConnection = async (req: Request, res: Response) => {
  try{
    const connection = new DatabaseConnection(req.body);
    await connection.save();
    res.status(201).json(connection);
  }catch(error){ 
    res.status(400).json({ message: "Failed to create new database connection. ", error});
  }
}

export const getConnections = async (req: Request, res: Response) => {
  try {
    res.status(200).json(await DatabaseConnection.find());
  } catch (error) {
    res.status(400).json({ message: "Failed to get database connections. ", error});
  }
}

export const getConnectionById = async (req: Request, res: Response) => {
  try {
    const connection = await DatabaseConnection.findById(req.params.id);

    if(!connection) return res.status(404).json({message: `database connection with ID: ${req.params.id} not found`});

    res.status(200).json(connection)
  }
  catch (error) {
    res.status(400).json({ message: `Failed to get database connection with ID: ${req.params.id}. `, error});
  }
}
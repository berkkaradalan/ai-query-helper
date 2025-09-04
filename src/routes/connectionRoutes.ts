import { Router } from "express";
import { runQuery } from "../controller/connectionController";

const router = Router();

router.post('/:id', runQuery)

export default router;
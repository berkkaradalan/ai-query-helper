import { Router } from "express";
import { runQuery, runAiQueryHelper } from "../controller/connectionController";

const router = Router();

router.post('/:id', runQuery)
router.post('/ai/:id', runAiQueryHelper)

export default router;
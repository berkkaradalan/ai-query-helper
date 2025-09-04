import { Router } from "express";

import { createConnection, getConnections, getConnectionById } from "../controller/databasesController";

const router = Router();

router.post('/', createConnection);
router.get('/', getConnections);
router.get('/:id', getConnectionById);

export default router;
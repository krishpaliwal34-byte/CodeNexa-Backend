import express from "express";

import {
  getStats,
  addStat,
  updateStat,
  deleteStat,
} from "../controllers/statController.js";

const router = express.Router();

/* Public */

router.get("/", getStats);


/* Admin */

router.post("/", addStat);

router.put("/:id", updateStat);

router.delete("/:id", deleteStat);

export default router;
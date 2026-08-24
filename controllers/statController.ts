import { Request, Response } from "express";
import Stat from "../models/Stat.js";

/* ==========================================
   GET ALL STATS
========================================== */

export const getStats = async (
  req: Request,
  res: Response
) => {
  try {
    const stats = await Stat.find()
      .sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};


/* ==========================================
   ADD STAT
========================================== */

export const addStat = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      label,
      value,
      description,
      order,
    } = req.body;

    if (
      !label ||
      !value ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Label, value and description are required",
      });
    }

    const stat = await Stat.create({
      label,
      value,
      description,
      order: order || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Stat added successfully",
      stat,
    });
  } catch (error) {
    console.error("Add Stat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add stat",
    });
  }
};


/* ==========================================
   UPDATE STAT
========================================== */

export const updateStat = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const stat = await Stat.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!stat) {
      return res.status(404).json({
        success: false,
        message: "Stat not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stat updated successfully",
      stat,
    });
  } catch (error) {
    console.error(
      "Update Stat Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update stat",
    });
  }
};

export const deleteStat = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const stat = await Stat.findByIdAndDelete(id);

    if (!stat) {
      return res.status(404).json({
        success: false,
        message: "Stat not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stat deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Stat Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete stat",
    });
  }
};
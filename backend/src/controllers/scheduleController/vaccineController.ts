import { Document, Types } from "mongoose";
import Vaccine from "../../models/scheduleModels/vaccinesModel";
import { IVaccine } from "../../types";

export class VaccinationController {
  //create a new vaccine
  static async createVaccine(
    req: {
      body: {
        name: any;
        description: any;
        manufacturer: any;
        type: any;
        ageGroups: any;
        sideEffects: any;
        targetPopulation?: string; // Added
        doseSchedule?: any[]; // Added
      };
    },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: {
          (arg0: {
            message: string;
            vaccine?: Document<unknown, {}, IVaccine, {}, {}> &
              IVaccine &
              Required<{ _id: Types.ObjectId }> & { __v: number };
            error?: unknown;
          }): void;
          new (): any;
        };
      };
    }
  ) {
    try {
      const {
        name,
        description,
        manufacturer,
        type,
        ageGroups,
        sideEffects,
        targetPopulation,
        doseSchedule,
      } = req.body;
      const newVaccine = new Vaccine({
        name,
        description,
        manufacturer,
        type,
        ageGroups,
        sideEffects,
        targetPopulation: targetPopulation || "all", // default to "all"
        doseSchedule: doseSchedule || [],
      });
      await newVaccine.save();
      res
        .status(201)
        .json({ message: "Vaccine created successfully", vaccine: newVaccine });
    } catch (error) {
      res.status(500).json({ message: "Error creating vaccine", error });
    }
  }

  //get all vaccines
  static async getAllVaccines(
    req: any,
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: {
          (arg0: {
            message: string;
            vaccines?: Document<unknown, {}, IVaccine, {}, {}>[] & IVaccine[];
            error?: unknown;
          }): void;
          new (): any;
        };
      };
    }
  ) {
    try {
      const vaccines = await Vaccine.find();
      res
        .status(200)
        .json({ message: "Vaccines retrieved successfully", vaccines });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving vaccines", error });
    }
  }

  //get a vaccine by id
  static async getVaccineById(
    req: { params: { id: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: {
          (arg0: {
            message: string;
            vaccine?: Document<unknown, {}, IVaccine, {}, {}> &
              IVaccine &
              Required<{ _id: Types.ObjectId }> & { __v: number };
            error?: unknown;
          }): void;
          new (): any;
        };
      };
    }
  ) {
    try {
      const vaccine = await Vaccine.findById(req.params.id);
      if (!vaccine) {
        return res.status(404).json({ message: "Vaccine not found" });
      }
      res
        .status(200)
        .json({ message: "Vaccine retrieved successfully", vaccine });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving vaccine", error });
    }
  }
}

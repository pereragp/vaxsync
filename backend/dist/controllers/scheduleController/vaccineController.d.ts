import { Document, Types } from "mongoose";
import { IVaccine } from "../../types";
export declare class VaccinationController {
    static createVaccine(req: {
        body: {
            name: any;
            description: any;
            manufacturer: any;
            type: any;
            ageGroups: any;
            sideEffects: any;
            targetPopulation?: string;
            doseSchedule?: any[];
        };
    }, res: {
        status: (arg0: number) => {
            (): any;
            new (): any;
            json: {
                (arg0: {
                    message: string;
                    vaccine?: Document<unknown, {}, IVaccine, {}, {}> & IVaccine & Required<{
                        _id: Types.ObjectId;
                    }> & {
                        __v: number;
                    };
                    error?: unknown;
                }): void;
                new (): any;
            };
        };
    }): Promise<void>;
    static getAllVaccines(req: any, res: {
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
    }): Promise<void>;
    static getVaccineById(req: {
        params: {
            id: any;
        };
    }, res: {
        status: (arg0: number) => {
            (): any;
            new (): any;
            json: {
                (arg0: {
                    message: string;
                    vaccine?: Document<unknown, {}, IVaccine, {}, {}> & IVaccine & Required<{
                        _id: Types.ObjectId;
                    }> & {
                        __v: number;
                    };
                    error?: unknown;
                }): void;
                new (): any;
            };
        };
    }): Promise<void>;
}
//# sourceMappingURL=vaccineController.d.ts.map
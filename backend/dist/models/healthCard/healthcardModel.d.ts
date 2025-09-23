import mongoose from "mongoose";
import { IHealthCard } from "../../types";
declare const HealthCard: mongoose.Model<IHealthCard, {}, {}, {}, mongoose.Document<unknown, {}, IHealthCard, {}, {}> & IHealthCard & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default HealthCard;
//# sourceMappingURL=healthcardModel.d.ts.map
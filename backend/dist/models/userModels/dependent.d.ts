import mongoose from "mongoose";
import { IDependent } from "../../types";
declare const Dependent: mongoose.Model<IDependent, {}, {}, {}, mongoose.Document<unknown, {}, IDependent, {}, {}> & IDependent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Dependent;
//# sourceMappingURL=dependent.d.ts.map
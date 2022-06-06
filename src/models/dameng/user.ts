import { DmModel, DMORM, DmType } from './bases';

export default class User extends DMORM<UserModel> {
    constructor() {
        const model: DmModel<UserModel> = {
            _id: { type: DmType.STRING },
            name: { type: DmType.NUMBER },
            test: { type: DmType.DATE }
        };

        super('user', model);
    }
}

import { DmModel } from 'dm-type';
import { DMORM, DmType } from './base';

export default new class User extends DMORM<UserModel> {
    constructor() {
        const model: DmModel<UserModel> = {
            _id: { type: DmType.STRING },
            name: { type: DmType.NUMBER },
            test: { type: DmType.DATE }
        };

        super('user', model);
    }
};

import { DMORM } from './bases';

export default class User extends DMORM<UserModel> {
    constructor() {
        super('user', {
            _id: { type: 'STRING' },
            name: { type: 'NUMBER' },
            test: { type: 'DATE' }
        });
    }
}

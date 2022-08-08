import { SchemaDefinition } from 'mongoose';

import BaseDb from './base';

class Instance extends BaseDb<InstanceModel> {
    /**
     * Creates an instance of Instance.
     * @memberof Instance
     */
    constructor() {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            instance: { type: String }
        };

        super('instances', _model);
    }
}

export default new Instance();

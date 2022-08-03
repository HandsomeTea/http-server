import { SchemaDefinition } from 'mongoose';

import BaseDb from './base';

export default new class ScheduledTask extends BaseDb<ScheduledTaskModel> {
    /**
     * Creates an instance of ScheduledTask.
     * @memberof ScheduledTask
     */
    constructor() {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            belongId: { type: String, required: true },
            tenantId: { type: String, required: true },
            hitTime: { type: Date, required: true },
            interval: { type: Number, required: true },
            taskMark: { type: String, required: true }
        };

        super('scheduled_task', _model);
    }
};

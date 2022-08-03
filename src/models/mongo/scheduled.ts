import { SchemaDefinition } from 'mongoose';

import BaseDb from './base';

export default new class Scheduled extends BaseDb<ScheduledModel> {
    /**
     * Creates an instance of Scheduled.
     * @memberof Scheduled
     */
    constructor() {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            mark: { type: String, required: true },
            tenantId: { type: String, required: true },
            name: { type: String },
            startTime: { type: Date, required: true },
            endTime: { type: Date },
            hitTime: { type: Date, required: true },
            cycle: { type: Number, required: true },
            cycleUnit: { type: String, required: true, enum: ['hour', 'day', 'month', 'year'] }
        };

        super('scheduled', _model);
    }
};

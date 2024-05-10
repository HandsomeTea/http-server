import { SchemaDefinition } from 'mongoose';

import BaseDb from './base';

class Test extends BaseDb<TestModel> {
	/**
	 * Creates an instance of Test.
	 * @memberof Test
	 */
	constructor() {
		const _model: SchemaDefinition = {
			type: { type: String, required: true },
			data: { type: Object }
		};

		super('test_data', _model);
	}
}

export default new Test();

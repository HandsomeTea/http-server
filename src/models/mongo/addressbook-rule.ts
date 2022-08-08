import { SchemaDefinition } from 'mongoose';

import BaseDb from './base';

export default class AddressBookRule extends BaseDb<AddressbookRuleModel> {
    /**
     * Creates an instance of AddressBookRule.
     * @param {string} _tenantId 租户的tenantId
     */
    constructor(_tenantId: string) {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            name: { type: String, required: true, trim: true },
            targetUserIds: { type: Array },
            targetDepartmentIds: { type: Array },
            hiddenToAll: { type: Boolean, default: false },
            visibleToSelfOrg: { type: Boolean, default: false },
            hiddenUserIds: { type: Array },
            visibleUserIds: { type: Array },
            hiddenDepartmentIds: { type: Array },
            visibleDepartmentIds: { type: Array }
        };

        super('addressbook_rule', _model, undefined, _tenantId);
    }
}

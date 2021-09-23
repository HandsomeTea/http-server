import { SchemaDefinition, ValidateOpts } from 'mongoose';
import BaseDB from './_mongodb';

export default class User extends BaseDB {
    constructor(tenantId: string) {
        const model: SchemaDefinition<UserModel> = {
            _id: { type: String, required: true, trim: true },
            name: { type: String, required: true, trim: true },
            test: {
                type: String,
                default: 'default test filed',
                validate: {
                    validator: (value: string) => {
                        if (value) {
                            return true;
                        }

                        return false;
                    },
                    message: props => `${props.value} is not a valid phone number!`
                } as ValidateOpts<string>
            }
        };

        super('users', model, undefined, tenantId);
    }
}

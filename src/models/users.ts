import { SchemaDefinition, ValidateOpts } from 'mongoose';
import Base from './_mongodb';

export default class User extends Base<UserModel> {
    /**
    * Creates an instance of User.
    * @param {string} tenantId 该mongodb的集合(表)数据分租户存储
    * @memberof User
    */
    constructor(tenantId: string) {
        const model: SchemaDefinition = {
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

        super(`users_${tenantId}`, model);
    }
}

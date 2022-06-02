/* eslint-disable camelcase */
import BaseDal from './base';
import { _SqlUserToken } from '@/models/sql';


export default class UserTokenDAL extends BaseDal {
    private tId!: string;
    private mysqlServer!: _SqlUserToken;

    constructor(_tenantId: string) {
        super();
        this.tId = _tenantId;

        if (this.db === 'sqldb') {
            this.mysqlServer = new _SqlUserToken(this.tId);
        }
    }

    // private async deleteLoginToken(option: {
    //     userId?: string,
    //     hashedToken?: string | Array<string>,
    //     stayHashedTokens?: Array<string>,
    //     type?: 'ws' | 'http' | 'device-ws',
    //     typeNot?: Array<'ws' | 'http' | 'device-ws'>,
    //     serialNumber?: string
    // }): Promise<void> {
    //     const { hashedToken, stayHashedTokens, type, typeNot, serialNumber, userId } = option;

    //     if (this.db === 'sqldb') {
    //         await this.mysqlServer.find({
    //             ...hashedToken ? { hashedToken: { $in: typeof hashedToken === 'string' ? [hashedToken] : hashedToken } } : {},
    //             ...stayHashedTokens ? { hashedToken: { $nin: stayHashedTokens } } : {},
    //             ...type ? { type } : {},
    //             ...typeNot ? { type: { $nin: typeNot } } : {},
    //             ...serialNumber ? { serialNumber } : {},
    //             ...userId ? { userId } : {}
    //         });
    //     }
    // }

    async insertLoginToken(tokenInfo: { type: 'ws' | 'http' | 'device-ws', userId: string, hashedToken: string, deviceType?: 'BCD' | 'BCM' | 'BR' | 'H323_SIP' | 'PSTN', serialNumber?: string }): Promise<void> {
        const { type, userId, hashedToken, deviceType, serialNumber } = tokenInfo;

        if (this.db === 'sqldb') {
            await this.mysqlServer.insertMany([{
                id: hashedToken,
                user_id: userId,
                type,
                device_type: deviceType,
                serial_number: serialNumber
            }]);
            // return await this.mysqlServer.tableIsExist();
            // return await this.mysqlServer.upsertExecute(`insert into  11686_user_token (id, user_id, type, create_at, updated_at) values ('test12345ss', 'sssaa', 'ws', '2022-4-13 21:10:12', '2022-4-13 21:10:12') on duplicate key update id='test12345ss1', user_id='sssaa1';`);
            // return await this.mysqlServer.insertExecute(`insert into  11686_user_token (id, user_id, type, create_at, updated_at) values ('test123==================', 'aaaaaa', 'ws', str_to_date('2022-4-21 10:23:06','%Y-%c-%e %H:%i:%s'), '2022-4-13 21:10:12');`);
            // return await this.mysqlServer.updateExecute(`update  11685_user_token set user_id='asdasdasd1234' where id='sad23asd345dfg';`);
            // return await this.mysqlServer.deleteExecute(`delete from 11686_user_token where type='ws';`);
            // return await this.mysqlServer.selectExecute(`select * from 11686_user_token;`);
            // return await this.mysqlServer.count({ where: { user_id: 'asdasdasd1234' } });
        }
    }

    async findOne(query: { hashedToken?: string, userId?: string, deviceType?: 'BCD' | 'BCM' | 'BR' | 'H323_SIP' | 'PSTN', serialNumber?: string }) {
        return await this.mysqlServer.findOne({
            where: {
                ...query.hashedToken ? { id: query.hashedToken } : {},
                ...query.userId ? { user_id: query.userId } : {},
                ...query.deviceType ? { device_type: query.deviceType } : {}
            }
        });
    }
}

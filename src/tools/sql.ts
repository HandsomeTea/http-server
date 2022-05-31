import { Sequelize } from 'sequelize';
import { getENV, system } from '@/configs';

export default new class MySQL {
    private service!: Sequelize | undefined;
    private isReady = false;
    constructor() {
        if (!this.isUseful) {
            return;
        }
        const sqlAddress = getENV('DB_TYPE') === 'postgres' ? getENV('POSTGRES_URL') : getENV('MYSQL_URL');

        if (!sqlAddress) {
            throw new Exception(`sql connect address is required but get ${sqlAddress}`);
        }
        const sqlConfig = new URL(sqlAddress);

        this.service = new Sequelize({
            username: sqlConfig.username,
            password: sqlConfig.password,
            host: sqlConfig.hostname,
            port: parseInt(sqlConfig.port),
            database: sqlConfig.pathname.replace('/', ''),
            dialect: getENV('DB_TYPE') === 'postgres' ? 'postgres' : 'mysql',
            omitNull: true,
            timezone: `${(new Date().toTimeString().match(/(GMT)(.?){5}/g) as Array<string>)[0].replace('GMT', '').substring(0, 3)}:00`,
            logging: sql => system('sql-command').debug(sql)
        });

        this.init();
    }

    private init() {
        this.service?.authenticate().then(() => {
            this.isReady = true;
            system('sql').info(`sql connected on ${getENV('MYSQL_URL')} success and ready to use.`);
        }).catch(error => {
            system('sql').error(error);
        });
    }

    /**
     * 系统是否采用sql作为数据库操作语句
     * @readonly
     * @private
     */
    private get isUseful() {
        return getENV('DB_TYPE') === 'mysql' || getENV('DB_TYPE') === 'postgres';
    }

    public get server() {
        if (!this.isUseful) {
            system('sql').warn(`require to use ${getENV('DB_TYPE')}, but call sql db! sql db is not available!`);
        }
        return this.service;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.isReady;
    }

    public async close(): Promise<void> {
        if (this.isReady) {
            await this.service?.close();
            this.isReady = false;
        }
    }
};

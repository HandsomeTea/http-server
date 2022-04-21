import { Sequelize } from 'sequelize';
import { getENV, system } from '@/configs';

export default new class MySQL {
    private service!: Sequelize;
    private isReady = false;
    constructor() {
        if (!this.isUseful) {
            return;
        }
        const mysqlAddress = getENV('MYSQL_URL');

        if (!mysqlAddress) {
            throw new Exception(`mysql connect address is required but get ${mysqlAddress}`);
        }
        const mysqlConfig = new URL(mysqlAddress);

        this.service = new Sequelize({
            username: mysqlConfig.username,
            password: mysqlConfig.password,
            host: mysqlConfig.hostname,
            port: parseInt(mysqlConfig.port),
            database: mysqlConfig.pathname.replace('/', ''),
            dialect: 'mysql',
            omitNull: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            logging: sql => system('mysql-command').debug(sql)
        });

        this.init();
    }

    private init() {
        this.service.authenticate().then(() => {
            this.isReady = true;
            system('mysql').info(`mysql connected on ${getENV('MYSQL_URL')} success and ready to use.`);
        }).catch(error => {
            system('mysql').error(error);
        });
    }

    /**
     * 系统是否采用mysql作为数据库
     * @readonly
     * @private
     */
    private get isUseful() {
        return getENV('DB_TYPE') === 'mysql';
    }

    public get server(): Sequelize {
        if (this.isUseful) {
            return this.service;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return system('db').error('mysql is not available!');
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.isReady;
    }

    public async close(): Promise<void> {
        if (this.isReady) {
            await this.service.close();
            this.isReady = false;
        }
    }
};

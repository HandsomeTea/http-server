import { Sequelize } from 'sequelize';
import { getENV, system } from '@/configs';

export default new class MySQL {
    private service!: Sequelize | undefined;
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
            timezone: `${(new Date().toTimeString().match(/(GMT)(.?){5}/g) as Array<string>)[0].replace('GMT', '').substring(0, 3)}:00`,
            logging: sql => system('mysql-command').debug(sql)
        });

        this.init();
    }

    private init() {
        this.service?.authenticate().then(() => {
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

    public get server() {
        if (!this.isUseful) {
            system('mysql').error(`require to use ${getENV('DB_TYPE')}, but call mysql! mysql is not available!`);
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

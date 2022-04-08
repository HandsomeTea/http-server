import { Sequelize } from 'sequelize';
import { getENV, system } from '@/configs';

export default new class MySQL {
    private service!: Sequelize;
    private isReady = false;
    constructor() {
        if (getENV('DB_TYPE') !== 'mysql') {
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
            timezone: '+08:00',
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

    public get server(): Sequelize {
        if (this.isUseful) {
            return this.service;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return system('db').error('mysql is not available!');
    }

    public get isUseful() {
        return getENV('DB_TYPE') !== 'mysql' || this.isReady;
    }

    public async close(): Promise<void> {
        if (this.isUseful) {
            this.isReady = false;
            await this.service.close();
            system('mysql').error('all connections in the pool have ended');
        }
    }
};

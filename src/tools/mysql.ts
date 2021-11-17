import { Sequelize } from 'sequelize';
import { parse } from 'url';
import { getENV, system } from '@/configs';

export default new class MySQL {
    public server: Sequelize;
    private isReady = false;
    constructor() {
        const mysqlAddress = getENV('MYSQL_URL');

        if (!mysqlAddress) {
            throw new Exception(`mysql connect address is required but get ${mysqlAddress}`);
        }
        const mysqlConfig = parse(mysqlAddress) as { auth: string, hostname: string, port: string, pathname: string };
        const [username, password] = mysqlConfig.auth.split(':');

        this.server = new Sequelize({
            username,
            password,
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
        this.server.authenticate().then(() => {
            this.isReady = true;
            system('mysql').info(`mysql connected on ${getENV('MYSQL_URL')} success and ready to use.`);
        }).catch(error => {
            system('mysql').error(error);
        });
    }

    public get isUseful() {
        return this.isReady;
    }

    public async close() {
        this.isReady = false;
        await this.server.close();
        system('mysql').error('all connections in the pool have ended');
    }
};

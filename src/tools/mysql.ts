import mysql, { Connection } from 'mysql';
import { system } from '@/configs';

export default new class MySQL {
    public server: Connection;
    constructor() {
        const mysqlAddress = process.env.MYSQL_URL;

        if (!mysqlAddress) {
            throw new Exception(`mysql connect address is required but get ${mysqlAddress}`);
        }
        this.server = mysql.createConnection(mysqlAddress);

        this.init();
    }

    private init() {
        this.server.connect(error => {
            if (error) {
                return system('mysql').error(error);
            }

            system('mysql').info(`mysql connected on ${process.env.MYSQL_URL} success and ready to use.`);
        });
    }

    public get isUseful() {
        return this.server.state === 'authenticated';
    }

    public close() {
        return this.server.end(() => {
            system('mysql').error('all connections in the pool have ended');
        });
    }
};

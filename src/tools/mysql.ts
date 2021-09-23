import mysql, { Connection } from 'mysql';
import { system } from '@/configs';

export default new class MySQL {
    public server: Connection;
    private isConnected: boolean;
    constructor() {
        this.isConnected = false;
        const mysqlAddress = process.env.MYSQL_URL;

        if (!mysqlAddress) {
            throw new Exception(`mysql connect address is required but get ${mysqlAddress}`);
        }
        this.server = mysql.createConnection(mysqlAddress);

        this.init();
    }

    private init() {
        this.server.connect((error, result) => {
            if (error) {
                return system('mysql').error(error);
            }

            this.isConnected = true;
            system('mysql').info(`mysql connected on ${process.env.MYSQL_URL} success and ready to use: ${JSON.stringify(result)}`);
        });
    }

    public get status() {
        return this.isConnected;
    }

    public close() {
        return this.server.end(() => {
            this.isConnected = false;
            system('mysql').error('all connections in the pool have ended');
        });
    }
};

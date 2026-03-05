const buddhaBlessing = () => {
    const layout = [
        '888888888888888888888888888888888888888888888888888888888888888888',
        '888南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛888',
        '8南8                                                          8南8',
        '8无8                         _ooOoo_                          8无8',
        '8阿8                        o8888888o                         8阿8',
        '8弥8                        88" . "88                         8弥8',
        '8陀8                        (| ^_^ |)                         8陀8',
        '8佛8                        O\\  =  /O                         8佛8',
        '8南8                     ____/`---\'\\____                      8南8',
        '8无8                   .\'  \\\\|     |//  `.                    8无8',
        '8阿8                  /  \\\\|||  :  |||//  \\                   8阿8',
        '8弥8                 /  _||||| -:- |||||-  \\                  8弥8',
        '8陀8                 |   | \\\\\\  -  /// |   |                  8陀8',
        '8佛8                 | \\_|  \'\'\\---/\'\'  |_/ |                  8佛8',
        '8南8                 \\  .-\\__  `-`  ___/-. /                  8南8',
        '8无8               ___`. .\'  /--.--\\  `. . ___                8无8',
        '8阿8             ."" \'<  `.___\\_<|>_/___.\'  >\'"" .            8阿8',
        '8弥8            | | :  `- \\`.;`\\ _ /`;.`/ - ` : | |           8弥8',
        '8陀8            \\  \\ `-.   \\_ __\\ /__ _/   .-` /  /           8陀8',
        '8佛8           =====`-.____`-.___\\_____/___.-`======          8佛8',
        '8南8  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  8南8',
        '8无8                                                          8无8',
        '8阿8                  佛祖保佑       永无BUG                  8阿8',
        '8弥8                  系统稳定       天天盈利                 8弥8',
        '8陀8                                                          8陀8',
        '8佛8                        \\    |    /                       8佛8',
        '8南8                         \\   |   /                        8南8',
        '8无8                          \\  |  /                         8无8',
        '8阿8                      ================                    8阿8',
        '8弥8                      ===== 上香 =====                    8弥8',
        '8陀8                                                          8陀8',
        '8佛8                                                          8佛8',
        '888南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛南无阿弥陀佛888',
        '888888888888888888888888888888888888888888888888888888888888888888'
    ];

    // eslint-disable-next-line no-console
    console.log(`\x1B[38;5;214m${layout.join('\n')}\x1B[0m`);
};
const alpacaBlessing = () => {
    const beast = `
    ┏┓      ┏┓
    ┏┛┻━━━━━━┛┻┓
    ┃      ☃      ┃
    ┃  ┳┛  ┗┳  ┃
    ┃      ┻      ┃
    ┗━┓      ┏━┛
      ┃      ┗━━━━━┓
      ┃  神兽保佑  ┣┓
      ┃  永无BUG！ ┏┛
      ┗┓┓┏━━━━┳┓┏┛
       ┃┫┫    ┃┫┫
       ┗┻┛    ┗┻┛
    `;

    // eslint-disable-next-line no-console
    console.log(`\x1B[38;5;34m${beast}\x1B[0m`);
};
const catBlessing = () => {
    const cat = `
      /\\_/\\
     ( o.o )
      > ^ <  --- "Meow! Your code is purr-fect!"
    `;

    // eslint-disable-next-line no-console
    console.log(`\x1B[38;5;34m${cat}\x1B[0m`);
};
const techBanner = () => {
    const banner = `
     _________________________________________
    |  ____  _____  __  __ ___ _   _ ___      |
    | / ___|| ____||  \\/  |_ _| \\ | |_ _|     |
    | \\___ \\|  _|  | |\\/| || ||  \\| || |      |
    |  ___) | |___ | |  | || || |\\  || |      |
    | |____/|_____||_|  |_|___|_| \\_|___|     |
    |_________________________________________|
    `;

    // eslint-disable-next-line no-console
    console.log(`\x1B[32;1m${banner}\x1B[0m`);
};

export const createBlessing = (afterInfo?: string) => {
    const blessingFns: Array<() => void> = [buddhaBlessing, alpacaBlessing, catBlessing, techBanner];
    const randomBlessingFn = blessingFns[Math.floor(Math.random() * blessingFns.length)];

    randomBlessingFn();

    if (afterInfo) {
        // eslint-disable-next-line no-console
        console.log(`\n\x1B[32;1m ... ${afterInfo}\x1B[0m\n\n`);
    }
};

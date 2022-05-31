global.tenantDBModel = {};

import './alias';
import './exception';
import './log';
import './env';

// import test from '../src/models/SQLBase';

// interface Test {
//     aa: string | null
//     bb: number
//     cc: string | null
//     dd: 0 | 1
//     ff: Date
// }

// const testData = new test<Test>('testTB', 'testDB');

// console.log(testData.getInsertSql({
//     aa: '123',
//     bb: 10,
//     cc: null,
//     dd: 1,
//     ff: new Date()
// }));

// console.log(testData.getDeleteSql({
//     where: {
//         aa: '123'
//     }
// }));

// console.log(testData.getUpdateSql({
//     where: {
//         aa: '123'
//     }
// }, {
//     dd: 0
// }));

// console.log(testData.getSelectSql({
//     where: {
//         aa: { $notIn: ['sss', '13s'] }
//     },
//     order: [{ bb: 'desc' }],
//     limit: 2
// }));

// console.log(testData.getCountSql({
//     where: {
//         aa: { $notIn: ['sss', '13s'] }
//     }
// }));

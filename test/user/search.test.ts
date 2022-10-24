// import siege from 'siege';

// siege()
//     .on(3000)
//     // .get('/tests/test/12312').for(3000).times//这个借口测试30000次
//     .get('/tests/test/12312').for(20).seconds//这个借口测试20秒
//     .attack();

import { describe, it } from 'mocha';
// import assert from 'assert';

// describe('Array', () => {
//     describe('#indexOf()', () => {
//         it('should return -1 when the value is not present', () => {
//             assert.strictEqual([1, 2, 3].indexOf(4), -1);
//         });
//     });
// });

import server from 'supertest';

describe('GET /api/v1/user/user', () => {
    it('response with json', done => {
        server('http://localhost:3000')
            .post('/api/v1/user/user')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .timeout(10 * 1000)
            .expect(200, done).expect(res => {
                // eslint-disable-next-line no-console
                console.log('111', res.body);
            });
    });
});

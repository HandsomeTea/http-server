const newBinary = len => {
    if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
        const ret = [];

        for (let i = 0; i < len; i++) {
            ret.push(0);
        }

        ret.$Uint8ArrayPolyfill = true;
        return ret;
    }
    return new Uint8Array(new ArrayBuffer(len));
};
const getChar = val => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(val);

module.exports = array => {
    if (typeof array === 'string') {
        const str = array;

        array = newBinary(str.length);

        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);

            if (ch > 0xFF) {
                throw new Error('Not ascii. Base64.encode can only take ascii strings.');
            }

            array[i] = ch;
        }
    }

    const answer = [];

    let a = null, b = null, c = null, d = null;

    for (let i = 0; i < array.length; i++) {
        // eslint-disable-next-line default-case
        switch (i % 3) {
            case 0:
                a = array[i] >> 2 & 0x3F;
                b = (array[i] & 0x03) << 4;
                break;
            case 1:
                b = b | array[i] >> 4 & 0xF;
                c = (array[i] & 0xF) << 2;
                break;
            case 2:
                c = c | array[i] >> 6 & 0x03;
                d = array[i] & 0x3F;
                answer.push(getChar(a));
                answer.push(getChar(b));
                answer.push(getChar(c));
                answer.push(getChar(d));
                a = null;
                b = null;
                c = null;
                d = null;
                break;
        }
    }

    if (a !== null) {
        answer.push(getChar(a));
        answer.push(getChar(b));
        if (c === null) {
            answer.push('=');
        } else {
            answer.push(getChar(c));
        }

        if (d === null) {
            answer.push('=');
        }
    }

    return answer.join('');
};

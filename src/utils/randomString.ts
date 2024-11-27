import crypto from 'crypto';

const hexString = (digits: number): string => {
	const numBytes = Math.ceil(digits / 2);

	let bytes = null;

	// Try to get cryptographically strong randomness. Fall back to
	// non-cryptographically strong if not available.
	try {
		bytes = crypto.randomBytes(numBytes);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(e);
		// XXX should re-throw any error except insufficient entropy
		bytes = crypto.pseudoRandomBytes(numBytes);
	}
	const result = bytes.toString('hex');

	// If the number of digits is odd, we'll have generated an extra 4 bits
	// of randomness, so we need to trim the last digit.
	return result.substring(0, digits);
};

const fraction = (): number => {
	const numerator = parseInt(hexString(8), 16);

	return numerator * 2.3283064365386963e-10; // 2^-32
};

const choice = (arrayOrString: string | Array<string>): string => {
	const index = Math.floor(fraction() * arrayOrString.length);

	if (typeof arrayOrString === 'string') {
		return arrayOrString.substring(index, 1);
	} else {
		return arrayOrString[index];
	}
};

/**
 * 从alphabet中随机挑选charsCount个字符组成随机字符串
 */
export default (charsCount?: number, alphabet?: string): string => {
	const digits = [];

	if (!alphabet) {
		alphabet = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
	}
	if (!charsCount) {
		charsCount = 17;
	}
	for (let i = 0; i < charsCount; i++) {
		digits[i] = choice(alphabet);
	}
	return digits.join('');
};

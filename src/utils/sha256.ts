import crypto from 'crypto';

export default (string: string): string => crypto.createHash('sha256').update(string).digest().toString('hex');

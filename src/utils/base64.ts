export default (string: string): string => Buffer.from(string).toString('base64');

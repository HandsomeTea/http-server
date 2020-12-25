export default async (_params: unknown, attempt: SocketAttempt): Promise<unknown> => {
    console.log(`test : ${JSON.stringify(attempt)}`); /* eslint-disable-line no-console */
    return { result: 'success' };
};

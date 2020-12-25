import { Response, Request } from 'express';

interface MyResponse extends Response {
    success: (result?: unknown) => Promise<void>
}

interface MyRequest extends Request {
    userId?: string
    user: string
}

export { MyResponse, MyRequest };

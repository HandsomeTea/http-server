import path from 'path';
import ffmpeg from 'ffmpeg';
import gm from 'gm';

export const Image = new class ImageServer {
    constructor() {
        //
    }

    async getThumbnail(filePath: string) {
        const fileDir = filePath.split('/').splice(0, filePath.split('/').length - 1).join('/');
        const resultDir = path.join(fileDir, `thumbnail_${new Date().getTime()}`);
        const file = await new ffmpeg(filePath);
        const res = await file.fnExtractFrameToJPG(resultDir, {
            'frame_rate': 1,
            number: 1
        });

        return {
            dir: resultDir,
            path: res[0]
        };
    }

    async getCutImage(imgBuffer: Buffer, option: { rate: number, width: number, height: number, leftRate?: number, rightRate?: number }) {
        const { rate, width, height, leftRate, rightRate } = option;
        const getCutParams = (location: 'l' | 'm' | 'r') => {
            const _rate = (location === 'l' ? leftRate : location === 'r' ? rightRate : rate) || rate;
            const _width = width * _rate;
            const _height = height * _rate;
            const offsetX = (width - _width) / 2;
            const offsetY = (height - _height) / 2;

            return [_width, _height, offsetX, offsetY];
        };

        return [await new Promise(resolve => {
            const [_width, _height, x, y] = getCutParams('m');

            gm(imgBuffer).resize(width, height).crop(_width, _height, x, y).toBuffer((err, buffer) => {
                if (err) {
                    throw new Exception(err.message);
                }
                resolve(buffer);
            });
        }),
        await new Promise(resolve => {
            const [_width, _height, , y] = getCutParams('l');

            gm(imgBuffer).resize(width, height).crop(_width, _height, 0, y).toBuffer((err, buffer) => {
                if (err) {
                    throw new Exception(err.message);
                }
                resolve(buffer);
            });
        }),
        await new Promise(resolve => {
            const [_width, _height, x, y] = getCutParams('r');

            gm(imgBuffer).resize(width, height).crop(_width, _height, x * 2, y).toBuffer((err, buffer) => {
                if (err) {
                    throw new Exception(err.message);
                }
                resolve(buffer);
            });
        })] as Array<Buffer>;
    }
};

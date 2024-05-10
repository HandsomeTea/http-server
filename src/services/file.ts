import fs from 'fs';
import {
	Document,
	Paragraph,
	HeadingLevel,
	Packer,
	AlignmentType
} from 'docx';
import path from 'path';
import { ErrorCode } from '@/configs';
import { TencentOSS } from './OSS';

export default new class FileService {
	constructor() {
		//
	}

	async exportAsWord(content: string, title: string) {
		if (!content || !title) {
			throw new Exception('content and title is required!', ErrorCode.INVALID_ARGUMENTS);
		}

		const doc = new Document({
			sections: [{
				children: [
					new Paragraph({
						text: title,
						heading: HeadingLevel.TITLE,
						alignment: AlignmentType.CENTER
					}),
					...decodeURI(Buffer.from(content, 'base64').toString('utf-8')).split('\n').map(a => new Paragraph({
						text: a
					}))
				]
			}]
		});
		const fileName = `${title}.docx`;
		const dir = path.join(__dirname, fileName);

		fs.writeFileSync(dir, await Packer.toBuffer(doc));

		return {
			dir,
			fileName
		};
	}

	async downloadOssFile(fileAddr: string, type: 'oss') {
		let file: Buffer | undefined = undefined;

		if (type === 'oss') {
			file = await TencentOSS.downloadFile(decodeURIComponent(decodeURI(fileAddr)));
		}
		if (!file) {
			throw new Exception(`download ${fileAddr} failed!`);
		}
		const fileType = fileAddr.split('.').pop();
		const fileName = `${new Date().getTime}.${fileType}`;
		const dir = path.join(__dirname, fileName);

		fs.writeFileSync(dir, file);
		return {
			dir,
			fileName
		};
	}

	// router.get('/download', asyncHandler(async (req, res) => {
	//     const { dir, fileName } = await File.downloadOssFile(req.query.url as string, req.query.type as 'oss');

	//     res.setHeader('Content-Type', 'application/octet-stream');
	//     res.setHeader('content-disposition', `attachment;filename=${encodeURIComponent(fileName)}`);
	//     const file = fs.createReadStream(dir);

	//     file.pipe(res);
	//     file.on('end', function () {
	//         fs.unlinkSync(dir);
	//     });
	//     file.on('error', () => {
	//         fs.unlinkSync(dir);
	//     });
	// }));
};

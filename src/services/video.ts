// import path from 'path';
// import fs from 'fs';
// import ffmpeg from 'ffmpeg';
// import { FFCreator, FFScene, FFVideo } from 'ffcreator';
// import { log } from '@/configs';

/** `${number}:${number}:${number}.${number}` */
// const getTimeLong = (time: string) => {
// 	return (new Date(`1970-01-01 ${time}`).getTime() - new Date('1970-01-01 00:00:00.00').getTime()) / 1000;
// };

export const Video = new class VideoServer {
	constructor() {
		//
	}

	// async megerVideoWithSource(source: { videoLocalPath: Array<string>, audioLocalPath?: string, bgMusicLocalPath?: string }): Promise<{ localPath: string }> {
	//     const cacheDir = path.join(__dirname, '../../catch');
	//     const outputDir = path.join(__dirname, '../../video');

	//     fs.mkdirSync(cacheDir, { recursive: true });
	//     fs.mkdirSync(outputDir, { recursive: true });
	//     const width = 1080;
	//     const height = 1920;
	//     const creator = new FFCreator({
	//         cacheDir,
	//         outputDir,
	//         width,
	//         height
	//     });
	//     const { videoLocalPath, audioLocalPath, bgMusicLocalPath } = source;

	//     if (audioLocalPath) {
	//         const audioDuration = getTimeLong((await new ffmpeg(audioLocalPath)).metadata.duration?.raw || '00:00:00.00');
	//         let long = 0;

	//         for (let s = 0; s < videoLocalPath.length; s++) {
	//             if (long < audioDuration) {
	//                 const duration = getTimeLong((await new ffmpeg(videoLocalPath[s])).metadata.duration?.raw || '00:00:00.00');
	//                 const sence = new FFScene();
	//                 const video = new FFVideo({
	//                     path: videoLocalPath[s],
	//                     width,
	//                     height,
	//                     x: width / 2, y: height / 2
	//                 });

	//                 video.setAudio(false);

	//                 if (audioDuration - long >= duration) {
	//                     sence.addChild(video);
	//                     sence.setDuration(duration);
	//                     creator.addChild(sence);
	//                     long += duration;
	//                 } else {
	//                     sence.addChild(video);
	//                     sence.setDuration(audioDuration - long);
	//                     creator.addChild(sence);
	//                     break;
	//                 }
	//             } else {
	//                 break;
	//             }
	//         }
	//         creator.addAudio(audioLocalPath);
	//     }

	//     if (bgMusicLocalPath) {
	//         for (let s = 0; s < videoLocalPath.length; s++) {
	//             const duration = getTimeLong((await new ffmpeg(videoLocalPath[s])).metadata.duration?.raw || '00:00:00.00');
	//             const sence = new FFScene();
	//             const video = new FFVideo({
	//                 path: videoLocalPath[s],
	//                 width,
	//                 height,
	//                 x: width / 2, y: height / 2
	//             });

	//             sence.addChild(video);
	//             sence.setDuration(duration);
	//             creator.addChild(sence);
	//         }
	//         creator.addAudio({ loop: true, path: bgMusicLocalPath, volume: 1 });
	//     }

	//     return await new Promise(resolve => {
	//         creator.start();

	//         // @ts-ignore
	//         creator.on('complete', e => {
	//             log('FFCreator-megerVideoWithSource').info(`FFCreator completed: \n USEAGE: ${e.useage} \n PATH: ${e.output} `);
	//             resolve({ localPath: e.output });
	//         });

	//         // @ts-ignore
	//         creator.on('progress', e => {
	//             log('FFCreator-megerVideoWithSource').info(`FFCreator progress: ${e.percent * 100 >> 0}%`);
	//         });

	//         // @ts-ignore
	//         creator.on('error', e => {
	//             log('FFCreator-megerVideoWithSource-error').error(e);
	//             throw new Exception('generate video failed!');
	//         });
	//     });
	// }
};

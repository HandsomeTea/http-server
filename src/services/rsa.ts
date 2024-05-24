import NodeRSA from 'node-rsa';
// import crypto from 'crypto';

export const Encryption = new class CryptoService {
	constructor() {
		//
	}

	async gererateGitSSHKey(email: string) {
		const key = new NodeRSA({ b: 2048 });

		key.setOptions({
			environment: 'node'
		})
		const privateKey = key.exportKey('openssh-private');
		const publicKey = key.exportKey('openssh-public');

		return {
			privateKey,
			publicKey: `${publicKey}${email}`
		};
		// return new Promise((resolve, reject) => {
		// 	crypto.generateKeyPair('rsa', {
		// 		modulusLength: 4096,
		// 		publicKeyEncoding: {
		// 			type: 'pkcs1',
		// 			format: 'pem'
		// 		},
		// 		privateKeyEncoding: {
		// 			type: 'pkcs1',
		// 			format: 'pem',
		// 			cipher: 'aes-256-cbc',
		// 			passphrase: ''
		// 		}
		// 	}, (err, publicKey, privateKey) => {
		// 		if (err) {
		// 			return reject(err);
		// 		}

		// 		resolve({
		// 			publicKey: sshpk.parseKey(publicKey, 'pem').toString('ssh'),
		// 			privateKey
		// 		});
		// 	})
		// });
	}
}

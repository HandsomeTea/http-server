const dealAssign = (obj: Record<string, unknown>) => {
	if (obj['<<']) {
		if (Array.isArray(obj['<<'])) {
			const _obj = obj['<<'].reduce((a, b) => Object.assign(a, b), {});

			delete obj['<<'];
			Object.assign(obj, _obj);
		} else {
			const _o = obj['<<'];

			delete obj['<<'];
			Object.assign(obj, _o);
		}
	}
};

export const dealYaml = (obj: Record<string, unknown>) => {
	if (typeof obj !== 'object') {
		return;
	}
	if (obj['<<']) {
		if (Array.isArray(obj['<<'])) {
			for (let s = 0; s < obj['<<'].length; s++) {
				dealAssign(obj['<<'][s]);
			}
			const _obj = obj['<<'].reduce((a, b) => Object.assign(a, b), {});

			delete obj['<<'];
			Object.assign(obj, _obj);
		} else {
			dealAssign(obj);
		}
		if (obj['<<']) {
			dealYaml(obj);
		}
	} else {
		if (Array.isArray(obj)) {
			for (const key of obj) {
				dealYaml(obj[key]);
			}
		} else {
			for (const key in obj) {
				dealYaml(obj[key] as Record<string, unknown>);
			}
		}
	}
};

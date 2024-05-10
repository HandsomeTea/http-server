declare global {
	var isServerRunning: boolean
	var Exception: ExceptionConstructor
	/** 清空无效的instance间隔,单位为秒 */
	var IntervalCleanUnusedInstance: number
	/** instance保活间隔,单位为秒 */
	var IntervalUpdateInstance: number
}

export { };

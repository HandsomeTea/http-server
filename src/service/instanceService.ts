import { Instances } from '@/models';

class InstanceService {
    constructor() {
        this.init();
    }

    private async init() {
        /**instance保活维护 */
        await Instances.insertSystemInstance();
        setInterval(() => Instances.upsertSystemInstance(), global.IntervalUpdateInstance * 1000);

        /** 删除无效的instance */
        setInterval(() => Instances.deleteUnusedInstance(), global.IntervalCleanUnusedInstance * 1000);
    }

    /**
     * 为当前instance定义一个定时任务呢
     *
     * @param {object} time 定时设置
     * @param {number} time.second 0-59
     * @param {number} time.minute 0-59
     * @param {number} time.hour 0-23
     * @param {number} time.day 1-31
     * @param {number} time.month 0-11，当年和月都有时，优先取月，年被放弃
     * @param {number} time.year 当年和月都有时，优先取月，年被放弃
     * @param {number} time.dayOfWeek (0-6) Starting with Sunday
     * @param {function} fn 定时任务执行的函数
     * @memberof InstanceService
     */
    // private setInstanceTaskTiming(time: { second?: number, minute?: number, hour?: number, day?: number, month?: number, year?: number, dayOfWeek?: number }, fn: (fireDate: Date) => void) {
    //     const { second, minute, hour, day, month, year, dayOfWeek } = time;
    //     const _fn = (d?: number) => d === 0 ? '0' : !d ? '*' : `${d}`;

    //     // *    *    *    *    *    *
    //     // ┬    ┬    ┬    ┬    ┬    ┬
    //     // │    │    │    │    │    │
    //     // │    │    │    │    │    └ 当星期数为几时
    //     // │    │    │    │    └───── 当年份为多少或月份为多少时
    //     // │    │    │    └────────── 当日期为几号时
    //     // │    │    └─────────────── 当小时数为多少时
    //     // │    └──────────────────── 当分钟数为多少时
    //     // └───────────────────────── 当秒数为多少时
    //     schedule.scheduleJob(`${_fn(second)} ${_fn(minute)} ${_fn(hour)} ${_fn(day)} ${_fn(month || year)} ${_fn(dayOfWeek)}`, fn);
    // }
}

export default new InstanceService();

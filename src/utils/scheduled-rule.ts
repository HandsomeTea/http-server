import schedule from 'node-schedule';

/**
 * 表示每 {unitData} {unit："month" | "week" | "day"} 的 第 {day} 天 {time} 执行
 * @param data
 * @returns
 */
export const generateScheduleRule = (data: {
    unit: 'month' | 'week' | 'day'
    /** unit为month和week时，unitData为必须1 */
    unitData: number
    /** unit为day时，day值将不被使用 */
    day?: number
    /** HH:mm */
    time: string
}) => {
    const { unit, unitData, day, time } = data;
    // 当{unit}表示天时，才有每{unitData}天
    // 当{unit}表示周和月时，只有每周和每月的第{day}天
    const [hour, minute] = time.split(':').map(a => parseInt(a));
    const rule = new schedule.RecurrenceRule();

    rule.hour = hour;
    rule.minute = minute;
    rule.second = 0;           // 务必设置秒为 0，防止在一分钟内多次触发
    rule.tz = 'Asia/Shanghai'; // 显式指定时区，解决服务器时区偏差问题

    if (unit === 'week') {
        rule.dayOfWeek = (!day || day === 7) ? 0 : day;
    } else if (unit === 'month') {
        rule.date = day || 1;
    }
    else if (unit === 'day') {
        if (unitData > 1) {
            rule.date = new schedule.Range(1, 31, unitData);
        }
    }

    return rule;
}

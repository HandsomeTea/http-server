import { fixedNumString } from './fixedNumStr';

/**
 * 生成 yyyy-MM-ddTHH:mm:ss.SSSXXX 格式的UTC时间
 */
export const getUTCTime = (): string => {
    const now = new Date();
    const { year, month, day, hour, minute, seconds, milliseconds } = {
        year: now.getUTCFullYear(),
        month: fixedNumString(now.getUTCMonth() + 1),
        day: fixedNumString(now.getUTCDate()),
        hour: fixedNumString(now.getUTCHours()),
        minute: fixedNumString(now.getUTCMinutes()),
        seconds: fixedNumString(now.getUTCSeconds()),
        milliseconds: fixedNumString(now.getUTCMilliseconds(), 3)
    };

    return `${year}-${month}-${day}T${hour}:${minute}:${seconds}.${milliseconds}Z`;
};

/**
 * when date is undefined, deal with today
 *
 * @param {Date} [date]
 * @returns {{ year: number, month: number, day: number, week: number }}
 */
export const getFormatDateObject = (date?: Date): { year: number, month: number, day: number, week: number, hour: number, minute: number, second: number, millisecond: number } => {
    if (!date) {
        date = new Date();
    }

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        week: date.getDay() || 7,
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds()
    };
};

/**
 * when date is undefined, deal with today
 *
 * @param {{ year?: number, month?: number, day?: number }} [date]
 * @returns {Date}
 */
export const getDayStartDate = (date?: { year?: number, month?: number, day?: number }): Date => {
    let { year, month, day } = date || {};
    const now = new Date();

    if (!year) {
        year = now.getFullYear();
    }

    if (!month) {
        month = now.getMonth() + 1;
    }

    if (!day) {
        day = now.getDate();
    }

    return new Date(`${year}/${month}/${day} 00:00:00`);
};

/**
 * 格式化时长
 *
 * @param {(number | { start: number, end: number })} data
 * @returns {string}
 */
export const getTimeLong = (data: number | { start: number, end: number }): string => {
    if (typeof data !== 'number') {
        const { end, start } = data;

        data = Math.abs(end - start);
    }

    const fixTime = (num: number) => {
        if (num < 1) {
            return '00';
        } else if (num < 10) {
            return `0${num}`;
        } else {
            return `${num}`;
        }
    };
    let second = Math.floor(data / 1000);

    const hour = fixTime(Math.floor(second / 60 / 60));

    second = second - parseInt(hour) * 60 * 60;
    const minute = fixTime(Math.floor(second / 60));
    const _second = fixTime(second - parseInt(minute) * 60);

    return `${hour}:${minute}:${_second}`;
};

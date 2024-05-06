import pinyin from 'pinyin';

/** 将中文转化为拼音，如：中心 => zhongxin */
export default (zh: string): string => {
    let res = '';
    const arr = pinyin(zh).toString().split(',');

    arr.forEach((str) => {
        res += str;
    });
    return res.toLowerCase();
};

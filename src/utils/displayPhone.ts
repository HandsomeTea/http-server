import isPhone from './isPhone';

export default (phone: string): string => {
    if (!isPhone(phone)) {
        return '';
    }
    const reverseString = (str: string): string => str.split('').reverse().join('');
    const reverse = reverseString(phone);
    const startReverse = reverse.substring(8);
    const endReverse = reverse.substring(0, 4);

    return `${reverseString(startReverse)}****${reverseString(endReverse)}`;
};

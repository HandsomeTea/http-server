export const isPhone = (phone: string): boolean => /^((\+|00)86)?1[3-9]\d{9}$/.test(phone);

export const displayPhone = (phone: string): string => {
    if (!isPhone(phone)) {
        return '';
    }
    const reverseString = (str: string): string => str.split('').reverse().join('');
    const reverse = reverseString(phone);
    const startReverse = reverse.substring(8);
    const endReverse = reverse.substring(0, 4);

    return `${reverseString(startReverse)}****${reverseString(endReverse)}`;
};

export const getPhone = (phone: string) => {
    if (!isPhone(phone)) {
        return;
    }
    if (phone.length === 11) {
        return phone;
    } else {
        return phone.split('').reverse().splice(0, 11).reverse().join('');
    }
};

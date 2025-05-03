// utils/dateUtils.js

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' });
}

export function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' })} ${date.toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore' })}`;
}
// utils/dateUtils.js

export function formatDate(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' });
}

export function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatDateForInput(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const [month, day, year] = date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' }).split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // returns "2025-05-03"
};
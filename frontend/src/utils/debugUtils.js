/**
 * Debug utility to log API responses
 * @param {string} apiName Name of the API being called
 * @param {Object} data Data returned from the API
 */
export const logApiResponse = (apiName, data) => {
    console.log(`API Response from ${apiName}:`, data);
    
    // Check if data is in expected format
    if (Array.isArray(data)) {
        const firstItem = data[0];
        if (firstItem) {
            console.log("First item fields:", Object.keys(firstItem));
            console.log("Sample item values:", firstItem);
        } else {
            console.log("Array is empty");
        }
    } else if (data && typeof data === 'object') {
        console.log("Response fields:", Object.keys(data));
    } else {
        console.log("Response is not an object or array");
    }
};

/**
 * Debug utility to check if an object has expected fields
 * @param {Object} obj Object to check
 * @param {Array} expectedFields Array of field names that should exist
 * @returns {Array} Array of missing fields
 */
export const checkMissingFields = (obj, expectedFields) => {
    const missingFields = [];
    expectedFields.forEach(field => {
        if (!obj[field]) {
            missingFields.push(field);
        }
    });
    return missingFields;
};

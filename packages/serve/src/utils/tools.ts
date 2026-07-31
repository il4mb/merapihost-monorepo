/**
 * Recursively extracts only the fields from jsonData that differ from objectSource.
 * 
 * @param jsonData The object from the request body
 * @param objectSource The existing object from the database
 * @returns A new object containing only the changed values
 */
export const getUpdate = (jsonData: Record<string, any>, objectSource: Record<string, any> = {}): Record<string, any> => {
    const exactlyUpdated: Record<string, any> = {};

    for (const key in jsonData) {
        // Use Object.prototype to prevent prototype pollution vulnerabilities
        if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
            const value = jsonData[key];
            const sourceValue = objectSource[key];

            // 1. Ignore undefined values
            if (value !== undefined) {
                
                // 2. Handle nested objects
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const nestedUpdate = getUpdate(value, sourceValue || {});
                    
                    // Only assign the nested object if it actually contains changes
                    if (Object.keys(nestedUpdate).length > 0) {
                        exactlyUpdated[key] = nestedUpdate;
                    }
                } 
                // 3. Handle primitives and arrays
                else {
                    // Only assign if the value is genuinely different from the database
                    if (value !== sourceValue) {
                        exactlyUpdated[key] = value;
                    }
                }
            }
        }
    }
    
    return exactlyUpdated;
};
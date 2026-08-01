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
        if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
            const value = jsonData[key];
            const sourceValue = objectSource[key];

            // 1. Ignore undefined values
            if (value !== undefined) {
                
                // 2. Handle Arrays
                if (Array.isArray(value)) {
                    // Compare arrays deeply using JSON.stringify
                    // If sourceValue is not an array, or if their stringified contents differ, it's a change
                    if (!Array.isArray(sourceValue) || JSON.stringify(value) !== JSON.stringify(sourceValue)) {
                        exactlyUpdated[key] = value;
                    }
                }
                // 3. Handle nested objects (excluding arrays and null)
                else if (typeof value === 'object' && value !== null) {
                    const nestedUpdate = getUpdate(value, sourceValue || {});
                    
                    if (Object.keys(nestedUpdate).length > 0) {
                        exactlyUpdated[key] = nestedUpdate;
                    }
                } 
                // 4. Handle primitives (strings, numbers, booleans, null)
                else {
                    if (value !== sourceValue) {
                        exactlyUpdated[key] = value;
                    }
                }
            }
        }
    }
    
    return exactlyUpdated;
};
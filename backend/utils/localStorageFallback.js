// LocalStorage fallback for server-side operations
// This module provides a simple in-memory storage when database is not available

let storage = {};

module.exports = {
    get: function(key) {
        return storage[key] || null;
    },
    
    set: function(key, value) {
        storage[key] = value;
        return true;
    },
    
    remove: function(key) {
        delete storage[key];
        return true;
    },
    
    clear: function() {
        storage = {};
        return true;
    },
    
    getAll: function() {
        return { ...storage };
    }
};
